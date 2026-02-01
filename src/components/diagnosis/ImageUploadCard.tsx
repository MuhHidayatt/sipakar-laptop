import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadCardProps {
  onImageSelect: (base64: string, mimeType: string) => void;
  isAnalyzing: boolean;
}

export function ImageUploadCard({ onImageSelect, isAnalyzing }: ImageUploadCardProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Pilih file gambar (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 10MB');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      
      // Extract base64 data (remove data:image/xxx;base64, prefix)
      const base64Data = result.split(',')[1];
      onImageSelect(base64Data, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreview(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileSelect({ target: { files: dataTransfer.files } } as any);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5" />
          Diagnosa dengan Gambar
        </CardTitle>
        <CardDescription>
          Upload foto laptop Anda untuk analisis visual menggunakan AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isAnalyzing}
        />

        {!preview ? (
          <div
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">Klik untuk upload atau drag & drop</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP (Maks. 10MB)</p>
            <div className="flex flex-wrap gap-1 mt-3 justify-center">
              <Badge variant="outline" className="text-xs">Layar Rusak</Badge>
              <Badge variant="outline" className="text-xs">Error Screen</Badge>
              <Badge variant="outline" className="text-xs">Kerusakan Fisik</Badge>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-contain"
              />
              {!isAnalyzing && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Menganalisis gambar...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{fileName}</span>
              </div>
              {!isAnalyzing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Ganti Gambar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
