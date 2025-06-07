
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, FileText, List, Image, Package } from 'lucide-react';

const conversionSteps = [
  { id: 1, label: 'Analizare document DOCX', icon: FileText, duration: 1000 },
  { id: 2, label: 'Extragere conținut și stiluri', icon: BookOpen, duration: 800 },
  { id: 3, label: 'Generare index capitole', icon: List, duration: 600 },
  { id: 4, label: 'Procesare imagine copertă', icon: Image, duration: 400 },
  { id: 5, label: 'Generare fișier EPUB', icon: Package, duration: 700 }
];

export const ConversionProgress: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const runStep = (stepIndex: number) => {
      if (stepIndex >= conversionSteps.length) {
        setProgress(100);
        return;
      }

      setCurrentStep(stepIndex);
      const step = conversionSteps[stepIndex];
      
      // Animate progress for current step
      let stepProgress = 0;
      progressInterval = setInterval(() => {
        stepProgress += 2;
        const totalProgress = (stepIndex / conversionSteps.length) * 100 + (stepProgress / conversionSteps.length);
        setProgress(Math.min(totalProgress, 100));
        
        if (stepProgress >= 100) {
          clearInterval(progressInterval);
        }
      }, step.duration / 50);

      timeoutId = setTimeout(() => {
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          Conversie în progress...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress conversie</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {conversionSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-50 border border-blue-200' 
                    : isCompleted 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`flex-shrink-0 p-2 rounded-full ${
                  isActive 
                    ? 'bg-blue-500 text-white' 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`font-medium ${
                  isActive 
                    ? 'text-blue-700' 
                    : isCompleted 
                      ? 'text-green-700' 
                      : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {isActive && (
                  <div className="flex-1 flex justify-end">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
                {isCompleted && (
                  <div className="flex-1 flex justify-end">
                    <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
