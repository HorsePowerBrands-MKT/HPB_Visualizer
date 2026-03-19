'use client';

import React from 'react';
import { Sparkles, Phone, ImageIcon } from 'lucide-react';

interface UsageCounterProps {
  usageCount: number;
  limit: number;
  isRateLimited: boolean;
  loginSlot?: React.ReactNode;
}

export const UsageCounter: React.FC<UsageCounterProps> = ({
  usageCount,
  limit,
  isRateLimited,
  loginSlot,
}) => {
  const remaining = Math.max(0, limit - usageCount);
  const percentage = Math.min(100, (usageCount / limit) * 100);

  const barColor =
    percentage >= 100
      ? 'bg-red-500'
      : percentage >= 70
        ? 'bg-amber-400'
        : 'bg-brand-gold';

  const textTone =
    percentage >= 100
      ? 'text-red-400'
      : percentage >= 70
        ? 'text-amber-400'
        : 'text-brand-gold';

  if (isRateLimited) {
    return (
      <div className="bg-brand-black/60 border border-red-500/30 p-5 mb-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-sans text-white/90 font-medium">
              You&apos;ve used all {limit} free visualizations this month.
            </p>
            <p className="text-xs font-sans text-white/60 mt-1.5 leading-relaxed">
              Your limit resets at the start of next month. In the meantime,
              reach out to your local Gatsby Glass for a personalized consultation.
            </p>
            <a
              href="https://www.gatsbyglass.com/locations"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-xs font-sans font-semibold px-3 py-1.5 hover:bg-brand-gold/30 transition-colors"
            >
              <Phone className="w-3 h-3" />
              Find Your Local Gatsby Glass
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-black/40 border border-white/[0.06] px-4 py-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-brand-gold/70" />
          <span className="text-xs font-sans text-white/60">
            Free AI Visualizations
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-sans font-semibold tabular-nums ${textTone}`}>
            {remaining} remaining
          </span>
          {loginSlot && (
            <>
              <span className="w-px h-3 bg-white/10" />
              {loginSlot}
            </>
          )}
        </div>
      </div>

      <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] font-sans text-white/30">
          {usageCount} of {limit} used this month
        </span>
        {percentage >= 70 && percentage < 100 && (
          <span className="text-[10px] font-sans text-amber-400/80">
            Running low
          </span>
        )}
      </div>
    </div>
  );
};
