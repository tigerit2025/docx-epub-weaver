
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, CheckCircle, BookOpen } from 'lucide-react';

interface DownloadResultProps {
  epubBlob: Blob;
  originalFileName: string;
  onReset: () => void;
}

export const DownloadResult: React.FC<DownloadResultProps> = ({
  epubBlob,
  originalFileName,
  onReset
}) => {
  const handleDownload = () => {
    const url = URL.createObjectURL(epubBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${originalFileName.replace('.docx', '')}.epub`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Message */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-3 text-green-700">
            <CheckCircle className="h-8 w-8" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Conversie completă cu succes!</h3>
              <p className="text-sm text-green-600">
                Fișierul EPUB a fost generat și este gata pentru descărcare
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span>Fișierul tău EPUB</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <BookOpen className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-800">
                {originalFileName.replace('.docx', '')}.epub
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Format: EPUB • Dimensiune: ~{(epubBlob.size / 1024).toFixed(1)} KB
            </p>
          </div>

          {/* Features Generated */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="font-medium text-blue-700 mb-1">Index automat</h4>
              <p className="text-xs text-blue-600">Cuprins generat din headings</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <h4 className="font-medium text-green-700 mb-1">Copertă inclusă</h4>
              <p className="text-xs text-green-600">Imagine optimizată pentru EPUB</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <h4 className="font-medium text-purple-700 mb-1">Format standard</h4>
              <p className="text-xs text-purple-600">Compatibil cu toate cititorii</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Descarcă EPUB
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              size="lg"
              className="border-gray-300 hover:bg-gray-50"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Conversie nouă
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-700 mb-2">Cum să deschizi fișierul EPUB:</h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Pe desktop: Adobe Digital Editions, Calibre, sau Apple Books</li>
              <li>• Pe mobil: Google Play Books, Apple Books, sau FBReader</li>
              <li>• Online: EPUBReader pentru Chrome sau Firefox</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
