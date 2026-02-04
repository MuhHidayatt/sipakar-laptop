import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface DiagnosisRequest {
  symptoms: string[];
  symptomNames: string[];
  cfResults: {
    kode_kerusakan: string;
    nama_kerusakan: string;
    nilai_cf: number;
    persentase: number;
    solusi: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT verification failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { symptoms, symptomNames, cfResults }: DiagnosisRequest = await req.json();

    // Input validation - limit symptoms to prevent resource exhaustion
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No symptoms provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (symptoms.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Too many symptoms. Maximum 50 allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate symptomNames array
    if (!symptomNames || !Array.isArray(symptomNames) || symptomNames.length !== symptoms.length) {
      return new Response(
        JSON.stringify({ error: 'Invalid symptomNames array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate cfResults array
    if (!Array.isArray(cfResults) || cfResults.length > 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid cfResults array. Maximum 10 results allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing AI diagnosis for symptoms:', symptomNames, 'user:', userId);

    // Build the prompt for AI analysis
    const systemPrompt = `Anda adalah sistem pakar diagnosa kerusakan laptop yang sangat berpengalaman. Tugas Anda adalah:
1. Menganalisis gejala-gejala yang diberikan
2. Memvalidasi hasil diagnosa dari sistem Certainty Factor
3. Memberikan analisis tambahan dan insight yang mungkin terlewat
4. Memberikan tingkat keyakinan AI (0-100%) untuk hasil utama

Berikan respons dalam format JSON dengan struktur:
{
  "ai_confidence": number (0-100),
  "validation": "agree" | "partial" | "disagree",
  "analysis": "string penjelasan analisis",
  "additional_insights": "string insight tambahan",
  "recommended_priority": "high" | "medium" | "low",
  "alternative_causes": ["array kemungkinan penyebab lain yang terlewat"]
}

Pertimbangkan hubungan antar gejala dan berikan analisis mendalam berdasarkan pengetahuan teknis laptop.`;

    const userPrompt = `Analisis diagnosa laptop dengan gejala berikut:

GEJALA YANG DIALAMI:
${symptomNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

HASIL DIAGNOSA SISTEM CF:
${cfResults.map((r, i) => `${i + 1}. ${r.nama_kerusakan} (${r.kode_kerusakan}) - Keyakinan: ${r.persentase}%
   Solusi: ${r.solusi}`).join('\n\n')}

Berikan validasi dan analisis AI Anda terhadap hasil diagnosa di atas.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
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
        JSON.stringify({ error: 'AI analysis failed' }),
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

    // Parse AI response
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Return a default structured response if parsing fails
      aiAnalysis = {
        ai_confidence: 70,
        validation: 'partial',
        analysis: aiContent,
        additional_insights: 'Analisis AI tidak dapat diformat dengan benar.',
        recommended_priority: 'medium',
        alternative_causes: []
      };
    }

    console.log('AI diagnosis completed successfully for user:', userId);

    return new Response(
      JSON.stringify({
        success: true,
        ai_analysis: aiAnalysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI diagnosis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
