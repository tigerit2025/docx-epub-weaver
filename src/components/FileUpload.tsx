
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { FileText, Upload, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  acceptedTypes: string;
  uploadedFile: File | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  acceptedTypes,
  uploadedFile
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
        isDragActive 
          ? "border-blue-500 bg-blue-50" 
          : uploadedFile 
            ? "border-green-500 bg-green-50" 
            : "border-gray-300 hover:border-gray-400"
      )}
    >
      <input {...getInputProps()} />
      
      {uploadedFile ? (
        <div className="flex flex-col items-center">
          <Check className="h-12 w-12 text-green-600 mb-3" />
          <p className="text-sm font-medium text-green-700 mb-1">
            Fișier încărcat cu succes
          </p>
          <p className="text-xs text-green-600 truncate max-w-full">
            {uploadedFile.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Clic pentru a înlocui fișierul
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {isDragActive ? (
            <Upload className="h-12 w-12 text-blue-600 mb-3" />
          ) : (
            <FileText className="h-12 w-12 text-gray-400 mb-3" />
          )}
          
          <p className="text-sm font-medium mb-1">
            {isDragActive 
              ? "Eliberați pentru a încărca fișierul" 
              : "Trageți fișierul DOCX aici"
            }
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            sau clic pentru a selecta
          </p>
          <p className="text-xs text-muted-foreground">
            Acceptă doar fișiere .docx
          </p>
        </div>
      )}
    </div>
  );
};
