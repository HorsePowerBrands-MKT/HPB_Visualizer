'use client';

import React, { useState, useEffect } from 'react';

const PROGRESS_MESSAGES = [
  'Analyzing your bathroom layout...',
  'Mapping dimensions and angles...',
  'Designing glass panels...',
  'Applying hardware finishes...',
  'Rendering your visualization...',
  'Adding final details...',
];

const MESSAGE_INTERVAL_MS = 3500;

interface GeneratingOverlayProps {
  visible: boolean;
}

export const GeneratingOverlay: React.FC<GeneratingOverlayProps> = ({ visible }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    if (!visible) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
        setFadeIn(true);
      }, 300);
    }, MESSAGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-brown/[0.97] backdrop-blur-sm animate-in fade-in duration-300">
      {/* Decorative corners */}
      <img
        src="/GG-Deco-Corner.svg"
        alt=""
        className="absolute top-4 left-4 w-16 h-16 opacity-20 pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      />
      <img
        src="/GG-Deco-Corner.svg"
        alt=""
        className="absolute top-4 right-4 w-16 h-16 opacity-20 pointer-events-none"
      />
      <img
        src="/GG-Deco-Corner.svg"
        alt=""
        className="absolute bottom-4 left-4 w-16 h-16 opacity-20 pointer-events-none"
        style={{ transform: 'scale(-1, -1)' }}
      />
      <img
        src="/GG-Deco-Corner.svg"
        alt=""
        className="absolute bottom-4 right-4 w-16 h-16 opacity-20 pointer-events-none"
        style={{ transform: 'scaleY(-1)' }}
      />

      {/* Animated ring */}
      <div className="relative w-28 h-28 mb-8">
        <div className="absolute inset-0 border-2 border-brand-gold/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-transparent border-t-brand-gold rounded-full animate-spin" style={{ animationDuration: '1.8s' }} />
        <div className="absolute inset-2 border border-transparent border-b-brand-gold/40 rounded-full animate-spin" style={{ animationDuration: '2.8s', animationDirection: 'reverse' }} />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 text-brand-gold animate-pulse"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-gold tracking-wider mb-3">
        Creating Your Design
      </h2>

      {/* Rotating message */}
      <p
        className={`text-sm md:text-base text-white/60 font-sans transition-opacity duration-300 ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {PROGRESS_MESSAGES[messageIndex]}
      </p>

      {/* Subtle shimmer bar */}
      <div className="w-48 h-0.5 mt-8 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full w-1/3 bg-brand-gold/50 rounded-full"
          style={{
            animation: 'shimmer-slide 2s ease-in-out infinite',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shimmer-slide {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(450%); }
        }
      `}</style>
    </div>
  );
};
