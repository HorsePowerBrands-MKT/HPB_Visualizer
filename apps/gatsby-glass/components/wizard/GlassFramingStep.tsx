'use client';

import React, { useState } from 'react';
import type { GlassStyle, TrackPreference } from '@repo/types';
import { Droplets, Sparkles, Grid, BoxSelect, Minimize, Square, Info, X } from 'lucide-react';
import { CATALOG } from '../../lib/gatsby-constants/src/catalog';

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

// Detail data for glass styles
const GLASS_DETAILS: Record<string, { image: string; details: string }> = {
  clear: {
    image: 'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/Glass%20Examples/clear-glass.jpg',
    details: 'Our most popular option. Standard tempered safety glass that provides a clean, open feel to your shower. Offers full transparency and lets light flow freely throughout your bathroom.'
  },
  low_iron: {
    image: 'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/Glass%20Examples/low-iron-glass.jpg',
    details: 'Premium ultra-clear glass manufactured with reduced iron content, eliminating the subtle green tint found in standard clear glass. Delivers the truest color clarity and maximum transparency for a luxury finish.'
  },
  p516: {
    image: 'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/Glass%20Examples/p516-rain-glass.jpg',
    details: 'An elegant textured pattern that mimics rain droplets cascading down the glass. Provides a beautiful balance of privacy and light transmission while adding a sophisticated decorative element to your shower enclosure.'
  }
};

// Detail data for framing styles
const FRAMING_DETAILS: Record<string, { image: string; details: string }> = {
  frameless: {
    image: 'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/Framing%20Examples/frameless.jpg',
    details: 'No metal frame around the glass panels, creating a clean, minimalist aesthetic. Uses minimal hardware — typically just hinges and clips — to let the glass itself be the focal point. Ideal for modern and contemporary bathrooms.'
  },
  semi_frameless: {
    image: 'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/Framing%20Examples/semi-frameless.jpg',
    details: 'A streamlined blend of form and function. The door panel is frameless for a sleek look, while the fixed panels have a slim metal frame for added structural stability. A popular middle-ground option.'
  },
  framed: {
    image: 'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/Framing%20Examples/framed.jpg',
    details: 'Full metal framing surrounds all glass panels for maximum durability and a classic, structured appearance. Offers the widest range of finish options and provides a traditional, polished look.'
  }
};

interface FeatureDetailItem {
  key: string;
  name: string;
  description: string;
  image?: string;
  details?: string;
  swatch?: string;
}

const FeatureDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: FeatureDetailItem[];
}> = ({ isOpen, onClose, title, items }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-brand-brown border border-brand-gold"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-gold/30">
          <h3 className="text-xl font-semibold text-brand-gold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Items list */}
        <div className="p-5 space-y-6">
          {items.map((item) => (
            <div key={item.key} className="border border-brand-gold/30 overflow-hidden">
              {/* Image or Swatch */}
              {item.swatch ? (
                <div className="flex items-center gap-4 p-4 border-b border-brand-gold/30">
                  <div
                    className="w-16 h-16 border border-brand-gold/30 flex-shrink-0"
                    style={{ background: item.swatch }}
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-brand-gold">{item.name}</h4>
                  </div>
                </div>
              ) : item.image ? (
                <div className="w-full h-48 bg-brand-brown-hover relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={`${item.name} example`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                      const fallback = document.createElement('div');
                      fallback.className = 'text-center p-4';
                      fallback.innerHTML = `<div class="text-brand-gold/40 text-sm">Image coming soon</div>`;
                      target.parentElement!.appendChild(fallback);
                    }}
                  />
                </div>
              ) : null}

              {/* Content */}
              <div className="p-4 space-y-2">
                {!item.swatch && (
                  <h4 className="text-lg font-semibold text-brand-gold">{item.name}</h4>
                )}
                <p className="text-sm text-gray-300 leading-relaxed">
                  {item.details || item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SelectionCard: React.FC<{
  label: string;
  value: string;
  options: RichSelectOption[];
  onChange: (value: string) => void;
  onDetailsClick?: () => void;
}> = ({ label, value, options, onChange, onDetailsClick }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        <h3 className="text-xl font-semibold text-brand-gold text-center">{label}</h3>
        {onDetailsClick && (
          <button
            onClick={onDetailsClick}
            className="text-brand-gold hover:animate-spin-bounce"
            title={`View ${label.toLowerCase()} details`}
          >
            <Info className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-4 p-4 border border-brand-gold transition-all duration-200 ${
              value === option.value
                ? 'bg-brand-brown-hover shadow-lg'
                : 'bg-brand-brown hover:bg-brand-brown-hover'
            }`}
          >
            <div className="flex-shrink-0">
              {option.icon}
            </div>
            <span className={`text-lg font-medium flex-grow text-left ${
              value === option.value ? 'text-brand-gold' : 'text-gray-300'
            }`}>
              {option.label}
            </span>
            {value === option.value && (
              <div className="w-3 h-3 bg-brand-gold flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export { FeatureDetailsModal, SelectionCard };
export type { RichSelectOption, FeatureDetailItem };

export const GlassFramingStep: React.FC<GlassFramingStepProps> = ({
  glassStyle,
  trackPreference,
  onGlassStyleChange,
  onTrackPreferenceChange,
  glassOptions,
  framingOptions
}) => {
  const [glassDetailsOpen, setGlassDetailsOpen] = useState(false);
  const [framingDetailsOpen, setFramingDetailsOpen] = useState(false);

  const glassDetailItems: FeatureDetailItem[] = Object.entries(CATALOG.glassStyles).map(([key, { name, description }]) => ({
    key,
    name,
    description,
    image: GLASS_DETAILS[key]?.image,
    details: GLASS_DETAILS[key]?.details
  }));

  const framingDetailItems: FeatureDetailItem[] = Object.entries(CATALOG.trackPreferences).map(([key, { name, description }]) => ({
    key,
    name,
    description,
    image: FRAMING_DETAILS[key]?.image,
    details: FRAMING_DETAILS[key]?.details
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">Glass & Framing</h2>
        <p className="text-gray-400 text-base md:text-lg">Choose your glass type and framing style</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
        <SelectionCard
          label="Glass Style"
          value={glassStyle}
          options={glassOptions}
          onChange={(v) => onGlassStyleChange(v as GlassStyle)}
          onDetailsClick={() => setGlassDetailsOpen(true)}
        />
        <SelectionCard
          label="Framing Style"
          value={trackPreference}
          options={framingOptions}
          onChange={(v) => onTrackPreferenceChange(v as TrackPreference)}
          onDetailsClick={() => setFramingDetailsOpen(true)}
        />
      </div>

      <FeatureDetailsModal
        isOpen={glassDetailsOpen}
        onClose={() => setGlassDetailsOpen(false)}
        title="Glass Style Guide"
        items={glassDetailItems}
      />
      <FeatureDetailsModal
        isOpen={framingDetailsOpen}
        onClose={() => setFramingDetailsOpen(false)}
        title="Framing Style Guide"
        items={framingDetailItems}
      />
    </div>
  );
};
