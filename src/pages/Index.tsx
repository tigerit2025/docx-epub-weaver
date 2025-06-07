
import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ImageUpload } from '@/components/ImageUpload';
import { ConversionProgress } from '@/components/ConversionProgress';
import { DownloadResult } from '@/components/DownloadResult';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, Image, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UploadedFiles {
  docx: File | null;
  cover: File | null;
}

type ConversionStep = 'upload' | 'processing' | 'completed';

const Index = () => {
  const [files, setFiles] = useState<UploadedFiles>({ docx: null, cover: null });
  const [currentStep, setCurrentStep] = useState<ConversionStep>('upload');
  const [epubBlob, setEpubBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDocxUpload = (file: File) => {
    setFiles(prev => ({ ...prev, docx: file }));
    toast({
      title: "Fișier DOCX încărcat",
      description: `${file.name} a fost încărcat cu succes.`,
    });
  };

  const handleCoverUpload = (file: File) => {
    setFiles(prev => ({ ...prev, cover: file }));
    toast({
      title: "Imagine de copertă încărcată",
      description: `${file.name} a fost încărcată cu succes.`,
    });
  };

  const handleConversion = async () => {
    if (!files.docx) {
      toast({
        title: "Eroare",
        description: "Vă rugăm să încărcați un fișier DOCX.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      // Simulăm procesarea conversiei
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // În realitate, aici ar fi logica de conversie DOCX -> EPUB
      const mockEpubContent = new Blob(['Mock EPUB content'], { type: 'application/epub+zip' });
      setEpubBlob(mockEpubContent);
      setCurrentStep('completed');
      
      toast({
        title: "Conversie completă!",
        description: "Fișierul EPUB a fost generat cu succes.",
      });
    } catch (error) {
      toast({
        title: "Eroare la conversie",
        description: "A apărut o eroare în timpul conversiei.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFiles({ docx: null, cover: null });
    setCurrentStep('upload');
    setEpubBlob(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              DOCX to EPUB Converter
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Convertiți documentele Word în format EPUB cu generare automată de index și copertă personalizată
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 'upload' && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* DOCX Upload */}
              <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Fișier DOCX
                  </CardTitle>
                  <CardDescription>
                    Încărcați documentul Word pe care doriți să-l convertiți
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    onFileUpload={handleDocxUpload}
                    acceptedTypes=".docx"
                    uploadedFile={files.docx}
                  />
                </CardContent>
              </Card>

              {/* Cover Image Upload */}
              <Card className="border-2 border-dashed border-green-200 hover:border-green-400 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="h-5 w-5 mr-2 text-green-600" />
                    Imagine de copertă
                  </CardTitle>
                  <CardDescription>
                    Încărcați o imagine pentru coperta cărții (opțional)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    onImageUpload={handleCoverUpload}
                    uploadedImage={files.cover}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'processing' && (
            <ConversionProgress />
          )}

          {currentStep === 'completed' && epubBlob && (
            <DownloadResult 
              epubBlob={epubBlob} 
              originalFileName={files.docx?.name || 'document'}
              onReset={resetForm}
            />
          )}

          {/* Action Buttons */}
          {currentStep === 'upload' && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleConversion}
                disabled={!files.docx || isProcessing}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 text-lg font-semibold"
              >
                <Download className="h-5 w-5 mr-2" />
                Convertește în EPUB
              </Button>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Conversie automată</h3>
              <p className="text-muted-foreground">
                Convertiți rapid documentele DOCX în format EPUB standard
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Index automat</h3>
              <p className="text-muted-foreground">
                Generare automată de cuprins bazat pe stilurile de heading
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Image className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Copertă personalizată</h3>
              <p className="text-muted-foreground">
                Adăugați o imagine de copertă pentru o prezentare profesională
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
