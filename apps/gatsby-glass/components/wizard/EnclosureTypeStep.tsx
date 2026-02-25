'use client';

import React from 'react';
import { Info } from 'lucide-react';
import type { EnclosureType, HingedConfig, PivotConfig, SlidingConfig, DoorDirection, SlidingDirection, SlidingConfiguration } from '@repo/types';

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

// Reusable pill-button selector
const OptionPills: React.FC<{
  label: string;
  options: { value: string; label: string; hint?: string }[];
  value: string;
  onChange: (value: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div className="flex items-center gap-4">
    <span className="text-xs text-gray-500 uppercase tracking-wider w-28 flex-shrink-0">{label}</span>
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={(e) => { e.stopPropagation(); onChange(opt.value); }}
          className={`px-3 h-7 text-xs font-medium transition-all duration-200 ${
            value === opt.value
              ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40'
              : 'text-gray-500 hover:text-gray-300 border border-transparent'
          }`}
          title={opt.hint}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

interface EnclosureTypeStepProps {
  enclosureType: EnclosureType;
  showerShape: string;
  infoMessage: string | null;
  onEnclosureSelect: (type: EnclosureType) => void;
  hingedConfig: HingedConfig;
  pivotConfig: PivotConfig;
  slidingConfig: SlidingConfig;
  onHingedConfigChange: (config: HingedConfig) => void;
  onPivotConfigChange: (config: PivotConfig) => void;
  onSlidingConfigChange: (config: SlidingConfig) => void;
}

export const EnclosureTypeStep: React.FC<EnclosureTypeStepProps> = ({
  enclosureType,
  showerShape,
  infoMessage,
  onEnclosureSelect,
  hingedConfig,
  pivotConfig,
  slidingConfig,
  onHingedConfigChange,
  onPivotConfigChange,
  onSlidingConfigChange
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

  const directionOptions: { value: string; label: string; hint?: string }[] = [
    { value: 'left', label: 'Swing Left', hint: 'Hinges on the left, swings out to the left' },
    { value: 'right', label: 'Swing Right', hint: 'Hinges on the right, swings out to the right' },
    { value: 'double', label: 'Double Door', hint: 'Hinges on outside edges, opens from the middle' },
  ];

  const slidingDirectionOptions: { value: string; label: string; hint?: string }[] = [
    { value: 'left', label: 'Slides Left', hint: 'Inner door slides left, outer door stays fixed' },
    { value: 'right', label: 'Slides Right', hint: 'Inner door slides right, outer door stays fixed' },
  ];

  const slidingConfigOptions: { value: string; label: string }[] = [
    { value: 'single', label: 'Single Door' },
    { value: 'double', label: 'Double Door' },
  ];

  const ceilingOptions: { value: string; label: string }[] = [
    { value: 'no', label: 'No' },
    { value: 'yes', label: 'Yes' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">Choose Your Enclosure Type</h2>
        <p className="text-gray-400 text-base md:text-lg">Select the door style that fits your bathroom best</p>
      </div>

      {infoMessage && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-3 p-4 bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-sm animate-in fade-in slide-in-from-top-2">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-4 md:gap-6 mt-6 md:mt-8">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = enclosureType === option.value;
          const isDisabled = showerShape === 'neo_angle' && (option.value === 'pivot' || option.value === 'sliding');
          
          return (
            <div
              key={option.value}
              className={`relative border border-brand-gold transition-all duration-300 overflow-hidden ${
                isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-gray-900 border-gray-700'
                  : isSelected
                    ? 'bg-brand-brown-hover shadow-[0_0_30px_rgba(228,191,110,0.3)]'
                    : 'bg-brand-brown hover:bg-brand-brown-hover'
              }`}
            >
              {/* Art deco corners */}
              {option.value === 'hinged' && (
                <img src="/GG-Deco-Corner.svg" alt="" className="absolute top-[-1px] left-[-1px] w-16 h-16 pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
              )}
              {option.value === 'sliding' && (
                <img src="/GG-Deco-Corner.svg" alt="" className="absolute bottom-[-1px] right-[-1px] w-16 h-16 pointer-events-none" style={{ transform: 'scaleY(-1)' }} />
              )}

              {/* Clickable header area */}
              <button
                onClick={() => !isDisabled && onEnclosureSelect(option.value)}
                disabled={isDisabled}
                className="group w-full flex flex-col items-center justify-center p-6 md:p-8"
              >
                <div className="mb-4">
                  <Icon className="w-20 h-20" />
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${
                  isSelected ? 'text-brand-gold' : 'text-white group-hover:text-brand-gold'
                }`}>
                  {option.label}
                </h3>
                <p className={`text-center text-sm ${
                  isSelected ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                }`}>
                  {option.description}
                </p>
              </button>

              {/* Sub-options - animated expand/collapse */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                style={{ gridTemplateRows: isSelected && !isDisabled ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-brand-gold/30 p-4 space-y-4">
                    {/* Hinged sub-options */}
                    {option.value === 'hinged' && (
                      <>
                        <OptionPills
                          label="To Ceiling?"
                          options={ceilingOptions}
                          value={hingedConfig.to_ceiling ? 'yes' : 'no'}
                          onChange={(v) => onHingedConfigChange({ ...hingedConfig, to_ceiling: v === 'yes' })}
                        />
                        <OptionPills
                          label="Direction"
                          options={directionOptions}
                          value={hingedConfig.direction}
                          onChange={(v) => onHingedConfigChange({ ...hingedConfig, direction: v as DoorDirection })}
                        />
                      </>
                    )}

                    {/* Pivot sub-options */}
                    {option.value === 'pivot' && (
                      <OptionPills
                        label="Direction"
                        options={directionOptions}
                        value={pivotConfig.direction}
                        onChange={(v) => onPivotConfigChange({ ...pivotConfig, direction: v as DoorDirection })}
                      />
                    )}

                    {/* Sliding sub-options */}
                    {option.value === 'sliding' && (
                      <>
                        <OptionPills
                          label="Configuration"
                          options={slidingConfigOptions}
                          value={slidingConfig.configuration}
                          onChange={(v) => onSlidingConfigChange({ ...slidingConfig, configuration: v as SlidingConfiguration })}
                        />
                        <OptionPills
                          label="Direction"
                          options={slidingDirectionOptions}
                          value={slidingConfig.direction}
                          onChange={(v) => onSlidingConfigChange({ ...slidingConfig, direction: v as SlidingDirection })}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-xs text-gray-400 font-medium">Not compatible with neo-angle showers</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
