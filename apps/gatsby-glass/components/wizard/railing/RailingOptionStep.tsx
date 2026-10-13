'use client';

import React from 'react';

export interface RailingOption<T extends string> {
  value: T;
  label: string;
  description: string;
  icon: React.ReactNode;
  /** Small tag shown above the label, e.g. "Interior". */
  badge?: string;
}

interface RailingOptionStepProps<T extends string> {
  title: string;
  subtitle: string;
  options: RailingOption<T>[];
  value: T | null;
  onSelect: (value: T) => void;
  /** Tailwind grid column classes for md+ screens. */
  columnsClassName?: string;
}

/**
 * Single-choice card grid used by every railing step. Keeps the consumer
 * experience to one decision per screen with no technical detail.
 */
export function RailingOptionStep<T extends string>({
  title,
  subtitle,
  options,
  value,
  onSelect,
  columnsClassName = 'md:grid-cols-2',
}: RailingOptionStepProps<T>) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">{title}</h2>
        <p className="text-gray-400 text-base md:text-lg">{subtitle}</p>
      </div>

      <div
        role="radiogroup"
        aria-label={title}
        className={`grid grid-cols-1 ${columnsClassName} gap-4 md:gap-6 mt-6 md:mt-8`}
      >
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const isFirst = index === 0;
          const isLast = index === options.length - 1;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.value)}
              className={`group relative flex flex-col items-center justify-center text-center p-6 md:p-8 border border-brand-gold transition-all duration-300 overflow-hidden ${
                isSelected
                  ? 'bg-brand-brown-hover shadow-[0_0_30px_rgba(228,191,110,0.3)]'
                  : 'bg-brand-brown hover:bg-brand-brown-hover'
              }`}
            >
              {/* Art deco corners on the first and last cards, matching the shower steps */}
              {isFirst && (
                <img
                  src="/GG-Deco-Corner.svg"
                  alt=""
                  className="absolute top-[-1px] left-[-1px] w-16 h-16 pointer-events-none"
                  style={{ transform: 'scaleX(-1)' }}
                />
              )}
              {isLast && (
                <img
                  src="/GG-Deco-Corner.svg"
                  alt=""
                  className="absolute bottom-[-1px] right-[-1px] w-16 h-16 pointer-events-none"
                  style={{ transform: 'scaleY(-1)' }}
                />
              )}

              {option.badge && (
                <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider px-2 py-0.5 border border-brand-gold/40 text-brand-gold/80">
                  {option.badge}
                </span>
              )}

              <div className="mb-4">{option.icon}</div>
              <h3
                className={`text-xl md:text-2xl font-bold mb-2 ${
                  isSelected ? 'text-brand-gold' : 'text-white group-hover:text-brand-gold'
                }`}
              >
                {option.label}
              </h3>
              <p
                className={`text-sm ${
                  isSelected ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                }`}
              >
                {option.description}
              </p>

              {isSelected && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-brand-gold" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
