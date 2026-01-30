import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Plus, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('gejala');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [gejalaList, setGejalaList] = useState<any[]>([]);
  const [kerusakanList, setKerusakanList] = useState<any[]>([]);
  const [ruleList, setRuleList] = useState<any[]>([]);
  const [konsultasiList, setKonsultasiList] = useState<any[]>([]);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
      toast.error('Akses ditolak. Anda bukan admin.');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchAllData();
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      const [g, k, r, c] = await Promise.all([
        supabase.from('gejala').select('*').order('kode_gejala'),
        supabase.from('kerusakan').select('*').order('kode_kerusakan'),
        supabase.from('rule').select('*').order('kode_gejala'),
        supabase.from('konsultasi').select('*').order('tanggal', { ascending: false }).limit(50),
      ]);
      setGejalaList(g.data || []);
      setKerusakanList(k.data || []);
      setRuleList(r.data || []);
      setKonsultasiList(c.data || []);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'gejala') {
        if (editingItem) {
          await supabase.from('gejala').update(formData).eq('id', editingItem.id);
        } else {
          await supabase.from('gejala').insert(formData);
        }
      } else if (activeTab === 'kerusakan') {
        if (editingItem) {
          await supabase.from('kerusakan').update(formData).eq('id', editingItem.id);
        } else {
          await supabase.from('kerusakan').insert(formData);
        }
      } else if (activeTab === 'rules') {
        if (editingItem) {
          await supabase.from('rule').update(formData).eq('id', editingItem.id);
        } else {
          await supabase.from('rule').insert(formData);
        }
      }
      toast.success(editingItem ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
      setDialogOpen(false);
      setEditingItem(null);
      setFormData({});
      fetchAllData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    if (activeTab === 'gejala') {
      await supabase.from('gejala').delete().eq('id', id);
    } else if (activeTab === 'kerusakan') {
      await supabase.from('kerusakan').delete().eq('id', id);
    } else if (activeTab === 'rules') {
      await supabase.from('rule').delete().eq('id', id);
    }
    toast.success('Data dihapus');
    fetchAllData();
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({});
    setDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setDialogOpen(true);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Kelola data sistem pakar SIPAKAR LAPTOP</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="pt-6 text-center"><div className="text-3xl font-bold text-primary">{gejalaList.length}</div><p className="text-sm text-muted-foreground">Gejala</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><div className="text-3xl font-bold text-primary">{kerusakanList.length}</div><p className="text-sm text-muted-foreground">Kerusakan</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><div className="text-3xl font-bold text-primary">{ruleList.length}</div><p className="text-sm text-muted-foreground">Rules</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><div className="text-3xl font-bold text-primary">{konsultasiList.length}</div><p className="text-sm text-muted-foreground">Konsultasi</p></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="gejala">Gejala</TabsTrigger>
            <TabsTrigger value="kerusakan">Kerusakan</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="konsultasi">Riwayat</TabsTrigger>
          </TabsList>

          <TabsContent value="gejala">
            <Card>
              <CardHeader className="flex-row justify-between items-center">
                <CardTitle>Data Gejala</CardTitle>
                <Button onClick={openAddDialog}><Plus className="h-4 w-4 mr-2" />Tambah</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama Gejala</TableHead><TableHead className="w-[100px]">Aksi</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {gejalaList.map(g => (
                      <TableRow key={g.id}>
                        <TableCell><Badge variant="outline">{g.kode_gejala}</Badge></TableCell>
                        <TableCell>{g.nama_gejala}</TableCell>
                        <TableCell className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(g)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(g.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kerusakan">
            <Card>
              <CardHeader className="flex-row justify-between items-center">
                <CardTitle>Data Kerusakan</CardTitle>
                <Button onClick={openAddDialog}><Plus className="h-4 w-4 mr-2" />Tambah</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama</TableHead><TableHead>Solusi</TableHead><TableHead className="w-[100px]">Aksi</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {kerusakanList.map(k => (
                      <TableRow key={k.id}>
                        <TableCell><Badge variant="outline">{k.kode_kerusakan}</Badge></TableCell>
                        <TableCell>{k.nama_kerusakan}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{k.solusi}</TableCell>
                        <TableCell className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(k)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(k.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <Card>
              <CardHeader className="flex-row justify-between items-center">
                <CardTitle>Data Rules</CardTitle>
                <Button onClick={openAddDialog}><Plus className="h-4 w-4 mr-2" />Tambah</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Gejala</TableHead><TableHead>Kerusakan</TableHead><TableHead>CF</TableHead><TableHead className="w-[100px]">Aksi</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {ruleList.map(r => (
                      <TableRow key={r.id}>
                        <TableCell><Badge variant="outline">{r.kode_gejala}</Badge></TableCell>
                        <TableCell><Badge>{r.kode_kerusakan}</Badge></TableCell>
                        <TableCell>{r.cf}</TableCell>
                        <TableCell className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(r)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="konsultasi">
            <Card>
              <CardHeader><CardTitle>Riwayat Konsultasi</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Hasil</TableHead><TableHead>CF</TableHead><TableHead>Gejala</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {konsultasiList.map(k => (
                      <TableRow key={k.id}>
                        <TableCell>{new Date(k.tanggal).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{k.nama_kerusakan || '-'}</TableCell>
                        <TableCell>{k.nilai_cf ? `${Math.round(k.nilai_cf * 100)}%` : '-'}</TableCell>
                        <TableCell>{k.gejala_dipilih?.length || 0} gejala</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Tambah'} {activeTab === 'rules' ? 'Rule' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {activeTab === 'gejala' && (
                <>
                  <div><Label>Kode Gejala</Label><Input value={formData.kode_gejala || ''} onChange={e => setFormData({...formData, kode_gejala: e.target.value})} placeholder="G01" /></div>
                  <div><Label>Nama Gejala</Label><Input value={formData.nama_gejala || ''} onChange={e => setFormData({...formData, nama_gejala: e.target.value})} placeholder="Laptop tidak menyala" /></div>
                </>
              )}
              {activeTab === 'kerusakan' && (
                <>
                  <div><Label>Kode Kerusakan</Label><Input value={formData.kode_kerusakan || ''} onChange={e => setFormData({...formData, kode_kerusakan: e.target.value})} placeholder="K01" /></div>
                  <div><Label>Nama Kerusakan</Label><Input value={formData.nama_kerusakan || ''} onChange={e => setFormData({...formData, nama_kerusakan: e.target.value})} placeholder="RAM Rusak" /></div>
                  <div><Label>Solusi</Label><Textarea value={formData.solusi || ''} onChange={e => setFormData({...formData, solusi: e.target.value})} placeholder="Ganti RAM dengan yang baru..." /></div>
                </>
              )}
              {activeTab === 'rules' && (
                <>
                  <div><Label>Kode Gejala</Label>
                    <Select value={formData.kode_gejala || ''} onValueChange={v => setFormData({...formData, kode_gejala: v})}>
                      <SelectTrigger><SelectValue placeholder="Pilih gejala" /></SelectTrigger>
                      <SelectContent>{gejalaList.map(g => <SelectItem key={g.kode_gejala} value={g.kode_gejala}>{g.kode_gejala} - {g.nama_gejala}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Kode Kerusakan</Label>
                    <Select value={formData.kode_kerusakan || ''} onValueChange={v => setFormData({...formData, kode_kerusakan: v})}>
                      <SelectTrigger><SelectValue placeholder="Pilih kerusakan" /></SelectTrigger>
                      <SelectContent>{kerusakanList.map(k => <SelectItem key={k.kode_kerusakan} value={k.kode_kerusakan}>{k.kode_kerusakan} - {k.nama_kerusakan}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Certainty Factor (0-1)</Label><Input type="number" step="0.1" min="0" max="1" value={formData.cf || ''} onChange={e => setFormData({...formData, cf: parseFloat(e.target.value)})} placeholder="0.8" /></div>
                </>
              )}
              <Button onClick={handleSave} className="w-full">Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
