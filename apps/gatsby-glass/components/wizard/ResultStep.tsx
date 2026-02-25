'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Check, AlertCircle, History, Sparkles, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { ReportIssueModal } from '../ReportIssueModal';
import type { HistoryItem, Payload, EnclosureType, TrackPreference, HardwareFinish, HandleStyle, HingedConfig, PivotConfig, SlidingConfig, DoorDirection, SlidingDirection, SlidingConfiguration } from '@repo/types';
import { CATALOG } from '../../lib/gatsby-constants/src';

interface OptionItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const OptionDropdown: React.FC<{
  label: string;
  value: string;
  options: OptionItem[];
  onChange: (value: string) => void;
  badge?: string;
}> = ({ label, value, options, onChange, badge }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="flex items-center gap-4" ref={ref}>
      <span className="text-sm text-brand-gold font-medium w-28 flex-shrink-0">{label}</span>
      <div className="relative flex-grow">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 bg-brand-brown-hover border border-brand-gold/40 hover:border-brand-gold text-white text-sm h-10 px-3 transition-colors"
        >
          {selected?.icon && <div className="w-5 h-5 flex-shrink-0 overflow-hidden [&>*]:w-5 [&>*]:h-5">{selected.icon}</div>}
          <span className="flex-grow text-left">{selected?.label}</span>
          <ChevronDown size={14} className={`text-brand-gold/60 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-brand-brown border border-brand-gold shadow-lg shadow-black/40 max-h-52 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const hasBadge = badge === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 h-10 text-sm transition-colors ${
                    isSelected
                      ? 'bg-brand-gold/15 text-brand-gold'
                      : 'text-gray-300 hover:bg-brand-brown-hover hover:text-white'
                  }`}
                >
                  {opt.icon && <div className="w-5 h-5 flex-shrink-0 overflow-hidden [&>*]:w-5 [&>*]:h-5">{opt.icon}</div>}
                  <span className="flex-grow text-left">{opt.label}</span>
                  {hasBadge && <span className="text-[10px] text-brand-gold/80 flex-shrink-0">✓ Match</span>}
                  {isSelected && <Check size={14} className="text-brand-gold flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const SubOptionPills: React.FC<{
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div className="flex items-center gap-3">
    <span className="text-[11px] text-gray-500 uppercase tracking-wider w-24 flex-shrink-0">{label}</span>
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 h-6 text-[11px] font-medium transition-all duration-200 ${
            value === opt.value
              ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40'
              : 'text-gray-500 hover:text-gray-300 border border-transparent'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

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
  onRegenerate?: () => void;
  enclosureOptions?: OptionItem[];
  framingOptions?: OptionItem[];
  hardwareOptions?: OptionItem[];
  handleOptions?: OptionItem[];
  onEnclosureChange?: (value: EnclosureType) => void;
  onTrackPreferenceChange?: (value: TrackPreference) => void;
  onHardwareFinishChange?: (value: HardwareFinish) => void;
  onHandleStyleChange?: (value: HandleStyle) => void;
  detectedHardware?: string;
  onHingedConfigChange?: (config: HingedConfig) => void;
  onPivotConfigChange?: (config: PivotConfig) => void;
  onSlidingConfigChange?: (config: SlidingConfig) => void;
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
  
  // Enclosure type with door config details
  const enclosure = CATALOG.enclosureTypes[form.enclosure_type];
  if (enclosure) {
    let enclosureDetail = `${enclosure.name}`;
    if (form.enclosure_type === 'hinged' && form.hinged_config) {
      const dir = form.hinged_config.direction === 'double' ? 'Double Door' : `Swing ${form.hinged_config.direction === 'left' ? 'Left' : 'Right'}`;
      enclosureDetail += ` — ${dir}${form.hinged_config.to_ceiling ? ', To Ceiling' : ''}`;
    } else if (form.enclosure_type === 'pivot' && form.pivot_config) {
      const dir = form.pivot_config.direction === 'double' ? 'Double Door' : `Swing ${form.pivot_config.direction === 'left' ? 'Left' : 'Right'}`;
      enclosureDetail += ` — ${dir}`;
    } else if (form.enclosure_type === 'sliding' && form.sliding_config) {
      const cfg = form.sliding_config.configuration === 'double' ? 'Double Door' : 'Single Door';
      const dir = `Slides ${form.sliding_config.direction === 'left' ? 'Left' : 'Right'}`;
      enclosureDetail += ` — ${cfg}, ${dir}`;
    }
    features.push(enclosureDetail);
  }

  // Framing
  const framing = CATALOG.trackPreferences[form.track_preference];
  if (framing) {
    features.push(`${framing.name} framing`);
  }

  // Hardware
  const hardware = CATALOG.hardwareFinishes[form.hardware_finish];
  if (hardware) {
    features.push(`${hardware.name} hardware`);
  }

  // Handle
  const handle = CATALOG.handleStyles[form.handle_style];
  if (handle) {
    features.push(`${handle.name} handle`);
  }

  // Double door note
  const isDoubleDoor =
    (form.enclosure_type === 'hinged' && form.hinged_config?.direction === 'double') ||
    (form.enclosure_type === 'pivot' && form.pivot_config?.direction === 'double') ||
    (form.enclosure_type === 'sliding' && form.sliding_config?.configuration === 'double');

  // Generate summary
  const summaryParts = [];
  if (enclosure) summaryParts.push(enclosure.name.toLowerCase());
  if (framing) summaryParts.push(framing.name.toLowerCase());
  if (hardware) summaryParts.push(`${hardware.name.toLowerCase()} hardware`);

  let summary = `A stunning ${summaryParts.slice(0, 3).join(', ')} shower enclosure${hardware ? ` with elegant ${hardware.name.toLowerCase()} accents` : ''}. Perfectly tailored to transform your bathroom.`;

  if (isDoubleDoor) {
    summary += ' Note: The double door configuration may be adjusted in the visualization to account for your bathroom\'s layout and any obstructions.';
  }

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
  onRegenerate,
  enclosureOptions,
  framingOptions,
  hardwareOptions,
  handleOptions,
  onEnclosureChange,
  onTrackPreferenceChange,
  onHardwareFinishChange,
  onHandleStyleChange,
  detectedHardware,
  onHingedConfigChange,
  onPivotConfigChange,
  onSlidingConfigChange
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const description = form ? generateDescription(form) : null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="text-center space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gold">Your Custom Shower Design</h2>
        <p className="text-gray-400 text-sm md:text-base">
          {loading ? 'Generating your visualization...' : 'See how your shower will look'}
        </p>
      </div>

      {/* Main Content - Side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left side - Image and controls */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Preview Area */}
          <div className="relative w-full overflow-hidden border border-brand-gold bg-black/20">
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

        {/* Right side - Details, options & actions */}
        <div className="flex flex-col gap-4 w-full">
          {/* Description panel */}
          {description && resultUrl && (
            <div className="bg-brand-brown border border-brand-gold p-6 space-y-4">
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
            </div>
          )}

          {/* Action Buttons */}
          {resultUrl && (
            <div className="space-y-2">
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

              {/* Change Options accordion */}
              {form?.mode === 'configure' && enclosureOptions && (
                <div className="border border-white/30 overflow-hidden">
                  <button
                    onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                    className="w-full flex items-center justify-center gap-2 h-9 text-sm font-medium text-white bg-transparent hover:bg-white/10 transition-all duration-300"
                  >
                    Change Options
                    {isOptionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                    style={{ gridTemplateRows: isOptionsOpen ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-white/20 p-5 space-y-4">
                        <div className="space-y-3">
                          {onEnclosureChange && (
                            <>
                              <OptionDropdown
                                label="Enclosure"
                                value={form.enclosure_type}
                                options={enclosureOptions}
                                onChange={(v) => onEnclosureChange(v as EnclosureType)}
                              />
                              {/* Enclosure sub-options */}
                              {form.enclosure_type === 'hinged' && form.hinged_config && onHingedConfigChange && (
                                <div className="ml-32 border-l border-brand-gold/20 pl-3 py-1 space-y-1.5">
                                  <SubOptionPills
                                    label="To Ceiling"
                                    options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
                                    value={form.hinged_config.to_ceiling ? 'yes' : 'no'}
                                    onChange={(v) => onHingedConfigChange({ ...form.hinged_config!, to_ceiling: v === 'yes' })}
                                  />
                                  <SubOptionPills
                                    label="Door Direction"
                                    options={[
                                      { value: 'left', label: 'Left' },
                                      { value: 'right', label: 'Right' },
                                      { value: 'double', label: 'Double' },
                                    ]}
                                    value={form.hinged_config.direction}
                                    onChange={(v) => onHingedConfigChange({ ...form.hinged_config!, direction: v as DoorDirection })}
                                  />
                                </div>
                              )}
                              {form.enclosure_type === 'pivot' && form.pivot_config && onPivotConfigChange && (
                                <div className="ml-32 border-l border-brand-gold/20 pl-3 py-1 space-y-1.5">
                                  <SubOptionPills
                                    label="Door Direction"
                                    options={[
                                      { value: 'left', label: 'Left' },
                                      { value: 'right', label: 'Right' },
                                      { value: 'double', label: 'Double' },
                                    ]}
                                    value={form.pivot_config.direction}
                                    onChange={(v) => onPivotConfigChange({ ...form.pivot_config!, direction: v as DoorDirection })}
                                  />
                                </div>
                              )}
                              {form.enclosure_type === 'sliding' && form.sliding_config && onSlidingConfigChange && (
                                <div className="ml-32 border-l border-brand-gold/20 pl-3 py-1 space-y-1.5">
                                  <SubOptionPills
                                    label="Doors"
                                    options={[{ value: 'single', label: 'Single' }, { value: 'double', label: 'Double' }]}
                                    value={form.sliding_config.configuration}
                                    onChange={(v) => onSlidingConfigChange({ ...form.sliding_config!, configuration: v as SlidingConfiguration })}
                                  />
                                  <SubOptionPills
                                    label="Door Direction"
                                    options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]}
                                    value={form.sliding_config.direction}
                                    onChange={(v) => onSlidingConfigChange({ ...form.sliding_config!, direction: v as SlidingDirection })}
                                  />
                                </div>
                              )}
                            </>
                          )}
                          {framingOptions && onTrackPreferenceChange && (
                            <OptionDropdown
                              label="Framing"
                              value={form.track_preference}
                              options={framingOptions}
                              onChange={(v) => onTrackPreferenceChange(v as TrackPreference)}
                            />
                          )}
                          {hardwareOptions && onHardwareFinishChange && (
                            <OptionDropdown
                              label="Hardware"
                              value={form.hardware_finish}
                              options={hardwareOptions}
                              onChange={(v) => onHardwareFinishChange(v as HardwareFinish)}
                              badge={detectedHardware && detectedHardware !== 'none' ? detectedHardware : undefined}
                            />
                          )}
                          {handleOptions && onHandleStyleChange && (
                            <OptionDropdown
                              label="Handle"
                              value={form.handle_style}
                              options={handleOptions}
                              onChange={(v) => onHandleStyleChange(v as HandleStyle)}
                            />
                          )}
                        </div>

                        {onRegenerate && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => {
                                setIsOptionsOpen(false);
                                onRegenerate();
                              }}
                              disabled={loading}
                              className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium bg-brand-gold text-brand-brown hover:bg-brand-gold/90 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                            >
                              <Sparkles size={16} />
                              {loading ? 'Generating...' : 'Re-Generate'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
          )}
        </div>
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
