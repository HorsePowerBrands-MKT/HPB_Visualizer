'use client';

import React, { useState } from 'react';
import type { TrackPreference, HardwareFinish, HandleStyle } from '@repo/types';
import { BoxSelect, Minimize, Square, Info, X } from 'lucide-react';
import { CATALOG } from '../../lib/gatsby-constants/src/catalog';

interface RichSelectOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface FramingHardwareStepProps {
  trackPreference: TrackPreference;
  hardwareFinish: HardwareFinish;
  handleStyle: HandleStyle;
  onTrackPreferenceChange: (track: TrackPreference) => void;
  onHardwareFinishChange: (finish: HardwareFinish) => void;
  onHandleStyleChange: (style: HandleStyle) => void;
  framingOptions: RichSelectOption[];
  hardwareOptions: RichSelectOption[];
  handleOptions: RichSelectOption[];
  detectedHardware?: string;
}

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

// Color swatches for hardware finishes
const HARDWARE_SWATCHES: Record<string, string> = {
  chrome: 'linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #a0a0a0 100%)',
  brushed_nickel: 'repeating-linear-gradient(45deg, #d0d0d0, #d0d0d0 2px, #c0c0c0 2px, #c0c0c0 4px)',
  matte_black: '#171717',
  polished_brass: 'linear-gradient(135deg, #fef9c3 0%, #facc15 50%, #ca8a04 100%)',
  oil_rubbed_bronze: '#3f2e26'
};

const HARDWARE_DETAILS: Record<string, string> = {
  chrome: 'A mirror-like, highly reflective finish that brightens your shower space. Polished chrome is the most popular and versatile choice — it pairs beautifully with virtually any bathroom style and is easy to maintain.',
  brushed_nickel: 'A soft, satin-like finish with subtle directional brush marks that give it a warm, understated elegance. Highly resistant to fingerprints and water spots, making it a practical and stylish choice.',
  matte_black: 'A bold, contemporary flat black finish that makes a strong design statement. Creates striking contrast against glass and lighter tile, and hides fingerprints and water marks exceptionally well.',
  polished_brass: 'A luxurious, warm gold-toned finish with a rich reflective shine. Perfect for traditional, transitional, and glam-inspired bathrooms. Adds an opulent touch that elevates the entire space.',
  oil_rubbed_bronze: 'A deep, rich bronze finish with warm copper undertones and an antiqued patina. Evokes old-world charm and works beautifully in rustic, traditional, and farmhouse-style bathrooms.'
};

const HANDLE_DETAILS: Record<string, { image: string; details: string }> = {
  ladder: {
    image: 'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/Handle%20Examples/ladder-pull.jpg',
    details: 'A vertical bar handle with evenly spaced horizontal rungs, providing multiple grip points along its length. Offers a modern, architectural look and is one of the most popular choices for frameless shower doors.'
  },
  square: {
    image: 'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/Handle%20Examples/square-pull.jpg',
    details: 'A clean-lined handle with a square cross-section profile. Its minimal, geometric design complements contemporary and modern bathrooms. Provides a comfortable grip with a sleek, understated aesthetic.'
  },
  d_pull: {
    image: 'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/Handle%20Examples/crescent-pull.jpg',
    details: 'A curved, D-shaped handle that follows the natural contour of your hand for the most ergonomic grip. Also known as a crescent pull, it combines comfort with an elegant, flowing design.'
  },
  knob: {
    image: 'https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/Handle%20Examples/knob.jpg',
    details: 'A classic round knob that provides a compact, timeless look. Ideal for smaller shower doors or spaces where a larger handle may not be needed. Simple, functional, and versatile across all design styles.'
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
        <div className="flex items-center justify-between p-5 border-b border-brand-gold/30">
          <h3 className="text-xl font-semibold text-brand-gold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {items.map((item) => (
            <div key={item.key} className="border border-brand-gold/30 overflow-hidden">
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
  highlightValue?: string;
}> = ({ label, value, options, onChange, onDetailsClick, highlightValue }) => {
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
            <div className="flex-grow text-left">
              <span className={`text-lg font-medium block ${
                value === option.value ? 'text-brand-gold' : 'text-gray-300'
              }`}>
                {option.label}
              </span>
              {highlightValue && option.value === highlightValue && (
                <span className="text-xs text-brand-gold/80 mt-1 block">
                  ✓ Matches your bathroom
                </span>
              )}
            </div>
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

export const FramingHardwareStep: React.FC<FramingHardwareStepProps> = ({
  trackPreference,
  hardwareFinish,
  handleStyle,
  onTrackPreferenceChange,
  onHardwareFinishChange,
  onHandleStyleChange,
  framingOptions,
  hardwareOptions,
  handleOptions,
  detectedHardware
}) => {
  const [framingDetailsOpen, setFramingDetailsOpen] = useState(false);
  const [hardwareDetailsOpen, setHardwareDetailsOpen] = useState(false);
  const [handleDetailsOpen, setHandleDetailsOpen] = useState(false);

  const framingDetailItems: FeatureDetailItem[] = Object.entries(CATALOG.trackPreferences).map(([key, { name, description }]) => ({
    key, name, description,
    image: FRAMING_DETAILS[key]?.image,
    details: FRAMING_DETAILS[key]?.details
  }));

  const hardwareDetailItems: FeatureDetailItem[] = Object.entries(CATALOG.hardwareFinishes).map(([key, { name, description }]) => ({
    key, name, description,
    swatch: HARDWARE_SWATCHES[key],
    details: HARDWARE_DETAILS[key]
  }));

  const handleDetailItems: FeatureDetailItem[] = Object.entries(CATALOG.handleStyles).map(([key, { name, description }]) => ({
    key, name, description,
    image: HANDLE_DETAILS[key]?.image,
    details: HANDLE_DETAILS[key]?.details
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">Framing, Hardware & Handles</h2>
        <p className="text-gray-400 text-base md:text-lg">Choose your framing style, hardware finish, and handle</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-6 md:mt-8">
        <SelectionCard
          label="Framing Style"
          value={trackPreference}
          options={framingOptions}
          onChange={(v) => onTrackPreferenceChange(v as TrackPreference)}
          onDetailsClick={() => setFramingDetailsOpen(true)}
        />
        <SelectionCard
          label="Hardware Finish"
          value={hardwareFinish}
          options={hardwareOptions}
          onChange={(v) => onHardwareFinishChange(v as HardwareFinish)}
          onDetailsClick={() => setHardwareDetailsOpen(true)}
          highlightValue={detectedHardware && detectedHardware !== 'none' ? detectedHardware : undefined}
        />
        <SelectionCard
          label="Handle Style"
          value={handleStyle}
          options={handleOptions}
          onChange={(v) => onHandleStyleChange(v as HandleStyle)}
          onDetailsClick={() => setHandleDetailsOpen(true)}
        />
      </div>

      <FeatureDetailsModal
        isOpen={framingDetailsOpen}
        onClose={() => setFramingDetailsOpen(false)}
        title="Framing Style Guide"
        items={framingDetailItems}
      />
      <FeatureDetailsModal
        isOpen={hardwareDetailsOpen}
        onClose={() => setHardwareDetailsOpen(false)}
        title="Hardware Finish Guide"
        items={hardwareDetailItems}
      />
      <FeatureDetailsModal
        isOpen={handleDetailsOpen}
        onClose={() => setHandleDetailsOpen(false)}
        title="Handle Style Guide"
        items={handleDetailItems}
      />
    </div>
  );
};
