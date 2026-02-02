'use client';

import React from 'react';
import { RefreshCw, Check, AlertCircle, History } from 'lucide-react';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import type { HistoryItem } from '@repo/types';

interface ResultStepProps {
  loading: boolean;
  resultUrl: string | null;
  previewUrl: string | null;
  showResult: boolean;
  error: string | null;
  history: HistoryItem[];
  onToggleView: () => void;
  onSelectHistory: (item: HistoryItem) => void;
  onSave: () => void;
  onRequestQuote: () => void;
  onTryAgain: () => void;
}

export const ResultStep: React.FC<ResultStepProps> = ({
  loading,
  resultUrl,
  previewUrl,
  showResult,
  error,
  history,
  onToggleView,
  onSelectHistory,
  onSave,
  onRequestQuote,
  onTryAgain
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-secondary">Your Custom Shower Design</h2>
        <p className="text-gray-400 text-base md:text-lg">
          {loading ? 'Generating your visualization...' : 'See how your shower will look'}
        </p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Preview Area */}
        <div className="relative aspect-[4/5] bg-brand-black rounded-2xl flex items-center justify-center overflow-hidden border-2 border-brand-primary/30">
          {loading && (
            <div className="absolute inset-0 z-10 bg-black/50 flex flex-col items-center justify-center text-white">
              <RefreshCw className="h-12 w-12 animate-spin mb-4" />
              <p className="text-xl font-medium">Generating your vision...</p>
              <p className="text-sm text-gray-400 mt-2">This can take a few moments</p>
            </div>
          )}
          
          {!resultUrl && !previewUrl && !loading && (
            <div className="text-center text-gray-400 p-8">
              <p className="text-lg">Complete the previous steps to see your preview</p>
            </div>
          )}
          
          <div className="absolute inset-0 transition-opacity duration-500" style={{ opacity: showResult ? 0 : 1 }}>
            {previewUrl && <img src={previewUrl} alt="Before" className="object-contain h-full w-full" />}
          </div>
          <div className="absolute inset-0 transition-opacity duration-500" style={{ opacity: showResult ? 1 : 0 }}>
            {resultUrl && <img src={resultUrl} alt="After" className="object-contain h-full w-full" />}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-200 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Before/After Toggle */}
        {resultUrl && (
          <div className="flex justify-center items-center gap-4 bg-brand-black p-4 rounded-xl">
            <span className="text-sm font-medium">Before</span>
            <div 
              onClick={onToggleView}
              className="relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-black"
              style={{backgroundColor: showResult ? '#a37529' : '#6b7280'}}
            >
              <span 
                className="inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                style={{transform: showResult ? 'translateX(1.75rem)' : 'translateX(0rem)'}}
              />
            </div>
            <span className="text-sm font-medium">After</span>
          </div>
        )}

        {/* History Gallery */}
        {history.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-brand-secondary flex items-center gap-2">
                <History size={16}/> Design Gallery
              </Label>
              <span className="text-xs text-gray-400">Tap to compare</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => onSelectHistory(item)}
                  className={`relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden border-2 cursor-pointer transition-all snap-start
                    ${resultUrl === item.imageUrl ? 'border-brand-secondary ring-2 ring-brand-primary/30' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-500'}
                  `}
                >
                  <img src={item.imageUrl} alt="Option" className="w-full h-full object-cover" />
                  {resultUrl === item.imageUrl && (
                    <div className="absolute inset-0 bg-brand-secondary/10 flex items-center justify-center">
                      <div className="bg-brand-secondary text-black rounded-full p-1 shadow-sm">
                        <Check size={14} strokeWidth={3} />
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

        {/* Action Buttons */}
        {resultUrl && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              className="flex-1"
              onClick={onSave}
            >
              Save & Send to Me
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onRequestQuote}
            >
              Request Quote
            </Button>
            <Button
              variant="outline"
              className="sm:w-auto"
              onClick={onTryAgain}
            >
              Try Another Design
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
