'use client';

import React from 'react';
import { Sparkles, Phone } from 'lucide-react';

interface UsageCounterProps {
  usageCount: number;
  limit: number;
  isRateLimited: boolean;
}

export const UsageCounter: React.FC<UsageCounterProps> = ({
  usageCount,
  limit,
  isRateLimited,
}) => {
  const remaining = Math.max(0, limit - usageCount);
  const percentage = Math.min(100, (usageCount / limit) * 100);

  const barColor =
    percentage >= 100
      ? 'bg-red-500'
      : percentage >= 70
        ? 'bg-yellow-500'
        : 'bg-brand-gold';

  if (isRateLimited) {
    return (
      <div className="bg-brand-black/60 border border-red-500/30 p-4 mb-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-sans text-white/90 font-medium">
              You&apos;ve used all {limit} free visualizations this month.
            </p>
            <p className="text-xs font-sans text-white/60 mt-1">
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
    <div className="flex items-center gap-3 px-1 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-sans text-white/50 tracking-wide uppercase">
            Visualizations
          </span>
          <span className="text-[11px] font-sans text-white/50 tabular-nums">
            {usageCount}/{limit}
          </span>
        </div>
        <div className="h-1.5 bg-white/10 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
