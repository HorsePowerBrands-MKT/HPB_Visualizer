'use client';

import React from 'react';
import type { GlassStyle, TrackPreference } from '@repo/types';
import { Droplets, Sparkles, Grid, BoxSelect, Minimize, Square } from 'lucide-react';

interface RichSelectOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface GlassFramingStepProps {
  glassStyle: GlassStyle;
  trackPreference: TrackPreference;
  onGlassStyleChange: (style: GlassStyle) => void;
  onTrackPreferenceChange: (track: TrackPreference) => void;
  glassOptions: RichSelectOption[];
  framingOptions: RichSelectOption[];
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

export const GlassFramingStep: React.FC<GlassFramingStepProps> = ({
  glassStyle,
  trackPreference,
  onGlassStyleChange,
  onTrackPreferenceChange,
  glassOptions,
  framingOptions
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-secondary">Glass & Framing</h2>
        <p className="text-gray-400 text-base md:text-lg">Choose your glass type and framing style</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
        <SelectionCard
          label="Glass Style"
          value={glassStyle}
          options={glassOptions}
          onChange={(v) => onGlassStyleChange(v as GlassStyle)}
        />
        <SelectionCard
          label="Framing Style"
          value={trackPreference}
          options={framingOptions}
          onChange={(v) => onTrackPreferenceChange(v as TrackPreference)}
        />
      </div>
    </div>
  );
};
