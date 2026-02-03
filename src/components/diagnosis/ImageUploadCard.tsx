import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Image as ImageIcon, Loader2, Video, VideoOff, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ImageData {
  id: string;
  base64: string;
  mimeType: string;
  preview: string;
  fileName: string;
}

interface ImageUploadCardProps {
  onImagesSelect: (images: { base64: string; mimeType: string }[]) => void;
  isAnalyzing: boolean;
}

const MAX_IMAGES = 5;

export function ImageUploadCard({ onImagesSelect, isAnalyzing }: ImageUploadCardProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Notify parent when images change
  useEffect(() => {
    onImagesSelect(images.map(img => ({ base64: img.base64, mimeType: img.mimeType })));
  }, [images, onImagesSelect]);

  // Assign stream to video element after it's rendered
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraMode]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const processFile = useCallback((file: File): Promise<ImageData | null> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Pilih file gambar (JPG, PNG, WebP)');
        resolve(null);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 10MB');
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1];
        resolve({
          id: crypto.randomUUID(),
          base64: base64Data,
          mimeType: file.type,
          preview: result,
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maksimal ${MAX_IMAGES} gambar`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newImages: ImageData[] = [];

    for (const file of filesToProcess) {
      const imageData = await processFile(file);
      if (imageData) {
        newImages.push(imageData);
      }
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setIsCameraMode(true);
      setStream(mediaStream);
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
    if (images.length >= MAX_IMAGES) {
      toast.error(`Maksimal ${MAX_IMAGES} gambar`);
      stopCamera();
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const base64Data = dataUrl.split(',')[1];
    
    const newImage: ImageData = {
      id: crypto.randomUUID(),
      base64: base64Data,
      mimeType: 'image/jpeg',
      preview: dataUrl,
      fileName: `capture_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.jpg`,
    };

    setImages(prev => [...prev, newImage]);
    
    // Keep camera open for more captures if not at max
    if (images.length + 1 >= MAX_IMAGES) {
      stopCamera();
    }
  }, [images.length, stopCamera]);

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maksimal ${MAX_IMAGES} gambar`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newImages: ImageData[] = [];

    for (const file of filesToProcess) {
      const imageData = await processFile(file);
      if (imageData) {
        newImages.push(imageData);
      }
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
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
          Upload hingga {MAX_IMAGES} foto atau ambil gambar dari kamera untuk analisis visual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
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
              <div className="absolute top-2 right-2">
                <Badge variant="secondary">{images.length}/{MAX_IMAGES}</Badge>
              </div>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="rounded-full h-14 w-14 p-0"
                  disabled={images.length >= MAX_IMAGES}
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
              Arahkan kamera ke laptop, tekan tombol capture. Anda bisa ambil beberapa foto.
            </p>
          </div>
        ) : images.length === 0 ? (
          <div className="space-y-3">
            <div
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-1">Klik untuk upload atau drag & drop</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP (Maks. 10MB per gambar)</p>
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
            {/* Image Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative rounded-lg overflow-hidden bg-muted aspect-square group">
                  <img
                    src={img.preview}
                    alt={img.fileName}
                    className="w-full h-full object-cover"
                  />
                  {!isAnalyzing && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(img.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              
              {/* Add More Button */}
              {images.length < MAX_IMAGES && !isAnalyzing && (
                <div
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed aspect-square cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Tambah</span>
                </div>
              )}
            </div>

            {/* Analyzing Overlay */}
            {isAnalyzing && (
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                <span className="text-sm font-medium">Menganalisis {images.length} gambar...</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>{images.length} dari {MAX_IMAGES} gambar</span>
              </div>
              {!isAnalyzing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startCamera}
                    disabled={images.length >= MAX_IMAGES}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Kamera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                  >
                    Hapus Semua
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
