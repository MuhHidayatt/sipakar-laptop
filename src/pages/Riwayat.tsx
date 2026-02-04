import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { interpretCF } from '@/lib/diagnosis-engine';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  History, 
  Loader2, 
  Calendar, 
  AlertCircle,
  FileDown,
  Camera,
  ClipboardList,
  Expand,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface ImageAnalysis {
  detected_issues?: Array<{
    issue: string;
    severity: string;
    location: string;
    description: string;
    image_index?: number;
  }>;
  confidence: number;
  diagnosis_summary: string;
  recommended_repairs?: string[];
  estimated_urgency?: string;
  additional_notes?: string;
  images_analyzed?: number;
}

interface Konsultasi {
  id: string;
  tanggal: string;
  gejala_dipilih: string[];
  hasil_kerusakan: string | null;
  nama_kerusakan: string | null;
  nilai_cf: number | null;
  solusi: string | null;
  tipe_konsultasi?: string | null;
  image_analysis?: ImageAnalysis | null;
  image_urls?: string[] | null;
}

export default function Riwayat() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [konsultasiList, setKonsultasiList] = useState<Konsultasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [konsultasiToDelete, setKonsultasiToDelete] = useState<Konsultasi | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchKonsultasi();
    }
  }, [user]);

  const fetchKonsultasi = async () => {
    try {
      const { data, error } = await supabase
        .from('konsultasi')
        .select('*')
        .eq('user_id', user?.id)
        .order('tanggal', { ascending: false });

      if (error) throw error;
      setKonsultasiList((data || []).map(item => ({
        ...item,
        image_analysis: item.image_analysis as unknown as ImageAnalysis | null,
        image_urls: (item as any).image_urls as string[] | null,
      })));
    } catch (error) {
      console.error('Error fetching konsultasi:', error);
      toast.error('Gagal memuat riwayat');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (konsultasi: Konsultasi) => {
    setKonsultasiToDelete(konsultasi);
    setDeleteDialogOpen(true);
  };

  const deleteKonsultasi = async () => {
    if (!konsultasiToDelete || !user) return;
    
    setDeleting(true);
    try {
      // Delete images from storage if they exist
      if (konsultasiToDelete.image_urls && konsultasiToDelete.image_urls.length > 0) {
        const filePaths = konsultasiToDelete.image_urls.map(url => {
          // Extract path from URL: consultation-images/user_id/filename
          const match = url.match(/consultation-images\/(.+)$/);
          return match ? match[1] : null;
        }).filter(Boolean) as string[];

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('consultation-images')
            .remove(filePaths);
          
          if (storageError) {
            console.error('Error deleting images:', storageError);
          }
        }
      }

      // Delete the consultation record
      const { error } = await supabase
        .from('konsultasi')
        .delete()
        .eq('id', konsultasiToDelete.id);

      if (error) throw error;

      setKonsultasiList(prev => prev.filter(k => k.id !== konsultasiToDelete.id));
      toast.success('Riwayat berhasil dihapus');
    } catch (error) {
      console.error('Error deleting konsultasi:', error);
      toast.error('Gagal menghapus riwayat');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setKonsultasiToDelete(null);
    }
  };

  const exportPDF = (konsultasi: Konsultasi) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('SIPAKAR LAPTOP', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Riwayat Diagnosa Kerusakan Laptop', 105, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Tanggal Konsultasi: ${format(new Date(konsultasi.tanggal), 'EEEE, d MMMM yyyy HH:mm', { locale: id })}`, 105, 36, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Hasil Diagnosa:', 14, 50);
    
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text(konsultasi.nama_kerusakan || '-', 14, 60);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Tingkat Keyakinan: ${konsultasi.nilai_cf ? Math.round(konsultasi.nilai_cf * 100) : 0}%`, 14, 70);

    doc.setFontSize(12);
    doc.text('Gejala yang Dipilih:', 14, 85);
    
    autoTable(doc, {
      startY: 90,
      head: [['No', 'Kode Gejala']],
      body: konsultasi.gejala_dipilih.map((g, i) => [i + 1, g]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });

    if (konsultasi.solusi) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Solusi Perbaikan:', 14, finalY);
      
      const splitSolusi = doc.splitTextToSize(konsultasi.solusi, 180);
      doc.setFontSize(10);
      doc.text(splitSolusi, 14, finalY + 8);
    }

    doc.save(`riwayat-diagnosa-${format(new Date(konsultasi.tanggal), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF berhasil diunduh');
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Memuat riwayat...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <History className="h-4 w-4" />
              Riwayat Konsultasi
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Riwayat Diagnosa Anda
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Lihat semua hasil diagnosa kerusakan laptop yang pernah Anda lakukan
            </p>
          </motion.div>

          {konsultasiList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Belum Ada Riwayat</h3>
                <p className="text-muted-foreground mb-6">
                  Anda belum pernah melakukan konsultasi diagnosa.
                </p>
                <Button onClick={() => navigate('/konsultasi')}>
                  Mulai Konsultasi
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {konsultasiList.map((konsultasi, index) => (
                <motion.div
                  key={konsultasi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(konsultasi.tanggal), 'EEEE, d MMMM yyyy - HH:mm', { locale: id })}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">
                              {konsultasi.nama_kerusakan || 'Tidak terdeteksi'}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {konsultasi.tipe_konsultasi === 'gambar' ? (
                                <><Camera className="h-3 w-3 mr-1" /> Gambar</>
                              ) : (
                                <><ClipboardList className="h-3 w-3 mr-1" /> Gejala</>
                              )}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-3 mb-3">
                            {konsultasi.tipe_konsultasi === 'gambar' && konsultasi.image_analysis ? (
                              <Badge variant={
                                konsultasi.image_analysis.estimated_urgency === 'segera' ? 'destructive' : 
                                konsultasi.image_analysis.estimated_urgency === 'dalam waktu dekat' ? 'default' : 'secondary'
                              }>
                                {konsultasi.image_analysis.estimated_urgency || 'N/A'}
                              </Badge>
                            ) : (
                              <Badge variant={konsultasi.hasil_kerusakan ? 'default' : 'secondary'}>
                                {konsultasi.hasil_kerusakan || 'N/A'}
                              </Badge>
                            )}
                            {konsultasi.nilai_cf && (
                              <Badge variant={interpretCF(konsultasi.nilai_cf).color === 'success' ? 'default' : 'outline'}>
                                {Math.round(konsultasi.nilai_cf * 100)}% {interpretCF(konsultasi.nilai_cf).label}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {konsultasi.tipe_konsultasi === 'gambar' 
                              ? `${konsultasi.image_analysis?.detected_issues?.length || 0} masalah terdeteksi${konsultasi.image_urls?.length ? ` • ${konsultasi.image_urls.length} gambar` : ''}`
                              : `${konsultasi.gejala_dipilih.length} gejala dipilih`
                            }
                          </p>
                          
                          {/* Display Images */}
                          {konsultasi.image_urls && konsultasi.image_urls.length > 0 && (
                            <div className="flex gap-2 mt-3 flex-wrap items-center">
                              {konsultasi.image_urls.slice(0, 4).map((url, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => openLightbox(konsultasi.image_urls!, idx)}
                                  className="relative w-16 h-16 rounded overflow-hidden bg-muted group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <img 
                                    src={url} 
                                    alt={`Gambar ${idx + 1}`}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <Expand className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </button>
                              ))}
                              {konsultasi.image_urls.length > 4 && (
                                <button
                                  onClick={() => openLightbox(konsultasi.image_urls!, 4)}
                                  className="w-16 h-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                >
                                  +{konsultasi.image_urls.length - 4}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportPDF(konsultasi)}
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(konsultasi)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {konsultasi.solusi && (
                        <>
                          <Separator className="my-4" />
                          <div className="text-sm">
                            <span className="font-medium">Solusi: </span>
                            <span className="text-muted-foreground">{konsultasi.solusi}</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Riwayat Konsultasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Riwayat konsultasi dan semua gambar terkait akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteKonsultasi}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
