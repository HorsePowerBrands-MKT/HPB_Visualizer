'use client';

import React, { useState } from 'react';
import type { RoomEnclosureStyle, RoomEnclosureFinish } from '../../../lib/room-enclosure';
import {
  roomEnclosureStyles,
  roomEnclosureFinishes,
  roomEnclosureFinishSwatches,
  ROOM_ENCLOSURE_STYLE_ORDER,
  ROOM_ENCLOSURE_FINISH_ORDER,
  ROOM_ENCLOSURE_STYLE_OPTION_ICONS,
} from '../../../lib/room-enclosure';
import { SelectionCard, FeatureDetailsModal } from '../GlassFramingStep';
import type { FeatureDetailItem, RichSelectOption } from '../GlassFramingStep';

/** Finish swatch, same treatment as the railing / shower hardware swatches. */
export const RoomEnclosureFinishSwatch: React.FC<{ finish: RoomEnclosureFinish; className?: string }> = ({
  finish,
  className = 'w-10 h-10',
}) => (
  <div
    className={`${className} border border-brand-gold`}
    style={{ background: roomEnclosureFinishSwatches[finish] }}
    aria-hidden="true"
  />
);

/** Decorative icon beside a visible option label in SelectionCard (label supplies the name). */
const StyleOptionIcon: React.FC<{ src: string }> = ({ src }) => (
  <div className="w-10 h-10 flex items-center justify-center shrink-0">
    <img src={src} alt="" aria-hidden="true" className="w-9 h-9 object-contain" width={36} height={36} />
  </div>
);

export const roomEnclosureStyleOptions: RichSelectOption[] = ROOM_ENCLOSURE_STYLE_ORDER.map((id) => ({
  value: id,
  label: roomEnclosureStyles[id].name,
  icon: <StyleOptionIcon src={ROOM_ENCLOSURE_STYLE_OPTION_ICONS[id]} />,
}));

export const roomEnclosureFinishOptions: RichSelectOption[] = ROOM_ENCLOSURE_FINISH_ORDER.map((id) => ({
  value: id,
  label: roomEnclosureFinishes[id].name,
  icon: <RoomEnclosureFinishSwatch finish={id} />,
}));

interface RoomEnclosureStyleStepProps {
  style: RoomEnclosureStyle | null;
  finish: RoomEnclosureFinish | null;
  onStyleChange: (value: RoomEnclosureStyle) => void;
  onFinishChange: (value: RoomEnclosureFinish) => void;
}

/**
 * "Enclosure Style & Finish" — the two consumer selections grouped on one
 * screen, mirroring the railing flow's "Railing System, Handrail & Finish"
 * step and reusing its SelectionCard columns and info modals. No technical
 * installation details are shown.
 */
export const RoomEnclosureStyleStep: React.FC<RoomEnclosureStyleStepProps> = ({
  style,
  finish,
  onStyleChange,
  onFinishChange,
}) => {
  const [styleDetailsOpen, setStyleDetailsOpen] = useState(false);
  const [finishDetailsOpen, setFinishDetailsOpen] = useState(false);

  const styleDetailItems: FeatureDetailItem[] = ROOM_ENCLOSURE_STYLE_ORDER.map((key) => ({
    key,
    name: roomEnclosureStyles[key].name,
    description: roomEnclosureStyles[key].description,
    details: roomEnclosureStyles[key].details,
    image: roomEnclosureStyles[key].image,
  }));

  const finishDetailItems: FeatureDetailItem[] = ROOM_ENCLOSURE_FINISH_ORDER.map((key) => ({
    key,
    name: roomEnclosureFinishes[key].name,
    description: roomEnclosureFinishes[key].description,
    details: roomEnclosureFinishes[key].details,
    swatch: roomEnclosureFinishSwatches[key],
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">Enclosure Style &amp; Finish</h2>
        <p className="text-gray-400 text-base md:text-lg">
          Choose a framed or frameless enclosure and your hardware finish
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8 max-w-3xl mx-auto">
        <SelectionCard
          label="Enclosure Style"
          value={style ?? ''}
          options={roomEnclosureStyleOptions}
          onChange={(v) => onStyleChange(v as RoomEnclosureStyle)}
          onDetailsClick={() => setStyleDetailsOpen(true)}
          detailsLabel="Learn more"
        />
        <SelectionCard
          label="Finish"
          value={finish ?? ''}
          options={roomEnclosureFinishOptions}
          onChange={(v) => onFinishChange(v as RoomEnclosureFinish)}
          onDetailsClick={() => setFinishDetailsOpen(true)}
        />
      </div>

      <FeatureDetailsModal
        isOpen={styleDetailsOpen}
        onClose={() => setStyleDetailsOpen(false)}
        title="Enclosure Style Guide"
        items={styleDetailItems}
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
