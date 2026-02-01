import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wrench,
  MapPin,
  FileText
} from 'lucide-react';

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

interface ImageAnalysisResultProps {
  analysis: ImageAnalysis;
}

export function ImageAnalysisResult({ analysis }: ImageAnalysisResultProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'berat':
        return 'destructive';
      case 'sedang':
        return 'default';
      case 'ringan':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getUrgencyColor = () => {
    switch (analysis.estimated_urgency) {
      case 'segera':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'dalam waktu dekat':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'bisa ditunda':
        return 'bg-green-500/10 text-green-600 border-green-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getUrgencyText = () => {
    switch (analysis.estimated_urgency) {
      case 'segera':
        return 'Perlu Segera Ditangani';
      case 'dalam waktu dekat':
        return 'Dalam Waktu Dekat';
      case 'bisa ditunda':
        return 'Bisa Ditunda';
      default:
        return analysis.estimated_urgency;
    }
  };

  return (
    <Card className="border-primary/30 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Hasil Analisis Gambar
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor()}`}>
              <Clock className="h-3.5 w-3.5" />
              {getUrgencyText()}
            </div>
            <Badge variant="outline" className="text-sm">
              Keyakinan: {analysis.confidence}%
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {/* Diagnosis Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Ringkasan Diagnosa</h4>
              <p className="text-sm text-muted-foreground">{analysis.diagnosis_summary}</p>
            </div>
          </div>
        </div>

        {/* Detected Issues */}
        {analysis.detected_issues && analysis.detected_issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Masalah Terdeteksi ({analysis.detected_issues.length})
            </h4>
            <div className="space-y-3">
              {analysis.detected_issues.map((issue, index) => (
                <div 
                  key={index}
                  className="p-4 border rounded-lg bg-background"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium">{issue.issue}</h5>
                    <Badge variant={getSeverityColor(issue.severity) as any}>
                      {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{issue.location}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Repairs */}
        {analysis.recommended_repairs && analysis.recommended_repairs.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Rekomendasi Perbaikan
            </h4>
            <ul className="space-y-2">
              {analysis.recommended_repairs.map((repair, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{repair}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Additional Notes */}
        {analysis.additional_notes && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>Catatan:</strong> {analysis.additional_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
