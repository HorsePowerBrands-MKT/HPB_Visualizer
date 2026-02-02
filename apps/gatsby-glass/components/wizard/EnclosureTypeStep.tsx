'use client';

import React from 'react';
import { Info } from 'lucide-react';
import type { EnclosureType } from '@repo/types';

const GOLD_FILTER = "invert(53%) sepia(28%) saturate(1171%) hue-rotate(7deg) brightness(94%) contrast(92%)";

const IconHinged = ({ className }: { className?: string }) => (
  <img 
    src="https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/App%20Icons/Hinged.svg" 
    alt="Hinged" 
    className={`${className} object-contain`} 
    style={{ filter: GOLD_FILTER }}
  />
);

const IconPivot = ({ className }: { className?: string }) => (
  <img 
    src="https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/App%20Icons/Pivot.svg" 
    alt="Pivot" 
    className={`${className} object-contain`} 
    style={{ filter: GOLD_FILTER }}
  />
);

const IconSliding = ({ className }: { className?: string }) => (
  <img 
    src="https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/App%20Icons/Sliding.svg" 
    alt="Sliding" 
    className={`${className} object-contain`} 
    style={{ filter: GOLD_FILTER }}
  />
);

interface EnclosureTypeStepProps {
  enclosureType: EnclosureType;
  showerShape: string;
  infoMessage: string | null;
  onEnclosureSelect: (type: EnclosureType) => void;
}

export const EnclosureTypeStep: React.FC<EnclosureTypeStepProps> = ({
  enclosureType,
  showerShape,
  infoMessage,
  onEnclosureSelect
}) => {
  const options = [
    {
      value: 'hinged' as EnclosureType,
      label: 'Hinged',
      description: 'Classic swing door with elegant hinges',
      icon: IconHinged
    },
    {
      value: 'pivot' as EnclosureType,
      label: 'Pivot',
      description: 'Modern rotating door with central pivot',
      icon: IconPivot
    },
    {
      value: 'sliding' as EnclosureType,
      label: 'Sliding',
      description: 'Space-saving sliding door panels',
      icon: IconSliding
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-secondary">Choose Your Enclosure Type</h2>
        <p className="text-gray-400 text-base md:text-lg">Select the door style that fits your bathroom best</p>
      </div>

      {infoMessage && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-3 p-4 bg-brand-primary/10 border border-brand-primary/30 rounded-xl text-brand-secondary text-sm animate-in fade-in slide-in-from-top-2">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = enclosureType === option.value;
          const isDisabled = showerShape === 'neo_angle' && (option.value === 'pivot' || option.value === 'sliding');
          
          return (
            <button
              key={option.value}
              onClick={() => !isDisabled && onEnclosureSelect(option.value)}
              disabled={isDisabled}
              className={`group relative flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 ${
                isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-gray-900 border-gray-700'
                  : isSelected
                    ? 'bg-brand-primary/20 border-brand-secondary shadow-[0_0_30px_rgba(228,191,110,0.3)] scale-105'
                    : 'bg-brand-black border-brand-primary/30 hover:bg-brand-black-secondary hover:border-brand-primary/50 hover:scale-105 hover:shadow-lg'
              }`}
            >
              <div className={`p-6 rounded-full mb-4 transition-all duration-300 ${
                isSelected ? 'bg-brand-secondary/20' : 'bg-brand-primary/10 group-hover:bg-brand-primary/20'
              }`}>
                <Icon className="w-20 h-20" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${
                isSelected ? 'text-brand-secondary' : 'text-white group-hover:text-brand-secondary/90'
              }`}>
                {option.label}
              </h3>
              <p className={`text-center text-sm ${
                isSelected ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
              }`}>
                {option.description}
              </p>
              {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                  <span className="text-xs text-gray-400 font-medium">Not compatible with neo-angle showers</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
