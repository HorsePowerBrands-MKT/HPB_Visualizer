'use client';

import React from 'react';

interface RailingOptionIconProps {
  src: string;
}

/** Decorative icon beside a visible option label in SelectionCard (label supplies the name). */
export const RailingOptionIcon: React.FC<RailingOptionIconProps> = ({ src }) => (
  <div className="w-10 h-10 flex items-center justify-center shrink-0">
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className="w-9 h-9 object-contain"
      width={36}
      height={36}
    />
  </div>
);
