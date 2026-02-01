import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle, AlertTriangle, XCircle, Lightbulb, Target } from 'lucide-react';

interface AIAnalysis {
  ai_confidence: number;
  validation: 'agree' | 'partial' | 'disagree';
  analysis: string;
  additional_insights: string;
  recommended_priority: 'high' | 'medium' | 'low';
  alternative_causes: string[];
}

interface AIAnalysisCardProps {
  analysis: AIAnalysis;
  isLoading?: boolean;
}

export function AIAnalysisCard({ analysis, isLoading }: AIAnalysisCardProps) {
  const getValidationIcon = () => {
    switch (analysis.validation) {
      case 'agree':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'disagree':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getValidationText = () => {
    switch (analysis.validation) {
      case 'agree':
        return 'AI Setuju';
      case 'partial':
        return 'Setuju Sebagian';
      case 'disagree':
        return 'Perlu Review';
    }
  };

  const getValidationColor = () => {
    switch (analysis.validation) {
      case 'agree':
        return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'partial':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'disagree':
        return 'bg-red-500/10 text-red-600 border-red-500/30';
    }
  };

  const getPriorityColor = () => {
    switch (analysis.recommended_priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
    }
  };

  const getPriorityText = () => {
    switch (analysis.recommended_priority) {
      case 'high':
        return 'Prioritas Tinggi';
      case 'medium':
        return 'Prioritas Sedang';
      case 'low':
        return 'Prioritas Rendah';
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Validasi & Analisis AI
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor() as any}>
              <Target className="h-3 w-3 mr-1" />
              {getPriorityText()}
            </Badge>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getValidationColor()}`}>
              {getValidationIcon()}
              {getValidationText()}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Confidence */}
        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
          <span className="text-sm font-medium">Keyakinan AI</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${analysis.ai_confidence}%` }}
              />
            </div>
            <span className="text-lg font-bold text-primary">{analysis.ai_confidence}%</span>
          </div>
        </div>

        {/* Analysis */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Analisis
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed pl-6">
            {analysis.analysis}
          </p>
        </div>

        {/* Additional Insights */}
        {analysis.additional_insights && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Insight Tambahan
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed pl-6">
              {analysis.additional_insights}
            </p>
          </div>
        )}

        {/* Alternative Causes */}
        {analysis.alternative_causes && analysis.alternative_causes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Kemungkinan Penyebab Lain
            </h4>
            <ul className="text-sm text-muted-foreground pl-6 space-y-1">
              {analysis.alternative_causes.map((cause, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {cause}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
