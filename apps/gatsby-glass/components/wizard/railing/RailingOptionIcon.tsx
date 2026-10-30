'use client';

import React from 'react';

interface RailingOptionIconProps {
  src: string;
  alt: string;
}

/** Gold isometric option icon sized for SelectionCard rich selects. */
export const RailingOptionIcon: React.FC<RailingOptionIconProps> = ({ src, alt }) => (
  <div className="w-10 h-10 flex items-center justify-center shrink-0">
    <img src={src} alt={alt} className="w-9 h-9 object-contain" width={36} height={36} />
  </div>
);
