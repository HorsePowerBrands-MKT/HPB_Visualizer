'use client';

import React, { useState } from 'react';
import type { RailingSystem, RailingHandrail, RailingFinish } from '../../../lib/railing';
import {
  railingSystems,
  railingHandrailOptions,
  railingFinishes,
  railingFinishSwatches,
  RAILING_SYSTEM_ORDER,
  RAILING_HANDRAIL_ORDER,
  RAILING_FINISH_ORDER,
  RAILING_SYSTEM_OPTION_ICONS,
  RAILING_HANDRAIL_OPTION_ICONS,
} from '../../../lib/railing';
import { SelectionCard, FeatureDetailsModal } from '../GlassFramingStep';
import type { FeatureDetailItem, RichSelectOption } from '../GlassFramingStep';
import { RailingOptionIcon } from './RailingOptionIcon';

/** Finish swatch, same treatment as the shower hardware swatch. */
export const RailingFinishSwatch: React.FC<{ finish: RailingFinish; className?: string }> = ({
  finish,
  className = 'w-10 h-10',
}) => (
  <div
    className={`${className} border border-brand-gold`}
    style={{ background: railingFinishSwatches[finish] }}
    aria-hidden="true"
  />
);

export const railingSystemOptions: RichSelectOption[] = RAILING_SYSTEM_ORDER.map((id) => ({
  value: id,
  label: railingSystems[id].name,
  icon: (
    <RailingOptionIcon src={RAILING_SYSTEM_OPTION_ICONS[id]} alt={railingSystems[id].name} />
  ),
}));

export const railingHandrailSelectOptions: RichSelectOption[] = RAILING_HANDRAIL_ORDER.map((id) => ({
  value: id,
  label: railingHandrailOptions[id].name,
  icon: (
    <RailingOptionIcon src={RAILING_HANDRAIL_OPTION_ICONS[id]} alt={railingHandrailOptions[id].name} />
  ),
}));

export const railingFinishOptions: RichSelectOption[] = RAILING_FINISH_ORDER.map((id) => ({
  value: id,
  label: railingFinishes[id].name,
  icon: <RailingFinishSwatch finish={id} />,
}));

interface RailingSystemStepProps {
  railingSystem: RailingSystem | null;
  handrail: RailingHandrail | null;
  finish: RailingFinish | null;
  onRailingSystemChange: (value: RailingSystem) => void;
  onHandrailChange: (value: RailingHandrail) => void;
  onFinishChange: (value: RailingFinish) => void;
}

/**
 * "Railing System, Handrail & Finish" — the three remaining consumer
 * selections grouped on one screen, mirroring the shower flow's
 * "Framing, Hardware & Handles" step and reusing its SelectionCard columns
 * and info modals. No technical installation details are shown.
 */
export const RailingSystemStep: React.FC<RailingSystemStepProps> = ({
  railingSystem,
  handrail,
  finish,
  onRailingSystemChange,
  onHandrailChange,
  onFinishChange,
}) => {
  const [systemDetailsOpen, setSystemDetailsOpen] = useState(false);
  const [handrailDetailsOpen, setHandrailDetailsOpen] = useState(false);
  const [finishDetailsOpen, setFinishDetailsOpen] = useState(false);

  const systemDetailItems: FeatureDetailItem[] = RAILING_SYSTEM_ORDER.map((key) => ({
    key,
    name: railingSystems[key].name,
    description: railingSystems[key].description,
    details: railingSystems[key].details,
    image: railingSystems[key].image,
  }));

  const handrailDetailItems: FeatureDetailItem[] = RAILING_HANDRAIL_ORDER.map((key) => ({
    key,
    name: railingHandrailOptions[key].name,
    description: railingHandrailOptions[key].description,
    details: railingHandrailOptions[key].details,
    image: railingHandrailOptions[key].image,
  }));

  const finishDetailItems: FeatureDetailItem[] = RAILING_FINISH_ORDER.map((key) => ({
    key,
    name: railingFinishes[key].name,
    description: railingFinishes[key].description,
    details: railingFinishes[key].details,
    swatch: railingFinishSwatches[key],
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">Railing System, Handrail &amp; Finish</h2>
        <p className="text-gray-400 text-base md:text-lg">Choose how the glass is mounted, whether you want a handrail, and your hardware finish</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-6 md:mt-8">
        <SelectionCard
          label="Railing System"
          value={railingSystem ?? ''}
          options={railingSystemOptions}
          onChange={(v) => onRailingSystemChange(v as RailingSystem)}
          onDetailsClick={() => setSystemDetailsOpen(true)}
          detailsLabel="See examples"
        />
        <SelectionCard
          label="Handrail"
          value={handrail ?? ''}
          options={railingHandrailSelectOptions}
          onChange={(v) => onHandrailChange(v as RailingHandrail)}
          onDetailsClick={() => setHandrailDetailsOpen(true)}
          detailsLabel="See examples"
        />
        <SelectionCard
          label="Finish"
          value={finish ?? ''}
          options={railingFinishOptions}
          onChange={(v) => onFinishChange(v as RailingFinish)}
          onDetailsClick={() => setFinishDetailsOpen(true)}
        />
      </div>

      <FeatureDetailsModal
        isOpen={systemDetailsOpen}
        onClose={() => setSystemDetailsOpen(false)}
        title="Railing System Guide"
        items={systemDetailItems}
        thumbnails
      />
      <FeatureDetailsModal
        isOpen={handrailDetailsOpen}
        onClose={() => setHandrailDetailsOpen(false)}
        title="Handrail Guide"
        items={handrailDetailItems}
        thumbnails
      />
      <FeatureDetailsModal
        isOpen={finishDetailsOpen}
        onClose={() => setFinishDetailsOpen(false)}
        title="Finish Guide"
        items={finishDetailItems}
      />
    </div>
  );
};
