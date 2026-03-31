'use client';

import React from 'react';
import { useLegalModal } from './legal/LegalModalProvider';

export const Footer: React.FC = () => {
  const { openPrivacyPolicy, openTermsOfUse } = useLegalModal();

  return (
    <footer className="bg-brand-brown border-t border-brand-gold/20 py-6 px-8">
      <div className="flex flex-col items-center gap-4">
        <p className="text-[11px] text-gray-500 italic text-center">
          AI renderings are for illustrative purposes only and may not reflect final results nor be fully accurate.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs text-gray-500">
          <span>&copy; {new Date().getFullYear()} Gatsby Glass. A Horse Power Brands Company.</span>
          <span className="hidden sm:inline text-brand-gold/40">&bull;</span>
          <div className="flex gap-4">
            <button
              onClick={openPrivacyPolicy}
              className="underline hover:text-gray-300 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={openTermsOfUse}
              className="underline hover:text-gray-300 transition-colors"
            >
              Terms of Use
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
