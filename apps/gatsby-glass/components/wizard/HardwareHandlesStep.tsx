'use client';

import React, { useState } from 'react';
import type { HardwareFinish, HandleStyle } from '@repo/types';
import { CATALOG } from '../../lib/gatsby-constants/src/catalog';
import { SelectionCard, FeatureDetailsModal } from './GlassFramingStep';
import type { FeatureDetailItem } from './GlassFramingStep';

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

// Color swatches for hardware finishes (matches HardwareIcon in GatsbyGlassVisualizer)
const HARDWARE_SWATCHES: Record<string, string> = {
  chrome: 'linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #a0a0a0 100%)',
  brushed_nickel: 'repeating-linear-gradient(45deg, #d0d0d0, #d0d0d0 2px, #c0c0c0 2px, #c0c0c0 4px)',
  matte_black: '#171717',
  polished_brass: 'linear-gradient(135deg, #fef9c3 0%, #facc15 50%, #ca8a04 100%)',
  oil_rubbed_bronze: '#3f2e26'
};

// Detailed descriptions for hardware finishes
const HARDWARE_DETAILS: Record<string, string> = {
  chrome: 'A mirror-like, highly reflective finish that brightens your shower space. Polished chrome is the most popular and versatile choice — it pairs beautifully with virtually any bathroom style and is easy to maintain.',
  brushed_nickel: 'A soft, satin-like finish with subtle directional brush marks that give it a warm, understated elegance. Highly resistant to fingerprints and water spots, making it a practical and stylish choice.',
  matte_black: 'A bold, contemporary flat black finish that makes a strong design statement. Creates striking contrast against glass and lighter tile, and hides fingerprints and water marks exceptionally well.',
  polished_brass: 'A luxurious, warm gold-toned finish with a rich reflective shine. Perfect for traditional, transitional, and glam-inspired bathrooms. Adds an opulent touch that elevates the entire space.',
  oil_rubbed_bronze: 'A deep, rich bronze finish with warm copper undertones and an antiqued patina. Evokes old-world charm and works beautifully in rustic, traditional, and farmhouse-style bathrooms.'
};

// Detailed descriptions for handle styles
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

export const HardwareHandlesStep: React.FC<HardwareHandlesStepProps> = ({
  hardwareFinish,
  handleStyle,
  onHardwareFinishChange,
  onHandleStyleChange,
  hardwareOptions,
  handleOptions
}) => {
  const [hardwareDetailsOpen, setHardwareDetailsOpen] = useState(false);
  const [handleDetailsOpen, setHandleDetailsOpen] = useState(false);

  const hardwareDetailItems: FeatureDetailItem[] = Object.entries(CATALOG.hardwareFinishes).map(([key, { name, description }]) => ({
    key,
    name,
    description,
    swatch: HARDWARE_SWATCHES[key],
    details: HARDWARE_DETAILS[key]
  }));

  const handleDetailItems: FeatureDetailItem[] = Object.entries(CATALOG.handleStyles).map(([key, { name, description }]) => ({
    key,
    name,
    description,
    image: HANDLE_DETAILS[key]?.image,
    details: HANDLE_DETAILS[key]?.details
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">Hardware & Handles</h2>
        <p className="text-gray-400 text-base md:text-lg">Select your hardware finish and handle style</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8">
        <SelectionCard
          label="Hardware Finish"
          value={hardwareFinish}
          options={hardwareOptions}
          onChange={(v) => onHardwareFinishChange(v as HardwareFinish)}
          onDetailsClick={() => setHardwareDetailsOpen(true)}
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
