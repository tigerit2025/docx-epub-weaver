
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Image, Upload, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  uploadedImage: File | null;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  uploadedImage
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onImageUpload(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false
  });

  const clearImage = () => {
    setPreviewUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 relative",
        isDragActive 
          ? "border-green-500 bg-green-50" 
          : uploadedImage 
            ? "border-green-500 bg-green-50" 
            : "border-gray-300 hover:border-gray-400"
      )}
    >
      <input {...getInputProps()} />
      
      {uploadedImage && previewUrl ? (
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <img 
              src={previewUrl} 
              alt="Preview copertă" 
              className="w-24 h-32 object-cover rounded border-2 border-green-400"
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm font-medium text-green-700 mb-1">
            Imagine încărcată cu succes
          </p>
          <p className="text-xs text-green-600 truncate max-w-full">
            {uploadedImage.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Clic pentru a înlocui imaginea
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {isDragActive ? (
            <Upload className="h-12 w-12 text-green-600 mb-3" />
          ) : (
            <Image className="h-12 w-12 text-gray-400 mb-3" />
          )}
          
          <p className="text-sm font-medium mb-1">
            {isDragActive 
              ? "Eliberați pentru a încărca imaginea" 
              : "Trageți imaginea aici"
            }
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            sau clic pentru a selecta
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, JPEG, GIF, WebP
          </p>
        </div>
      )}
    </div>
  );
};
