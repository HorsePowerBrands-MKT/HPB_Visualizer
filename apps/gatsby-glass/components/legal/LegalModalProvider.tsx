'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { LegalModal } from '../LegalModal';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfUse } from './TermsOfUse';

type LegalModalType = 'privacy' | 'terms' | null;

interface LegalModalContextValue {
  openPrivacyPolicy: () => void;
  openTermsOfUse: () => void;
}

const LegalModalContext = createContext<LegalModalContextValue>({
  openPrivacyPolicy: () => {},
  openTermsOfUse: () => {},
});

export const useLegalModal = () => useContext(LegalModalContext);

export const LegalModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);

  const openPrivacyPolicy = useCallback(() => setActiveModal('privacy'), []);
  const openTermsOfUse = useCallback(() => setActiveModal('terms'), []);
  const close = useCallback(() => setActiveModal(null), []);

  return (
    <LegalModalContext.Provider value={{ openPrivacyPolicy, openTermsOfUse }}>
      {children}

      <LegalModal
        isOpen={activeModal === 'privacy'}
        onClose={close}
        title="Privacy Policy"
      >
        <PrivacyPolicy />
      </LegalModal>

      <LegalModal
        isOpen={activeModal === 'terms'}
        onClose={close}
        title="Terms of Use"
      >
        <TermsOfUse />
      </LegalModal>
    </LegalModalContext.Provider>
  );
};
