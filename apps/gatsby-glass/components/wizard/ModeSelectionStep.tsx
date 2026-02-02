'use client';

import React from 'react';
import { Settings2, ImagePlus } from 'lucide-react';

interface ModeSelectionStepProps {
  mode: 'configure' | 'inspiration';
  onModeSelect: (mode: 'configure' | 'inspiration') => void;
  onNext: () => void;
}

export const ModeSelectionStep: React.FC<ModeSelectionStepProps> = ({
  mode,
  onModeSelect,
  onNext
}) => {
  const handleModeSelect = (selectedMode: 'configure' | 'inspiration') => {
    onModeSelect(selectedMode);
    // Auto-advance after selection
    setTimeout(() => onNext(), 300);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-secondary">Choose Your Design Method</h2>
        <p className="text-gray-400 text-base md:text-lg">How would you like to design your shower?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8">
        <button 
          onClick={() => handleModeSelect('configure')}
          className={`group relative flex flex-col items-center justify-center p-8 md:p-10 lg:p-12 rounded-2xl border-2 transition-all duration-300 ${
            mode === 'configure' 
            ? 'bg-brand-primary/20 border-brand-secondary shadow-[0_0_30px_rgba(228,191,110,0.3)] scale-105' 
            : 'bg-brand-black border-brand-primary/30 hover:bg-brand-black-secondary hover:border-brand-primary/50 hover:scale-105 hover:shadow-lg'
          }`}
        >
          <div className={`p-4 md:p-5 lg:p-6 rounded-full mb-4 md:mb-5 lg:mb-6 transition-all duration-300 ${
            mode === 'configure' ? 'bg-brand-secondary/20' : 'bg-brand-primary/10 group-hover:bg-brand-primary/20'
          }`}>
            <Settings2 className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 ${mode === 'configure' ? 'text-brand-secondary' : 'text-gray-400 group-hover:text-brand-secondary/80'}`} />
          </div>
          <h3 className={`text-xl md:text-2xl font-bold mb-2 md:mb-3 ${mode === 'configure' ? 'text-brand-secondary' : 'text-white group-hover:text-brand-secondary/90'}`}>
            Design Your Own
          </h3>
          <p className={`text-center text-sm md:text-base ${mode === 'configure' ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'}`}>
            Customize every detail - choose your enclosure type, glass, hardware, and finishes
          </p>
        </button>

        <button 
          onClick={() => handleModeSelect('inspiration')}
          className={`group relative flex flex-col items-center justify-center p-8 md:p-10 lg:p-12 rounded-2xl border-2 transition-all duration-300 ${
            mode === 'inspiration' 
            ? 'bg-brand-primary/20 border-brand-secondary shadow-[0_0_30px_rgba(228,191,110,0.3)] scale-105' 
            : 'bg-brand-black border-brand-primary/30 hover:bg-brand-black-secondary hover:border-brand-primary/50 hover:scale-105 hover:shadow-lg'
          }`}
        >
          <div className={`p-4 md:p-5 lg:p-6 rounded-full mb-4 md:mb-5 lg:mb-6 transition-all duration-300 ${
            mode === 'inspiration' ? 'bg-brand-secondary/20' : 'bg-brand-primary/10 group-hover:bg-brand-primary/20'
          }`}>
            <ImagePlus className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 ${mode === 'inspiration' ? 'text-brand-secondary' : 'text-gray-400 group-hover:text-brand-secondary/80'}`} />
          </div>
          <h3 className={`text-xl md:text-2xl font-bold mb-2 md:mb-3 ${mode === 'inspiration' ? 'text-brand-secondary' : 'text-white group-hover:text-brand-secondary/90'}`}>
            Match Inspiration
          </h3>
          <p className={`text-center text-sm md:text-base ${mode === 'inspiration' ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'}`}>
            Upload a photo of a shower you love and we'll match the style to your bathroom
          </p>
        </button>
      </div>
    </div>
  );
};
