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

      {/* Geometric loader */}
      <div className="gatsby-loader mb-10" />

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

      <style jsx>{`
        .gatsby-loader {
          width: 65px;
          aspect-ratio: 1;
          --g1: conic-gradient(from  90deg at top    3px left  3px, #0000 90deg, #e4bf6e 0);
          --g2: conic-gradient(from -90deg at bottom 3px right 3px, #0000 90deg, #e4bf6e 0);
          background:
            var(--g1), var(--g1), var(--g1), var(--g1),
            var(--g2), var(--g2), var(--g2), var(--g2);
          background-position: 0 0, 100% 0, 100% 100%, 0 100%;
          background-size: 25px 25px;
          background-repeat: no-repeat;
          animation: gatsby-geo 1.5s infinite;
        }
        @keyframes gatsby-geo {
          0%   { background-size: 35px 15px, 15px 15px, 15px 35px, 35px 35px; }
          25%  { background-size: 35px 35px, 15px 35px, 15px 15px, 35px 15px; }
          50%  { background-size: 15px 35px, 35px 35px, 35px 15px, 15px 15px; }
          75%  { background-size: 15px 15px, 35px 15px, 35px 35px, 15px 35px; }
          100% { background-size: 35px 15px, 15px 15px, 15px 35px, 35px 35px; }
        }
      `}</style>
    </div>
  );
};
