'use client';

import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  maxStepReached: number;
  onStepClick: (step: number) => void;
  mode: 'configure' | 'inspiration';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  maxStepReached,
  onStepClick,
  mode
}) => {
  const getStepLabel = (step: number): string => {
    if (mode === 'configure') {
      switch (step) {
        case 1: return 'Choose Design Method';
        case 2: return 'Upload Bathroom Photo';
        case 3: return 'Select Enclosure Type';
        case 4: return 'Choose Glass & Framing';
        case 5: return 'Select Hardware & Handles';
        case 6: return 'View Your Design';
        default: return '';
      }
    } else {
      switch (step) {
        case 1: return 'Choose Design Method';
        case 2: return 'Upload Bathroom Photo';
        case 3: return 'Upload Inspiration Photo';
        case 4: return 'View Your Design';
        default: return '';
      }
    }
  };

  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  const nextStep = currentStep < totalSteps ? currentStep + 1 : null;

  return (
    <div className="w-full mb-8">
      <div className="space-y-4">
        {/* Current Step */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Current</span>
            <span className="text-xs text-gray-400">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-brand-secondary">
            {getStepLabel(currentStep)}
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-brand-black-secondary rounded-full overflow-hidden border border-brand-primary/20">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Shimmer effect with fade */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Next Step */}
        {nextStep && (
          <div className="space-y-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Next Step</span>
            <div className="text-sm md:text-base text-gray-400">
              {getStepLabel(nextStep)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
