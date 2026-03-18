'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

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
    ? parts.map((s) => s!.replace(/_/g, ' ')).join(' \u2022 ')
    : 'Visualization';
}

function formatDetailRows(item: PastVisualizationItem): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  if (item.enclosure_type) rows.push({ label: 'Style', value: item.enclosure_type.replace(/_/g, ' ') });
  if (item.framing_style) rows.push({ label: 'Frame', value: item.framing_style.replace(/_/g, ' ') });
  if (item.hardware_finish) rows.push({ label: 'Finish', value: item.hardware_finish.replace(/_/g, ' ') });
  if (item.handle_style) rows.push({ label: 'Handle', value: item.handle_style.replace(/_/g, ' ') });
  if (item.shower_shape) rows.push({ label: 'Shape', value: item.shower_shape.replace(/_/g, ' ') });
  return rows;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export const PastVisualizations: React.FC<PastVisualizationsProps> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<PastVisualizationItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (items.length === 0) {
    return (
      <div className="bg-brand-black/20 border border-dashed border-white/[0.06] px-4 py-3 mb-3 flex items-center gap-2">
        <ImageIcon className="w-3.5 h-3.5 text-white/20 shrink-0" />
        <span className="text-[11px] font-sans text-white/25">
          Your past visualizations will appear here
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 relative">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Clock className="w-3 h-3 text-brand-gold/50" />
          <span className="text-[11px] font-sans text-white/40 tracking-wide uppercase">
            Your Visualizations
          </span>
          <span className="text-[10px] font-sans text-white/20 ml-auto">
            {items.length} design{items.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Scroll container with fade edges */}
        <div className="relative group">
          {/* Left fade + arrow */}
          {canScrollLeft && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-brand-brown to-transparent z-10 pointer-events-none" />
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center bg-brand-black/80 border border-white/10 text-white/60 hover:text-white hover:border-brand-gold/30 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Right fade + arrow */}
          {canScrollRight && (
            <>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-brand-brown to-transparent z-10 pointer-events-none" />
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center bg-brand-black/80 border border-white/10 text-white/60 hover:text-white hover:border-brand-gold/30 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
          >
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="shrink-0 group/card focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold/50"
              >
                <div className="w-32 bg-brand-black/60 border border-white/[0.08] hover:border-brand-gold/30 transition-all duration-200 overflow-hidden hover:shadow-lg hover:shadow-brand-gold/5">
                  {item.visualization_image_url ? (
                    <img
                      src={item.visualization_image_url}
                      alt={formatLabel(item)}
                      className="w-32 h-24 object-cover group-hover/card:scale-[1.02] transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-32 h-24 bg-white/[0.03] flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white/10" />
                    </div>
                  )}
                  <div className="px-2 py-1.5 border-t border-white/[0.04]">
                    <p className="text-[11px] font-sans text-white/60 truncate capitalize leading-tight">
                      {formatLabel(item)}
                    </p>
                    <p className="text-[10px] font-sans text-white/25 mt-0.5">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-w-2xl w-auto bg-brand-black border border-brand-gold/20 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-black/70 hover:bg-black/90 border border-white/10 transition-colors"
              aria-label="Close preview"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>

            {selectedItem.visualization_image_url ? (
              <img
                src={selectedItem.visualization_image_url}
                alt={formatLabel(selectedItem)}
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />
            ) : (
              <div className="w-full aspect-video bg-white/[0.03] flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-white/10" />
              </div>
            )}

            <div className="p-5 border-t border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-sans text-white/90 capitalize font-medium">
                    {selectedItem.mode === 'inspiration' ? 'Inspiration Design' : formatLabel(selectedItem)}
                  </p>
                  <p className="text-xs font-sans text-white/30 mt-1">
                    {formatDateLong(selectedItem.created_at)}
                  </p>
                </div>
              </div>

              {/* Config details */}
              {formatDetailRows(selectedItem).length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-white/[0.06]">
                  {formatDetailRows(selectedItem).map((row) => (
                    <div key={row.label} className="flex items-center gap-1.5">
                      <span className="text-[10px] font-sans text-white/30 uppercase tracking-wider">
                        {row.label}
                      </span>
                      <span className="text-xs font-sans text-white/60 capitalize">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
