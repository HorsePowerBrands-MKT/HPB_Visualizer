'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  maxStepReached: number;
  onStepClick: (step: number) => void;
  mode: 'configure' | 'inspiration';
  canProceed?: boolean;
  loading?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  onGenerate?: () => void;
  showGenerateButton?: boolean;
  isResultStep?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  maxStepReached,
  onStepClick,
  mode,
  canProceed = false,
  loading = false,
  onNext,
  onPrevious,
  onGenerate,
  showGenerateButton = false,
  isResultStep = false,
}) => {
  const getStepLabel = (step: number): string => {
    if (mode === 'configure') {
      switch (step) {
        case 1: return 'Choose Design Method';
        case 2: return 'Upload Bathroom Photo';
        case 3: return 'Select Enclosure Type';
        case 4: return 'Framing, Hardware & Handles';
        case 5: return 'View Your Design';
        default: return '';
      }
    } else {
      switch (step) {
        case 1: return 'Choose Design Method';
        case 2: return 'Upload Your Photos';
        case 3: return 'View Your Design';
        default: return '';
      }
    }
  };

  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  const nextStep = currentStep < totalSteps ? currentStep + 1 : null;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="w-full mt-8">
      <div className="space-y-4">
        {/* Current Step */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Current</span>
            <span className="text-xs text-gray-400">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-brand-gold">
            {getStepLabel(currentStep)}
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-brand-brown-hover overflow-hidden border border-brand-gold/20">
          <div 
            className="absolute top-0 left-0 h-full bg-brand-gold transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Shimmer effect with fade */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Next Step + Navigation Buttons */}
        <div className="flex items-center justify-between">
          {/* Next Step Label */}
          {nextStep ? (
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Next Step</span>
              <div className="text-sm md:text-base text-white">
                {getStepLabel(nextStep)}
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Navigation Buttons */}
          {!isResultStep && (
            <div className="flex items-center gap-3">
              {!isFirstStep && onPrevious && (
                <button
                  onClick={onPrevious}
                  className="inline-flex items-center justify-center text-center gap-2 px-4 h-9 text-white border border-white/30 hover:border-white hover:bg-white/10 transition-all duration-300 text-sm font-medium group"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span>Back</span>
                </button>
              )}

              {showGenerateButton && onGenerate ? (
                <button
                  onClick={onGenerate}
                  disabled={loading || !canProceed}
                  className={`
                    inline-flex items-center justify-center text-center px-8 h-9 font-medium text-sm
                    bg-transparent text-brand-gold border border-brand-gold
                    transition-all duration-300
                    ${loading || !canProceed 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-brand-gold hover:text-brand-brown'
                    }
                  `}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                      Generate Preview
                    </span>
                  )}
                </button>
              ) : !isLastStep && onNext ? (
                <button
                  onClick={onNext}
                  disabled={!canProceed}
                  className={`
                    inline-flex items-center justify-center text-center px-6 h-9 text-sm font-medium
                    border border-brand-gold text-brand-gold
                    transition-all duration-300
                    group
                    ${!canProceed 
                      ? 'opacity-40 cursor-not-allowed' 
                      : 'hover:bg-brand-gold hover:text-brand-brown'
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
          )}
        </div>
      </div>
    </div>
  );
};
