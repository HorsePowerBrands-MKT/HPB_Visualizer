'use client';

import React, { useState } from 'react';
import { RefreshCw, Check, AlertCircle, History, Sparkles, Flag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { ReportIssueModal } from '../ReportIssueModal';
import type { HistoryItem, Payload } from '@repo/types';
import { CATALOG } from '../../lib/gatsby-constants/src';

interface ResultStepProps {
  loading: boolean;
  resultUrl: string | null;
  previewUrl: string | null;
  showResult: boolean;
  error: string | null;
  history: HistoryItem[];
  form?: Payload;
  sessionId?: string;
  onToggleView: () => void;
  onSelectHistory: (item: HistoryItem) => void;
  onSave: () => void;
  onRequestQuote: () => void;
  onTryAgain: () => void;
  onChangeOptions?: () => void;
}

// Generate marketing description based on selections
const generateDescription = (form: Payload): { title: string; features: string[]; summary: string } => {
  if (form.mode === 'inspiration') {
    return {
      title: 'Inspiration-Based Design',
      features: [
        'Custom visualization based on your inspiration photo',
        'Tailored to your bathroom\'s unique layout',
        'Professional-grade rendering'
      ],
      summary: 'Your bathroom reimagined with the style elements from your inspiration photo, seamlessly integrated into your space.'
    };
  }

  const features: string[] = [];
  
  // Enclosure type
  const enclosure = CATALOG.enclosureTypes[form.enclosure_type];
  if (enclosure) {
    features.push(`${enclosure.name} - ${enclosure.description}`);
  }

  // Glass style
  const glass = CATALOG.glassStyles[form.glass_style];
  if (glass) {
    features.push(`${glass.name} - ${glass.description}`);
  }

  // Framing
  const framing = CATALOG.trackPreferences[form.track_preference];
  if (framing) {
    features.push(`${framing.name} - ${framing.description}`);
  }

  // Hardware
  const hardware = CATALOG.hardwareFinishes[form.hardware_finish];
  if (hardware) {
    features.push(`${hardware.name} hardware - ${hardware.description}`);
  }

  // Handle
  const handle = CATALOG.handleStyles[form.handle_style];
  if (handle) {
    features.push(`${handle.name} - ${handle.description}`);
  }

  // Generate summary
  const summaryParts = [];
  if (enclosure) summaryParts.push(enclosure.name.toLowerCase());
  if (framing) summaryParts.push(framing.name.toLowerCase());
  if (glass) summaryParts.push(glass.name.toLowerCase());
  if (hardware) summaryParts.push(`${hardware.name.toLowerCase()} hardware`);

  const summary = `A stunning ${summaryParts.slice(0, 3).join(', ')} shower enclosure${hardware ? ` with elegant ${hardware.name.toLowerCase()} accents` : ''}. This design combines modern aesthetics with timeless elegance, perfectly tailored to transform your bathroom.`;

  return {
    title: 'Your Custom Configuration',
    features,
    summary
  };
};

export const ResultStep: React.FC<ResultStepProps> = ({
  loading,
  resultUrl,
  previewUrl,
  showResult,
  error,
  history,
  form,
  sessionId,
  onToggleView,
  onSelectHistory,
  onSave,
  onRequestQuote,
  onTryAgain,
  onChangeOptions
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const description = form ? generateDescription(form) : null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="text-center space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">Your Custom Shower Design</h2>
        <p className="text-gray-400 text-sm md:text-base">
          {loading ? 'Generating your visualization...' : 'See how your shower will look'}
        </p>
      </div>

      {/* Main Content - Side by side layout on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left side - Image and controls */}
        <div className="flex flex-col items-center gap-4">
          {/* Preview Area */}
          <div className="relative w-full overflow-hidden border border-brand-gold/30 bg-black/20">
            {loading && (
              <div className="absolute inset-0 z-10 bg-black/50 flex flex-col items-center justify-center text-white">
                <RefreshCw className="h-12 w-12 animate-spin mb-4" />
                <p className="text-xl font-medium">Generating your vision...</p>
                <p className="text-sm text-gray-400 mt-2">This can take a few moments</p>
              </div>
            )}
            
            {!resultUrl && !previewUrl && !loading && (
              <div className="text-center text-gray-400 p-8 min-h-[200px] flex items-center justify-center">
                <p className="text-lg">Complete the previous steps to see your preview</p>
              </div>
            )}
            
            {/* After Image - sizes the container */}
            {resultUrl && (
              <img 
                src={resultUrl} 
                alt="After" 
                className="w-full max-h-[600px] object-contain block transition-opacity duration-500" 
                style={{ opacity: showResult ? 1 : 0 }}
              />
            )}
            {/* Before Image - absolutely positioned to fill the container */}
            {previewUrl && resultUrl && (
              <img 
                src={previewUrl} 
                alt="Before" 
                className="absolute inset-0 w-full h-full object-contain transition-opacity duration-500" 
                style={{ opacity: showResult ? 0 : 1 }}
              />
            )}
            {/* Before Image only (no result yet) */}
            {previewUrl && !resultUrl && (
              <img 
                src={previewUrl} 
                alt="Before" 
                className="w-full max-h-[600px] object-contain block" 
              />
            )}
          </div>

          {/* Before/After Toggle - directly under image */}
          {resultUrl && (
            <div className="flex justify-center items-center gap-4 bg-brand-brown-hover px-6 py-3">
              <span className={`text-sm font-medium transition-colors ${!showResult ? 'text-brand-gold' : 'text-gray-400'}`}>Before</span>
              <div 
                onClick={onToggleView}
                className="relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer border border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                style={{backgroundColor: showResult ? '#e4bf6e' : '#6b7280'}}
              >
                <span 
                  className="inline-block h-6 w-6 transform bg-white shadow ring-0 transition duration-200 ease-in-out"
                  style={{transform: showResult ? 'translateX(1.75rem)' : 'translateX(0rem)'}}
                />
              </div>
              <span className={`text-sm font-medium transition-colors ${showResult ? 'text-brand-gold' : 'text-gray-400'}`}>After</span>
            </div>
          )}

          {/* History Gallery */}
          {history.length > 0 && (
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-brand-gold flex items-center gap-2 text-sm">
                  <History size={14}/> Design Gallery
                </Label>
                <span className="text-xs text-gray-400">Tap to compare</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x justify-center">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => onSelectHistory(item)}
                    className={`relative flex-shrink-0 w-20 h-20 overflow-hidden border cursor-pointer transition-all snap-start
                      ${resultUrl === item.imageUrl ? 'border-brand-gold ring-1 ring-brand-gold/30' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-500'}
                    `}
                  >
                    <img src={item.imageUrl} alt="Option" className="w-full h-full object-cover" />
                    {resultUrl === item.imageUrl && (
                      <div className="absolute inset-0 bg-brand-gold/10 flex items-center justify-center">
                        <div className="bg-brand-gold text-black p-1 shadow-sm">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 text-center italic">
                {history.find(h => h.imageUrl === resultUrl)?.label}
              </div>
            </div>
          )}
        </div>

        {/* Right side - Description panel */}
        {description && resultUrl && (
          <div className="w-full bg-brand-brown border border-brand-gold p-6 space-y-4 lg:self-start">
            <div className="flex items-center gap-2 text-brand-gold">
              <Sparkles size={20} />
              <h3 className="font-bold text-lg">{description.title}</h3>
            </div>
            
            <p className="text-gray-300 text-sm leading-relaxed">
              {description.summary}
            </p>

            <div className="border-t border-brand-gold/20 pt-4">
              <h4 className="text-brand-gold text-sm font-semibold mb-3">Selected Features</h4>
              <ul className="space-y-2">
                {description.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-gray-400">
                    <Check size={14} className="text-brand-gold flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons - stacked in sidebar */}
            <div className="border-t border-brand-gold/20 pt-4 space-y-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={onSave}
              >
                Save & Send to Me
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={onRequestQuote}
              >
                Request Quote
              </Button>
              {onChangeOptions && form?.mode === 'configure' && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={onChangeOptions}
                >
                  Change Options
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full"
                onClick={onTryAgain}
              >
                Start Over
              </Button>
              {sessionId && (
                <Button
                  variant="tertiary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setIsReportModalOpen(true)}
                >
                  <Flag size={16} />
                  Report Issue
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Report Issue Modal */}
      {sessionId && (
        <ReportIssueModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          sessionId={sessionId}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-900/30 border border-red-500/30 text-red-200 text-sm animate-in fade-in slide-in-from-top-2 max-w-md mx-auto">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
