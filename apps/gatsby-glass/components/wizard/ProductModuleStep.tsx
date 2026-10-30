'use client';

import React from 'react';

export type VisualizerProductModule = 'shower' | 'railing';

interface ProductModuleStepProps {
  value: VisualizerProductModule | null;
  onSelect: (module: VisualizerProductModule) => void;
}

/**
 * Entry point for the visualizer: pick which Gatsby Glass product to design.
 * Selecting a module hands off to that module's own wizard.
 */
export const ProductModuleStep: React.FC<ProductModuleStepProps> = ({ value, onSelect }) => {
  const modules: {
    value: VisualizerProductModule;
    label: string;
    cornerClass: string;
    cornerStyle: React.CSSProperties;
  }[] = [
    {
      value: 'shower',
      label: 'Shower Enclosure',
      cornerClass: 'top-[-1px] left-[-1px]',
      cornerStyle: { transform: 'scaleX(-1)' },
    },
    {
      value: 'railing',
      label: 'Glass Railing',
      cornerClass: 'bottom-[-1px] right-[-1px]',
      cornerStyle: { transform: 'scaleY(-1)' },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">What Are You Designing?</h2>
        <p className="text-gray-400 text-base md:text-lg">Choose a product to get started</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-8 max-w-2xl mx-auto">
        {modules.map(({ value: moduleValue, label, cornerClass, cornerStyle }) => {
          const isSelected = value === moduleValue;
          return (
            <button
              key={moduleValue}
              type="button"
              onClick={() => onSelect(moduleValue)}
              className={`group relative flex items-center justify-center p-6 md:p-8 border border-brand-gold transition-all duration-300 overflow-hidden ${
                isSelected
                  ? 'bg-brand-brown-hover shadow-[0_0_30px_rgba(228,191,110,0.3)]'
                  : 'bg-brand-brown hover:bg-brand-brown-hover'
              }`}
            >
              <img
                src="/GG-Deco-Corner.svg"
                alt=""
                className={`absolute ${cornerClass} w-20 h-20 pointer-events-none`}
                style={cornerStyle}
              />
              <span
                className={`text-xl md:text-2xl font-bold ${
                  isSelected ? 'text-brand-gold' : 'text-white group-hover:text-brand-gold'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
