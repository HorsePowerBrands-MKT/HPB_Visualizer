'use client';

import React from 'react';
import type { HardwareFinish, HandleStyle } from '@repo/types';

interface RichSelectOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface HardwareHandlesStepProps {
  hardwareFinish: HardwareFinish;
  handleStyle: HandleStyle;
  onHardwareFinishChange: (finish: HardwareFinish) => void;
  onHandleStyleChange: (style: HandleStyle) => void;
  hardwareOptions: RichSelectOption[];
  handleOptions: RichSelectOption[];
}

const SelectionCard: React.FC<{
  label: string;
  value: string;
  options: RichSelectOption[];
  onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-brand-secondary text-center">{label}</h3>
      <div className="grid grid-cols-1 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
              value === option.value
                ? 'bg-brand-primary/20 border-brand-secondary shadow-lg'
                : 'bg-brand-black border-brand-primary/30 hover:bg-brand-black-secondary hover:border-brand-primary/50'
            }`}
          >
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              value === option.value ? 'bg-brand-black/50' : 'bg-brand-black/30'
            }`}>
              {option.icon}
            </div>
            <span className={`text-lg font-medium flex-grow text-left ${
              value === option.value ? 'text-brand-secondary' : 'text-gray-300'
            }`}>
              {option.label}
            </span>
            {value === option.value && (
              <div className="w-3 h-3 rounded-full bg-brand-secondary flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export const HardwareHandlesStep: React.FC<HardwareHandlesStepProps> = ({
  hardwareFinish,
  handleStyle,
  onHardwareFinishChange,
  onHandleStyleChange,
  hardwareOptions,
  handleOptions
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-secondary">Hardware & Handles</h2>
        <p className="text-gray-400 text-base md:text-lg">Select your hardware finish and handle style</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
        <SelectionCard
          label="Hardware Finish"
          value={hardwareFinish}
          options={hardwareOptions}
          onChange={(v) => onHardwareFinishChange(v as HardwareFinish)}
        />
        <SelectionCard
          label="Handle Style"
          value={handleStyle}
          options={handleOptions}
          onChange={(v) => onHandleStyleChange(v as HandleStyle)}
        />
      </div>
    </div>
  );
};
