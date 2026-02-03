import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ImageData {
  base64: string;
  mimeType: string;
}

interface ImageDiagnosisRequest {
  images: ImageData[];
  // Legacy support for single image
  imageBase64?: string;
  mimeType?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ImageDiagnosisRequest = await req.json();
    
    // Handle both new multi-image format and legacy single image format
    let imagesToProcess: ImageData[] = [];
    
    if (body.images && body.images.length > 0) {
      imagesToProcess = body.images;
    } else if (body.imageBase64) {
      // Legacy single image support
      imagesToProcess = [{ base64: body.imageBase64, mimeType: body.mimeType || 'image/jpeg' }];
    }

    if (imagesToProcess.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${imagesToProcess.length} image(s) for diagnosis`);

    const systemPrompt = `Anda adalah sistem pakar diagnosa kerusakan laptop yang sangat berpengalaman dalam menganalisis gambar/foto laptop.

Tugas Anda:
1. Analisis semua gambar laptop yang diberikan
2. Identifikasi kerusakan fisik atau masalah yang terlihat dari setiap gambar
3. Gabungkan temuan dari semua gambar untuk diagnosa komprehensif
4. Berikan solusi perbaikan yang sesuai

Jika gambar menunjukkan:
- Layar: Cari dead pixel, garis, retak, backlight bleeding
- Casing: Cari retakan, penyok, kerusakan fisik
- Keyboard: Cari tombol rusak, hilang, atau kotor
- Port: Cari kerusakan pada port USB, charger, dll
- Motherboard/internal: Cari komponen terbakar, kapasitor bengkak
- Error screen: Baca dan analisis pesan error (BSOD, dll)

Berikan respons dalam format JSON:
{
  "detected_issues": [
    {
      "issue": "nama masalah",
      "severity": "ringan" | "sedang" | "berat",
      "location": "lokasi masalah pada laptop",
      "description": "deskripsi detail masalah",
      "image_index": number (indeks gambar yang menunjukkan masalah, dimulai dari 0)
    }
  ],
  "confidence": number (0-100),
  "diagnosis_summary": "ringkasan diagnosa keseluruhan dari semua gambar",
  "recommended_repairs": ["array solusi perbaikan"],
  "estimated_urgency": "segera" | "dalam waktu dekat" | "bisa ditunda",
  "additional_notes": "catatan tambahan jika ada",
  "images_analyzed": number (jumlah gambar yang dianalisis)
}

Jika gambar tidak menunjukkan laptop atau tidak jelas, berikan respons yang sesuai dengan confidence rendah.`;

    // Build content array with all images
    const userContent: any[] = [
      {
        type: 'text',
        text: `Analisis ${imagesToProcess.length} gambar laptop berikut dan identifikasi semua kerusakan atau masalah yang terlihat:`
      }
    ];

    // Add each image to the content
    for (const img of imagesToProcess) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${img.mimeType};base64,${img.base64}`
        }
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credit limit reached.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Image analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error('No AI content received');
      return new Response(
        JSON.stringify({ error: 'No AI response received' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let imageAnalysis;
    try {
      imageAnalysis = JSON.parse(aiContent);
      // Ensure images_analyzed is set
      imageAnalysis.images_analyzed = imagesToProcess.length;
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      imageAnalysis = {
        detected_issues: [],
        confidence: 50,
        diagnosis_summary: aiContent,
        recommended_repairs: [],
        estimated_urgency: 'dalam waktu dekat',
        additional_notes: 'Format respons tidak dapat diproses dengan benar.',
        images_analyzed: imagesToProcess.length
      };
    }

    console.log(`Image diagnosis completed successfully for ${imagesToProcess.length} image(s)`);

    return new Response(
      JSON.stringify({
        success: true,
        image_analysis: imageAnalysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Image diagnosis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
