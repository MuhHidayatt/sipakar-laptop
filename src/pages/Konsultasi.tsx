import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { diagnose, interpretCF } from '@/lib/diagnosis-engine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIAnalysisCard } from '@/components/diagnosis/AIAnalysisCard';
import { ImageUploadCard } from '@/components/diagnosis/ImageUploadCard';
import { ImageAnalysisResult } from '@/components/diagnosis/ImageAnalysisResult';
import { 
  Laptop, 
  Search, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  FileDown,
  RefreshCw,
  Wrench,
  Brain,
  Camera,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Gejala {
  id: string;
  kode_gejala: string;
  nama_gejala: string;
}

interface Kerusakan {
  kode_kerusakan: string;
  nama_kerusakan: string;
  solusi: string;
}

interface Rule {
  kode_gejala: string;
  kode_kerusakan: string;
  cf: number;
}

interface DiagnosisResult {
  kode_kerusakan: string;
  nama_kerusakan: string;
  nilai_cf: number;
  persentase: number;
  solusi: string;
  gejala_terkait: string[];
}

interface AIAnalysis {
  ai_confidence: number;
  validation: 'agree' | 'partial' | 'disagree';
  analysis: string;
  additional_insights: string;
  recommended_priority: 'high' | 'medium' | 'low';
  alternative_causes: string[];
}

interface DetectedIssue {
  issue: string;
  severity: 'ringan' | 'sedang' | 'berat';
  location: string;
  description: string;
}

interface ImageAnalysis {
  detected_issues: DetectedIssue[];
  confidence: number;
  diagnosis_summary: string;
  recommended_repairs: string[];
  estimated_urgency: 'segera' | 'dalam waktu dekat' | 'bisa ditunda';
  additional_notes: string;
}

export default function Konsultasi() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
  const [kerusakanList, setKerusakanList] = useState<Kerusakan[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedGejala, setSelectedGejala] = useState<string[]>([]);
  const [results, setResults] = useState<DiagnosisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagnosing, setDiagnosing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Image diagnosis state
  const [selectedImages, setSelectedImages] = useState<{ base64: string; mimeType: string }[]>([]);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [showImageResults, setShowImageResults] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('symptoms');
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gejalaRes, kerusakanRes, ruleRes] = await Promise.all([
        supabase.from('gejala').select('*').order('kode_gejala'),
        supabase.from('kerusakan').select('*'),
        supabase.from('rule').select('*'),
      ]);

      if (gejalaRes.error) throw gejalaRes.error;
      if (kerusakanRes.error) throw kerusakanRes.error;
      if (ruleRes.error) throw ruleRes.error;

      setGejalaList(gejalaRes.data || []);
      setKerusakanList(kerusakanRes.data || []);
      setRules(ruleRes.data?.map(r => ({
        kode_gejala: r.kode_gejala,
        kode_kerusakan: r.kode_kerusakan,
        cf: Number(r.cf),
      })) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data gejala');
    } finally {
      setLoading(false);
    }
  };

  const handleGejalaToggle = (kodeGejala: string) => {
    setSelectedGejala(prev =>
      prev.includes(kodeGejala)
        ? prev.filter(g => g !== kodeGejala)
        : [...prev, kodeGejala]
    );
  };

  const handleDiagnose = async () => {
    if (selectedGejala.length === 0) {
      toast.error('Pilih minimal satu gejala');
      return;
    }

    setDiagnosing(true);
    setAiAnalysis(null);
    
    // Simulate processing delay for UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const diagnosisResults = diagnose(selectedGejala, rules, kerusakanList);
    setResults(diagnosisResults);
    setShowResults(true);
    setDiagnosing(false);

    // Start AI analysis in parallel
    if (diagnosisResults.length > 0) {
      setAiLoading(true);
      
      // Get symptom names for AI
      const symptomNames = selectedGejala.map(kg => {
        const g = gejalaList.find(gj => gj.kode_gejala === kg);
        return g?.nama_gejala || kg;
      });

      try {
        const { data, error } = await supabase.functions.invoke('ai-diagnosis', {
          body: {
            symptoms: selectedGejala,
            symptomNames,
            cfResults: diagnosisResults.slice(0, 5).map(r => ({
              kode_kerusakan: r.kode_kerusakan,
              nama_kerusakan: r.nama_kerusakan,
              nilai_cf: r.nilai_cf,
              persentase: r.persentase,
              solusi: r.solusi,
            })),
          },
        });

        if (error) {
          console.error('AI analysis error:', error);
          toast.error('Analisis AI gagal, tetapi hasil CF tetap valid');
        } else if (data?.ai_analysis) {
          setAiAnalysis(data.ai_analysis);
        }
      } catch (err) {
        console.error('AI analysis failed:', err);
      } finally {
        setAiLoading(false);
      }
    }

    // Save consultation if user is logged in
    if (user && diagnosisResults.length > 0) {
      const topResult = diagnosisResults[0];
      try {
        await supabase.from('konsultasi').insert({
          user_id: user.id,
          gejala_dipilih: selectedGejala,
          hasil_kerusakan: topResult.kode_kerusakan,
          nama_kerusakan: topResult.nama_kerusakan,
          nilai_cf: topResult.nilai_cf,
          solusi: topResult.solusi,
          tipe_konsultasi: 'gejala',
        });
      } catch (error) {
        console.error('Error saving consultation:', error);
      }
    }
  };

  const handleReset = () => {
    setSelectedGejala([]);
    setResults([]);
    setShowResults(false);
    setAiAnalysis(null);
    setAiLoading(false);
    // Reset image state
    setSelectedImages([]);
    setImageAnalysis(null);
    setShowImageResults(false);
    setUploadedImageUrls([]);
  };

  const handleImagesSelect = useCallback((images: { base64: string; mimeType: string }[]) => {
    setSelectedImages(images);
    setImageAnalysis(null);
    setShowImageResults(false);
  }, []);

  const handleImageDiagnose = async () => {
    if (selectedImages.length === 0) {
      toast.error('Pilih gambar terlebih dahulu');
      return;
    }

    setImageAnalyzing(true);
    
    try {
      // Upload images to storage first
      const imageUrls: string[] = [];
      
      if (user) {
        for (let i = 0; i < selectedImages.length; i++) {
          const img = selectedImages[i];
          const timestamp = Date.now();
          const ext = img.mimeType.split('/')[1] || 'jpg';
          const fileName = `${user.id}/${timestamp}_${i}.${ext}`;
          
          // Convert base64 to blob
          const byteCharacters = atob(img.base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: img.mimeType });

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('consultation-images')
            .upload(fileName, blob, { contentType: img.mimeType });

          if (uploadError) {
            console.error('Upload error:', uploadError);
          } else if (uploadData) {
            // Use signed URL for private bucket
            const { data: urlData } = await supabase.storage
              .from('consultation-images')
              .createSignedUrl(uploadData.path, 3600); // 1 hour expiry
            if (urlData?.signedUrl) {
              imageUrls.push(urlData.signedUrl);
            }
          }
        }
        setUploadedImageUrls(imageUrls);
      }

      // Send images to AI for analysis
      const { data, error } = await supabase.functions.invoke('ai-diagnosis-image', {
        body: {
          images: selectedImages,
        },
      });

      if (error) {
        console.error('Image analysis error:', error);
        toast.error('Analisis gambar gagal. Silakan coba lagi.');
        return;
      }

      if (data?.image_analysis) {
        const analysis = data.image_analysis as ImageAnalysis;
        setImageAnalysis(analysis);
        setShowImageResults(true);
        toast.success(`Analisis ${selectedImages.length} gambar selesai!`);

        // Save to database if user is logged in
        if (user) {
          try {
            const topIssue = analysis.detected_issues?.[0];
            await supabase.from('konsultasi').insert({
              user_id: user.id,
              gejala_dipilih: analysis.detected_issues?.map(i => i.issue) || [],
              hasil_kerusakan: topIssue?.severity || null,
              nama_kerusakan: analysis.diagnosis_summary || 'Analisis Gambar',
              nilai_cf: analysis.confidence / 100,
              solusi: analysis.recommended_repairs?.join('; ') || null,
              tipe_konsultasi: 'gambar',
              image_analysis: analysis as any,
              image_urls: imageUrls,
            });
          } catch (saveError) {
            console.error('Error saving image consultation:', saveError);
          }
        }
      }
    } catch (err) {
      console.error('Image analysis failed:', err);
      toast.error('Terjadi kesalahan saat menganalisis gambar');
    } finally {
      setImageAnalyzing(false);
    }
  };

  const handleImageReset = () => {
    setSelectedImages([]);
    setImageAnalysis(null);
    setShowImageResults(false);
    setUploadedImageUrls([]);
  };

  const exportPDF = () => {
    if (results.length === 0) return;

    const doc = new jsPDF();
    const topResult = results[0];
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('SIPAKAR LAPTOP', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Hasil Diagnosa Kerusakan Laptop', 105, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 105, 36, { align: 'center' });

    // Main Result
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Hasil Diagnosa Utama:', 14, 50);
    
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text(topResult.nama_kerusakan, 14, 60);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Tingkat Keyakinan: ${topResult.persentase}%`, 14, 70);

    // Gejala yang dipilih
    doc.setFontSize(12);
    doc.text('Gejala yang Dipilih:', 14, 85);
    
    const selectedGejalaNames = selectedGejala.map(kg => {
      const g = gejalaList.find(gj => gj.kode_gejala === kg);
      return g ? `${g.kode_gejala} - ${g.nama_gejala}` : kg;
    });
    
    autoTable(doc, {
      startY: 90,
      head: [['No', 'Kode', 'Gejala']],
      body: selectedGejalaNames.map((g, i) => [
        i + 1,
        g.split(' - ')[0],
        g.split(' - ')[1] || g,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Solusi
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Solusi Perbaikan:', 14, finalY);
    
    const splitSolusi = doc.splitTextToSize(topResult.solusi, 180);
    doc.setFontSize(10);
    doc.text(splitSolusi, 14, finalY + 8);

    // All results
    if (results.length > 1) {
      const solutionfinalY = finalY + 8 + (splitSolusi.length * 5) + 10;
      doc.setFontSize(12);
      doc.text('Kemungkinan Kerusakan Lainnya:', 14, solutionfinalY);
      
      autoTable(doc, {
        startY: solutionfinalY + 5,
        head: [['No', 'Kerusakan', 'Keyakinan']],
        body: results.slice(1).map((r, i) => [
          i + 1,
          r.nama_kerusakan,
          `${r.persentase}%`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
      });
    }

    doc.save('hasil-diagnosa-sipakar-laptop.pdf');
    toast.success('PDF berhasil diunduh');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Memuat data gejala...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Search className="h-4 w-4" />
              Konsultasi Diagnosa
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Diagnosa Kerusakan Laptop
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Pilih metode diagnosa: berdasarkan gejala atau upload gambar laptop untuk analisis visual AI.
            </p>
          </motion.div>

          {/* Diagnosis Method Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="symptoms" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Pilih Gejala
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Upload Gambar
              </TabsTrigger>
            </TabsList>

            {/* Symptoms Tab Content */}
            <TabsContent value="symptoms">
              <AnimatePresence mode="wait">
                {!showResults ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Symptom Selection */}
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Laptop className="h-5 w-5" />
                          Daftar Gejala
                        </CardTitle>
                        <CardDescription>
                          Pilih semua gejala yang sesuai dengan kondisi laptop Anda
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {gejalaList.length === 0 ? (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Belum ada data gejala. Hubungi admin untuk menambahkan data.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-3">
                            {gejalaList.map((gejala) => (
                              <div
                                key={gejala.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                  selectedGejala.includes(gejala.kode_gejala)
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => handleGejalaToggle(gejala.kode_gejala)}
                              >
                                <Checkbox
                                  checked={selectedGejala.includes(gejala.kode_gejala)}
                                  onCheckedChange={() => handleGejalaToggle(gejala.kode_gejala)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {gejala.kode_gejala}
                                    </Badge>
                                  </div>
                                  <p className="text-sm mt-1">{gejala.nama_gejala}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                {/* Selected Summary */}
                {selectedGejala.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="mb-6 border-primary/30 bg-primary/5">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Gejala Terpilih</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedGejala.length} gejala dipilih
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedGejala([])}
                          >
                            Reset
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Diagnose Button */}
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleDiagnose}
                    disabled={selectedGejala.length === 0 || diagnosing}
                    className="shadow-glow"
                  >
                    {diagnosing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Menganalisis...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        Proses Diagnosa
                      </>
                    )}
                  </Button>
                </div>

                {!user && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    <a href="/auth" className="text-primary hover:underline">Masuk</a> untuk menyimpan riwayat konsultasi
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Results */}
                {results.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Tidak Ada Hasil</h3>
                      <p className="text-muted-foreground mb-6">
                        Sistem tidak dapat menentukan kerusakan berdasarkan gejala yang dipilih.
                        Coba pilih gejala yang lebih spesifik.
                      </p>
                      <Button onClick={handleReset}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Diagnosa Ulang
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Main Result */}
                    <Card className="mb-6 border-primary/30 overflow-hidden">
                      <div className="gradient-primary p-6 text-primary-foreground">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm opacity-90 mb-1">Hasil Diagnosa Utama (Certainty Factor)</p>
                            <h2 className="text-2xl md:text-3xl font-bold mb-2">
                              {results[0].nama_kerusakan}
                            </h2>
                            <Badge variant="secondary" className="text-sm">
                              {results[0].kode_kerusakan}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-4xl font-bold">{results[0].persentase}%</div>
                            <div className="text-sm opacity-90">
                              {interpretCF(results[0].nilai_cf).label}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Progress value={results[0].persentase} className="h-2 bg-primary-foreground/20" />
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                          <Wrench className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="font-semibold mb-2">Solusi Perbaikan</h4>
                            <p className="text-muted-foreground">{results[0].solusi}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI Analysis Card */}
                    {(aiLoading || aiAnalysis) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                      >
                        {aiLoading ? (
                          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Brain className="h-5 w-5 animate-pulse" />
                                Analisis AI Sedang Memproses...
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                                <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                                <div className="h-4 bg-muted animate-pulse rounded w-2/3"></div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : aiAnalysis ? (
                          <AIAnalysisCard analysis={aiAnalysis} />
                        ) : null}
                      </motion.div>
                    )}

                    {/* Other Results */}
                    {results.length > 1 && (
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="text-lg">Kemungkinan Lainnya</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {results.slice(1).map((result, index) => (
                              <div key={result.kode_kerusakan}>
                                {index > 0 && <Separator className="my-4" />}
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline">{result.kode_kerusakan}</Badge>
                                      <span className="font-medium">{result.nama_kerusakan}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{result.solusi}</p>
                                  </div>
                                  <div className="text-right shrink-0 ml-4">
                                    <div className="text-xl font-semibold">{result.persentase}%</div>
                                    <Badge variant={interpretCF(result.nilai_cf).color === 'success' ? 'default' : 'secondary'}>
                                      {interpretCF(result.nilai_cf).label}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Selected Symptoms */}
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-lg">Gejala yang Dipilih</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedGejala.map(kg => {
                            const g = gejalaList.find(gj => gj.kode_gejala === kg);
                            return (
                              <Badge key={kg} variant="secondary" className="text-sm py-1.5">
                                <CheckCircle2 className="h-3 w-3 mr-1.5" />
                                {g?.nama_gejala || kg}
                              </Badge>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline" onClick={handleReset}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Diagnosa Ulang
                      </Button>
                      <Button onClick={exportPDF}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Export PDF
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Image Tab Content */}
        <TabsContent value="image">
          <AnimatePresence mode="wait">
            {!showImageResults ? (
              <motion.div
                key="image-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <ImageUploadCard 
                  onImagesSelect={handleImagesSelect}
                  isAnalyzing={imageAnalyzing}
                />

                {selectedImages.length > 0 && (
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleImageDiagnose}
                      disabled={imageAnalyzing}
                      className="shadow-glow"
                    >
                      {imageAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Menganalisis {selectedImages.length} Gambar...
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-5 w-5" />
                          Analisis {selectedImages.length} Gambar
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!user && (
                  <p className="text-center text-sm text-muted-foreground">
                    <a href="/auth" className="text-primary hover:underline">Masuk</a> untuk menyimpan riwayat konsultasi
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="image-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {imageAnalysis && (
                  <ImageAnalysisResult analysis={imageAnalysis} />
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={handleImageReset}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Analisis Gambar Lain
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </Layout>
  );
}
