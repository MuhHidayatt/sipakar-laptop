import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Image as ImageIcon, Loader2, Video, VideoOff } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadCardProps {
  onImageSelect: (base64: string, mimeType: string) => void;
  isAnalyzing: boolean;
}

export function ImageUploadCard({ onImageSelect, isAnalyzing }: ImageUploadCardProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Pilih file gambar (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 10MB');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      
      const base64Data = result.split(',')[1];
      onImageSelect(base64Data, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = useCallback(() => {
    setPreview(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      setIsCameraMode(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraMode(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);
    setFileName(`capture_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.jpg`);
    
    const base64Data = dataUrl.split(',')[1];
    onImageSelect(base64Data, 'image/jpeg');
    
    stopCamera();
  }, [onImageSelect, stopCamera]);

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
          Upload foto atau ambil gambar langsung dari kamera untuk analisis visual
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
        <canvas ref={canvasRef} className="hidden" />

        {isCameraMode ? (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="rounded-full h-14 w-14 p-0"
                >
                  <Camera className="h-6 w-6" />
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="destructive"
                  size="icon"
                  className="rounded-full h-10 w-10"
                >
                  <VideoOff className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Arahkan kamera ke laptop yang bermasalah, lalu tekan tombol capture
            </p>
          </div>
        ) : !preview ? (
          <div className="space-y-3">
            <div
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-1">Klik untuk upload atau drag & drop</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP (Maks. 10MB)</p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">atau</span>
              </div>
            </div>

            <Button
              onClick={startCamera}
              variant="outline"
              className="w-full gap-2"
              disabled={isAnalyzing}
            >
              <Video className="h-4 w-4" />
              Ambil Foto dengan Kamera
            </Button>

            <div className="flex flex-wrap gap-1 justify-center">
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startCamera}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Kamera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Ganti
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
