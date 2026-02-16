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
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">Choose Your Design Method</h2>
        <p className="text-gray-400 text-base md:text-lg">How would you like to design your shower?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <button 
          onClick={() => handleModeSelect('configure')}
          className={`group relative flex items-center gap-6 p-6 border border-brand-gold transition-all duration-300 overflow-hidden ${
            mode === 'configure' 
            ? 'bg-brand-brown-hover shadow-[0_0_30px_rgba(228,191,110,0.3)]' 
            : 'bg-brand-brown hover:bg-brand-brown-hover'
          }`}
        >
          {/* Art deco corner - top left */}
          <img 
            src="/GG-Deco-Corner.svg" 
            alt="" 
            className="absolute top-[-1px] left-[-1px] w-20 h-20 pointer-events-none" 
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className="flex-shrink-0">
            <Settings2 className={`w-16 h-16 ${mode === 'configure' ? 'text-brand-gold' : 'text-gray-400 group-hover:text-brand-gold'}`} />
          </div>
          <div className="flex-1 text-left">
            <h3 className={`text-xl md:text-2xl font-bold mb-2 ${mode === 'configure' ? 'text-brand-gold' : 'text-white group-hover:text-brand-gold'}`}>
              Design Your Own
            </h3>
            <p className={`text-sm md:text-base ${mode === 'configure' ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'}`}>
              Customize every detail - choose your enclosure type, glass, hardware, and finishes
            </p>
          </div>
        </button>

        <button 
          onClick={() => handleModeSelect('inspiration')}
          className={`group relative flex items-center gap-6 p-6 border border-brand-gold transition-all duration-300 overflow-hidden ${
            mode === 'inspiration' 
            ? 'bg-brand-brown-hover shadow-[0_0_30px_rgba(228,191,110,0.3)]' 
            : 'bg-brand-brown hover:bg-brand-brown-hover'
          }`}
        >
          {/* Art deco corner - bottom right */}
          <img 
            src="/GG-Deco-Corner.svg" 
            alt="" 
            className="absolute bottom-[-1px] right-[-1px] w-20 h-20 pointer-events-none" 
            style={{ transform: 'scaleY(-1)' }}
          />
          <div className="flex-shrink-0">
            <ImagePlus className={`w-16 h-16 ${mode === 'inspiration' ? 'text-brand-gold' : 'text-gray-400 group-hover:text-brand-gold'}`} />
          </div>
          <div className="flex-1 text-left">
            <h3 className={`text-xl md:text-2xl font-bold mb-2 ${mode === 'inspiration' ? 'text-brand-gold' : 'text-white group-hover:text-brand-gold'}`}>
              Match Inspiration
            </h3>
            <p className={`text-sm md:text-base ${mode === 'inspiration' ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'}`}>
              Upload a photo of a shower you love and we'll match the style to your bathroom
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
