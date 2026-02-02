'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  loading: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onGenerate: () => void;
  showGenerateButton: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  canProceed,
  loading,
  onNext,
  onPrevious,
  onGenerate,
  showGenerateButton
}) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Back Button - Text Link Style */}
      {!isFirstStep && (
        <button
          onClick={onPrevious}
          className="flex items-center gap-2 text-gray-400 hover:text-brand-secondary transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

      {/* Next/Generate Button */}
      <div className="flex-1 flex justify-end">
        {showGenerateButton ? (
          <button
            onClick={onGenerate}
            disabled={loading || !canProceed}
            className={`
              relative px-8 py-3 rounded-xl font-semibold text-base
              bg-gradient-to-r from-brand-primary to-brand-secondary
              text-brand-black shadow-lg
              transition-all duration-300
              ${loading || !canProceed 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-[0_0_30px_rgba(228,191,110,0.4)] hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generate Preview
              </span>
            )}
          </button>
        ) : !isLastStep ? (
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`
              relative px-6 py-2.5 rounded-lg text-sm font-normal
              border border-brand-primary/50 text-brand-secondary
              transition-all duration-300
              group
              ${!canProceed 
                ? 'opacity-40 cursor-not-allowed' 
                : 'hover:border-brand-secondary hover:bg-brand-secondary/5'
              }
            `}
          >
            <span className="flex items-center gap-2">
              Continue
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
