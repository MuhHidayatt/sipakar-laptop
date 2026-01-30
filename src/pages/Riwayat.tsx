import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { interpretCF } from '@/lib/diagnosis-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  Loader2, 
  Calendar, 
  AlertCircle,
  ChevronRight,
  FileDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface Konsultasi {
  id: string;
  tanggal: string;
  gejala_dipilih: string[];
  hasil_kerusakan: string | null;
  nama_kerusakan: string | null;
  nilai_cf: number | null;
  solusi: string | null;
}

export default function Riwayat() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [konsultasiList, setKonsultasiList] = useState<Konsultasi[]>([]);
  const [loading, setLoading] = useState(true);

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
      setKonsultasiList(data || []);
    } catch (error) {
      console.error('Error fetching konsultasi:', error);
      toast.error('Gagal memuat riwayat');
    } finally {
      setLoading(false);
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
                          
                          <h3 className="text-lg font-semibold mb-2">
                            {konsultasi.nama_kerusakan || 'Tidak terdeteksi'}
                          </h3>
                          
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant={konsultasi.hasil_kerusakan ? 'default' : 'secondary'}>
                              {konsultasi.hasil_kerusakan || 'N/A'}
                            </Badge>
                            {konsultasi.nilai_cf && (
                              <Badge variant={interpretCF(konsultasi.nilai_cf).color === 'success' ? 'default' : 'outline'}>
                                {Math.round(konsultasi.nilai_cf * 100)}% {interpretCF(konsultasi.nilai_cf).label}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {konsultasi.gejala_dipilih.length} gejala dipilih
                          </p>
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
    </Layout>
  );
}
