'use client';

import React from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { Input } from '../ui/Input';

interface PhotoUploadStepProps {
  type: 'bathroom' | 'inspiration';
  file: File | null;
  previewUrl: string | null;
  validating: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({
  type,
  file,
  previewUrl,
  validating,
  onFileChange,
  onRemove
}) => {
  const title = type === 'bathroom' ? 'Upload Your Bathroom Photo' : 'Upload Your Inspiration Photo';
  const description = type === 'bathroom' 
    ? 'Take a clear, straight-on photo of your shower area for the best results'
    : 'Upload a photo of a shower style you love and we\'ll apply it to your bathroom';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-secondary">{title}</h2>
        <p className="text-gray-400 text-base md:text-lg">{description}</p>
      </div>

      <div className="mt-6 md:mt-8">
        <div className="relative flex items-center justify-center w-full h-[400px] md:h-[450px] lg:h-[500px] border-2 border-dashed rounded-2xl border-brand-primary/50 hover:border-brand-secondary transition-all duration-300 bg-black/20 overflow-hidden group">
          {validating && (
            <div className="absolute inset-0 z-20 bg-black/70 flex flex-col items-center justify-center text-brand-secondary animate-in fade-in">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <span className="text-lg font-medium">Verifying & Scanning Layout...</span>
              <span className="text-sm text-gray-400 mt-2">This may take a moment</span>
            </div>
          )}
          
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Uploaded" className="object-contain h-full w-full rounded-xl" />
              <button 
                onClick={onRemove} 
                className="absolute top-4 right-4 p-3 bg-black bg-opacity-70 text-white rounded-full hover:bg-opacity-90 z-10 transition-all hover:scale-110"
                aria-label="Remove uploaded image"
              >
                <X size={24} />
              </button>
            </>
          ) : (
            <div className="text-center p-8">
              <div className="mb-6 transform transition-transform group-hover:scale-110 duration-300">
                <UploadCloud className="mx-auto h-24 w-24 text-brand-secondary/60" />
              </div>
              <p className="text-xl font-medium text-gray-300 mb-2">Click to upload or drag & drop</p>
              <p className="text-sm text-gray-400 mb-4">Best results: Straight-on photo, good lighting</p>
              <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
            </div>
          )}
          
          <Input 
            type="file" 
            accept="image/*" 
            disabled={validating}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
            onChange={onFileChange} 
          />
        </div>
      </div>
    </div>
  );
};
