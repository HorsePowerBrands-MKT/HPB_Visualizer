'use client';

import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

export interface PastVisualizationItem {
  id: string;
  visualization_image_url: string | null;
  original_image_url: string | null;
  mode: string | null;
  enclosure_type: string | null;
  framing_style: string | null;
  hardware_finish: string | null;
  handle_style: string | null;
  shower_shape: string | null;
  created_at: string;
}

interface PastVisualizationsProps {
  items: PastVisualizationItem[];
}

function formatLabel(item: PastVisualizationItem): string {
  if (item.mode === 'inspiration') return 'Inspiration';
  const parts = [
    item.enclosure_type,
    item.hardware_finish,
    item.framing_style,
  ].filter(Boolean);
  return parts.length > 0
    ? parts.map((s) => s!.replace(/_/g, ' ')).join(' / ')
    : 'Visualization';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const PastVisualizations: React.FC<PastVisualizationsProps> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<PastVisualizationItem | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Clock className="w-3 h-3 text-white/40" />
          <span className="text-[11px] font-sans text-white/40 tracking-wide uppercase">
            Past Visualizations
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="shrink-0 group focus:outline-none"
            >
              <div className="w-24 bg-brand-black/60 border border-white/10 hover:border-brand-gold/40 transition-colors overflow-hidden">
                {item.visualization_image_url ? (
                  <img
                    src={item.visualization_image_url}
                    alt={formatLabel(item)}
                    className="w-24 h-18 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-24 h-18 bg-white/5 flex items-center justify-center">
                    <span className="text-[10px] text-white/20">No image</span>
                  </div>
                )}
                <div className="px-1.5 py-1">
                  <p className="text-[10px] font-sans text-white/60 truncate capitalize">
                    {formatLabel(item)}
                  </p>
                  <p className="text-[9px] font-sans text-white/30">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-brand-black border border-brand-gold/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-2 right-2 z-10 p-1 bg-black/60 hover:bg-black/80 transition-colors"
              aria-label="Close preview"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            {selectedItem.visualization_image_url && (
              <img
                src={selectedItem.visualization_image_url}
                alt={formatLabel(selectedItem)}
                className="w-full h-auto"
              />
            )}

            <div className="p-4 border-t border-white/10">
              <p className="text-sm font-sans text-white/80 capitalize">
                {formatLabel(selectedItem)}
              </p>
              {selectedItem.handle_style && (
                <p className="text-xs font-sans text-white/50 mt-0.5 capitalize">
                  Handle: {selectedItem.handle_style.replace(/_/g, ' ')}
                </p>
              )}
              <p className="text-xs font-sans text-white/30 mt-1">
                {new Date(selectedItem.created_at).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
