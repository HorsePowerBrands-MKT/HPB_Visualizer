'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  EnclosureType, 
  GlassStyle, 
  HardwareFinish, 
  HandleStyle, 
  TrackPreference,
  HistoryItem,
  Payload
} from '@repo/types';
import { CATALOG } from '../lib/gatsby-constants/src';
import { useVisualizerState, fileToBase64Data, buildVisualizationPrompt, buildInspirationPrompt } from '@repo/visualizer-core';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { RadioGroup, RadioGroupItem } from './ui/RadioGroup';
import { ContactFormModal } from './ContactFormModal';
import { 
  UploadCloud, Sparkles, Image as ImageIcon, Wand2, X, RefreshCw, Settings2, 
  ImagePlus, Loader2, AlertCircle, Info, ChevronDown, History, Check, 
  Droplets, Grid, BoxSelect, Minimize, Shield, Square 
} from 'lucide-react';

// Custom Icons (using HubSpot CDN)
const GOLD_FILTER = "invert(53%) sepia(28%) saturate(1171%) hue-rotate(7deg) brightness(94%) contrast(92%)";

const IconHinged = ({ className }: { className?: string }) => (
  <img 
    src="https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/App%20Icons/Hinged.svg" 
    alt="Hinged" 
    className={`${className} object-contain`} 
    style={{ filter: GOLD_FILTER }}
  />
);

const IconPivot = ({ className }: { className?: string }) => (
  <img 
    src="https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/App%20Icons/Pivot.svg" 
    alt="Pivot" 
    className={`${className} object-contain`} 
    style={{ filter: GOLD_FILTER }}
  />
);

const IconSliding = ({ className }: { className?: string }) => (
  <img 
    src="https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/App%20Icons/Sliding.svg" 
    alt="Sliding" 
    className={`${className} object-contain`} 
    style={{ filter: GOLD_FILTER }}
  />
);

const IconHandleLadder = ({ className }: { className?: string }) => (
  <img 
    src="https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/App%20Icons/Ladder.svg" 
    alt="Ladder Pull" 
    className={`${className} object-contain`} 
    style={{ filter: GOLD_FILTER }}
  />
);

const IconHandleSquare = ({ className }: { className?: string }) => (
  <img 
    src="https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/App%20Icons/Square.svg" 
    alt="Square Pull" 
    className={`${className} object-contain`} 
    style={{ filter: GOLD_FILTER }}
  />
);

const IconHandleCrescent = ({ className }: { className?: string }) => (
  <img 
    src="https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/App%20Icons/Crescent.svg" 
    alt="Crescent Pull" 
    className={`${className} object-contain`} 
    style={{ filter: GOLD_FILTER }}
  />
);

const IconHandleKnob = ({ className }: { className?: string }) => (
  <img 
    src="https://22404821.fs1.hubspotusercontent-na1.net/hubfs/22404821/06-%20Gatsby%20Glass/App%20Icons/Knob.svg" 
    alt="Knob" 
    className={`${className} object-contain`} 
    style={{ filter: GOLD_FILTER }}
  />
);

const PlaceholderIcon = ({ icon: Icon, label }: { icon?: React.ElementType, label?: string }) => (
  <div className="w-10 h-10 rounded-md flex items-center justify-center border border-brand-primary/20 bg-brand-black">
    {Icon ? <Icon className="text-[#a37529] w-6 h-6" /> : <span className="text-[10px] text-[#a37529] font-bold uppercase">{label?.substring(0, 2)}</span>}
  </div>
);

// Rich Select Component
interface RichSelectOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const RichSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  disabled, 
  showWarning 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  options: RichSelectOption[]; 
  disabled?: boolean; 
  showWarning?: boolean 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (v: string) => {
    if (!disabled) {
      onChange(v);
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-2 w-full" ref={containerRef}>
      <Label className="text-base text-brand-secondary">{label}</Label>
      <div className="relative">
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex w-full items-center justify-between rounded-xl border bg-brand-black-secondary p-3 transition-all cursor-pointer 
            ${showWarning ? 'border-brand-primary' : 'border-brand-primary/50'} 
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-secondary hover:shadow-lg hover:shadow-brand-primary/10'}
          `}
        >
          <div className="flex items-center gap-4 text-white overflow-hidden">
            <div className="p-2 bg-brand-black rounded-lg border border-brand-primary/10 flex-shrink-0">
              {selectedOption.icon}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="font-bold text-lg tracking-wide truncate">{selectedOption.label}</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider truncate">Selected</span>
            </div>
          </div>
          <ChevronDown size={20} className={`text-brand-secondary transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-brand-primary/50 bg-brand-black-secondary shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-brand-primary/10 last:border-0
                  ${value === option.value ? 'bg-brand-primary/20' : 'hover:bg-brand-primary/10'}
                `}
              >
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${value === option.value ? 'bg-brand-black/50' : 'bg-transparent'}`}>
                  {option.icon}
                </div>
                <span className={`text-base font-medium flex-grow ${value === option.value ? 'text-brand-secondary' : 'text-gray-300'}`}>
                  {option.label}
                </span>
                {value === option.value && <Check className="text-brand-secondary flex-shrink-0" size={18} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Icon components for options
const HardwareIcon = ({ type }: { type: HardwareFinish }) => {
  const classes: Record<HardwareFinish, string> = {
    chrome: "linear-gradient(135deg, #e0e0e0 0%, #ffffff 50%, #a0a0a0 100%)",
    brushed_nickel: "repeating-linear-gradient(45deg, #d0d0d0, #d0d0d0 2px, #c0c0c0 2px, #c0c0c0 4px)",
    matte_black: "#171717",
    polished_brass: "linear-gradient(135deg, #fef9c3 0%, #facc15 50%, #ca8a04 100%)",
    oil_rubbed_bronze: "#3f2e26"
  };

  return (
    <div className="w-10 h-10 rounded-md border border-brand-primary/20 shadow-sm" style={{ background: classes[type] }} />
  );
};

const GlassIcon = ({ type }: { type: GlassStyle }) => {
  switch(type) {
    case 'clear': return <PlaceholderIcon icon={Droplets} label="CL" />;
    case 'low_iron': return <PlaceholderIcon icon={Sparkles} label="LI" />;
    case 'p516': return <PlaceholderIcon icon={Grid} label="P5" />;
    default: return <PlaceholderIcon icon={Sparkles} label="GL" />;
  }
};

const FramingIcon = ({ type }: { type: TrackPreference }) => {
  switch(type) {
    case 'frameless': return <PlaceholderIcon icon={BoxSelect} label="FL" />;
    case 'semi_frameless': return <PlaceholderIcon icon={Minimize} label="SF" />;
    case 'framed': return <PlaceholderIcon icon={Square} label="FR" />;
    default: return <PlaceholderIcon icon={Shield} label="TR" />;
  }
};

// Main Component
export const GatsbyGlassVisualizer: React.FC = () => {
  const {
    form,
    imageFile,
    inspirationFile,
    previewUrl,
    inspirationPreviewUrl,
    resultUrl,
    history,
    loading,
    validating,
    error,
    showResult,
    infoMessage,
    setImageFile,
    setInspirationFile,
    setPreviewUrl,
    setInspirationPreviewUrl,
    setResultUrl,
    addHistoryItem,
    selectHistoryItem,
    setLoading,
    setValidating,
    setError,
    setShowResult,
    setInfoMessage,
    handleEnclosureChange,
    updateFormField,
    updateConfig,
    resetAll,
    createHistoryLabel,
    setForm
  } = useVisualizerState();

  // Cleanup preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (inspirationPreviewUrl) {
        URL.revokeObjectURL(inspirationPreviewUrl);
      }
    };
  }, [previewUrl, inspirationPreviewUrl]);

  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
  const [contactModalMode, setContactModalMode] = useState<'save' | 'quote'>('save');

  // Prepare options for Rich Select
  const enclosureOptions: RichSelectOption[] = [
    { value: 'hinged', label: 'Hinged', icon: <IconHinged className="w-10 h-10" /> },
    { value: 'pivot', label: 'Pivot', icon: <IconPivot className="w-10 h-10" /> },
    { value: 'sliding', label: 'Sliding', icon: <IconSliding className="w-10 h-10" /> },
  ];

  const glassOptions: RichSelectOption[] = Object.entries(CATALOG.glassStyles).map(([key, { name }]) => ({
    value: key,
    label: name,
    icon: <GlassIcon type={key as GlassStyle} />
  }));

  const hardwareOptions: RichSelectOption[] = Object.entries(CATALOG.hardwareFinishes).map(([key, { name }]) => ({
    value: key,
    label: name,
    icon: <HardwareIcon type={key as HardwareFinish} />
  }));

  const handleOptions: RichSelectOption[] = [
    { value: 'ladder', label: 'Ladder Pull', icon: <IconHandleLadder className="w-10 h-10" /> },
    { value: 'square', label: 'Square Pull', icon: <IconHandleSquare className="w-10 h-10" /> },
    { value: 'd_pull', label: 'Crescent (D)', icon: <IconHandleCrescent className="w-10 h-10" /> },
    { value: 'knob', label: 'Knob', icon: <IconHandleKnob className="w-10 h-10" /> }
  ];

  const framingOptions: RichSelectOption[] = [
    { value: 'frameless', label: 'Frameless', icon: <FramingIcon type="frameless" /> },
    { value: 'semi_frameless', label: 'Semi-Frameless', icon: <FramingIcon type="semi_frameless" /> },
    { value: 'framed', label: 'Framed', icon: <FramingIcon type="framed" /> }
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'target' | 'inspiration') => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size should be less than 10MB.");
        return;
      }

      setValidating(type);
      setError(null);

      try {
        const imageData = await fileToBase64Data(file);

        const response = await fetch('/api/validate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imageData)
        });

        const result = await response.json();
        
        if (!result.valid) {
          setError(result.reason || "The uploaded image does not appear to be a bathroom or shower. Please upload a valid photo.");
          e.target.value = '';
          setValidating(null);
          return;
        }

        if (type === 'target') {
          setImageFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          setResultUrl(null);
          setShowResult(false);
          
          setForm({
            ...form,
            shower_shape: result.shape,
            ...(result.shape === 'neo_angle' ? { enclosure_type: 'hinged' as EnclosureType } : {})
          });
          if (result.shape === 'neo_angle') {
            setInfoMessage("We detected a Neo-Angle corner shower. We've automatically set your door type to 'Hinged' to match this specific layout.");
            setTimeout(() => setInfoMessage(null), 8000);
          }

        } else {
          setInspirationFile(file);
          setInspirationPreviewUrl(URL.createObjectURL(file));
        }
      } catch (err) {
        setError("Unable to verify image. Please try again.");
      } finally {
        setValidating(null);
      }
    }
  };

  const onGenerate = useCallback(async () => {
    if (!imageFile) {
      setError("Please upload a bathroom photo first.");
      return;
    }
    if (form.mode === 'inspiration' && !inspirationFile) {
      setError("Please upload an inspiration photo.");
      return;
    }

    setLoading(true);
    setError(null);
    setShowResult(false);

    try {
      const bathroomImageData = await fileToBase64Data(imageFile);
      const prompt = form.mode === 'configure' 
        ? buildVisualizationPrompt(form)
        : buildInspirationPrompt(form.shower_shape);

      const requestBody: any = {
        bathroomImage: bathroomImageData,
        prompt
      };

      if (form.mode === 'inspiration' && inspirationFile) {
        requestBody.inspirationImage = await fileToBase64Data(inspirationFile);
      }

      const response = await fetch('/api/generate-visualization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate visualization');
      }

      const result = await response.json();
      
      const newHistoryItem: HistoryItem = {
        id: uuidv4(),
        timestamp: Date.now(),
        imageUrl: result.image,
        label: createHistoryLabel(form),
        payload: { ...form, session_id: uuidv4() }
      };

      setResultUrl(result.image);
      addHistoryItem(newHistoryItem);
      setShowResult(true);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, [imageFile, inspirationFile, form, setLoading, setError, setResultUrl, addHistoryItem, setShowResult, createHistoryLabel]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="shadow-2xl bg-brand-black-secondary border border-brand-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-brand-secondary">
            <Wand2 className="text-brand-secondary" />
            Customize Your Shower
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SECTION 1: PHOTO UPLOAD */}
          <div className="space-y-2">
            <Label htmlFor="photo-upload" className="text-lg font-medium text-brand-secondary">1. Upload Your Bathroom Photo</Label>
            <div className="relative flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg border-brand-primary/50 hover:border-brand-secondary transition-colors bg-black/20 overflow-hidden">
              {validating === 'target' && (
                <div className="absolute inset-0 z-20 bg-black/70 flex flex-col items-center justify-center text-brand-secondary animate-in fade-in">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <span className="text-sm font-medium">Verifying & Scanning Layout...</span>
                </div>
              )}
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Uploaded shower" className="object-contain h-full w-full rounded-md" />
                  <button 
                    onClick={() => {setImageFile(null); setPreviewUrl(null);}} 
                    className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 z-10"
                    aria-label="Remove uploaded image"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <div className="text-center p-4">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-400">Click to upload or drag & drop</p>
                  <p className="text-xs text-gray-400">Best results: Straight-on photo</p>
                </div>
              )}
              <Input 
                id="photo-upload" 
                type="file" 
                accept="image/*" 
                disabled={validating !== null}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                onChange={(e) => handleFileChange(e, 'target')} 
              />
            </div>
          </div>

          {/* SECTION 2: MODE SELECTION */}
          <div className="space-y-3">
            <Label className="text-lg font-medium text-brand-secondary">2. Choose Design Method</Label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => updateFormField('mode', 'configure')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                  form.mode === 'configure' 
                  ? 'bg-brand-primary/20 border-brand-secondary text-brand-secondary shadow-[0_0_10px_rgba(228,191,110,0.15)]' 
                  : 'bg-brand-black border-brand-primary/20 text-gray-400 hover:bg-brand-black-secondary hover:border-brand-primary/50 hover:text-brand-secondary/80'
                }`}
              >
                <Settings2 size={18} />
                <span className="font-medium">Design Your Own</span>
              </button>
              <button 
                onClick={() => updateFormField('mode', 'inspiration')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                  form.mode === 'inspiration' 
                  ? 'bg-brand-primary/20 border-brand-secondary text-brand-secondary shadow-[0_0_10px_rgba(228,191,110,0.15)]' 
                  : 'bg-brand-black border-brand-primary/20 text-gray-400 hover:bg-brand-black-secondary hover:border-brand-primary/50 hover:text-brand-secondary/80'
                }`}
              >
                <ImagePlus size={18} />
                <span className="font-medium">Match Inspiration</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: CONDITIONAL CONTENT */}
          {form.mode === 'configure' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-4">
                <Label className="text-lg font-medium text-brand-secondary">3. Door Configuration</Label>
                <div className="bg-brand-black-secondary/40 p-6 rounded-xl space-y-6 border border-brand-primary/20 shadow-inner">
                  
                  <RichSelect 
                    label="Enclosure Type"
                    value={form.enclosure_type} 
                    onChange={(v) => handleEnclosureChange(v as EnclosureType)}
                    options={enclosureOptions}
                    showWarning={!!infoMessage}
                  />

                  {infoMessage && (
                    <div className="flex items-start gap-3 p-3 bg-brand-primary/10 border border-brand-primary/30 rounded-md text-brand-secondary text-sm animate-in fade-in slide-in-from-top-2">
                      <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span>{infoMessage}</span>
                    </div>
                  )}

                  {/* Dynamic Question Flow */}
                  <div className="space-y-5">
                    {/* HINGED */}
                    {form.enclosure_type === 'hinged' && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-brand-secondary/80">To Ceiling?</Label>
                          <RadioGroup 
                            value={form.hinged_config?.to_ceiling ? "yes" : "no"} 
                            onValueChange={(v) => updateConfig('hinged_config', 'to_ceiling', v === 'yes')}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="h_no"/><Label htmlFor="h_no">No</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="h_yes"/><Label htmlFor="h_yes">Yes</Label></div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-brand-secondary/80">Direction</Label>
                          <RadioGroup 
                            value={form.hinged_config?.direction || "swing_left"} 
                            onValueChange={(v) => updateConfig('hinged_config', 'direction', v)}
                            className="flex flex-col gap-2"
                          >
                            <div className="flex items-center space-x-2"><RadioGroupItem value="swing_left" id="h_sl"/><Label htmlFor="h_sl">Swing Left</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="swing_right" id="h_sr"/><Label htmlFor="h_sr">Swing Right</Label></div>
                            {form.shower_shape !== 'neo_angle' && (
                              <div className="flex items-center space-x-2"><RadioGroupItem value="double_door" id="h_dd"/><Label htmlFor="h_dd">Double Door</Label></div>
                            )}
                          </RadioGroup>
                        </div>
                      </>
                    )}

                    {/* PIVOT */}
                    {form.enclosure_type === 'pivot' && (
                      <div className="space-y-2">
                        <Label className="text-brand-secondary/80">Direction</Label>
                        <RadioGroup 
                          value={form.pivot_config?.direction || "swing_left"} 
                          onValueChange={(v) => updateConfig('pivot_config', 'direction', v)}
                          className="flex flex-col gap-2"
                        >
                          <div className="flex items-center space-x-2"><RadioGroupItem value="swing_left" id="p_sl"/><Label htmlFor="p_sl">Swing Left</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="swing_right" id="p_sr"/><Label htmlFor="p_sr">Swing Right</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="double_door" id="p_dd"/><Label htmlFor="p_dd">Double Door</Label></div>
                        </RadioGroup>
                      </div>
                    )}

                    {/* SLIDING */}
                    {form.enclosure_type === 'sliding' && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-brand-secondary/80">Configuration</Label>
                          <RadioGroup 
                            value={form.sliding_config?.sub_type || "single_door"} 
                            onValueChange={(v) => updateConfig('sliding_config', 'sub_type', v)}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2"><RadioGroupItem value="single_door" id="s_single"/><Label htmlFor="s_single">Single Door</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="double_door" id="s_double"/><Label htmlFor="s_double">Double Door</Label></div>
                          </RadioGroup>
                        </div>

                        {form.sliding_config?.sub_type === 'single_door' && (
                          <div className="space-y-2">
                            <Label className="text-brand-secondary/80">Direction</Label>
                            <RadioGroup 
                              value={form.sliding_config?.direction || "sliding_left"} 
                              onValueChange={(v) => updateConfig('sliding_config', 'direction', v)}
                              className="flex flex-col gap-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sliding_left" id="sl_l"/>
                                <Label htmlFor="sl_l">Sliding Left <span className="text-gray-500 text-xs">(Inner door slides, outer door stays set)</span></Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sliding_right" id="sl_r"/>
                                <Label htmlFor="sl_r">Sliding Right <span className="text-gray-500 text-xs">(Inner door slides, outer door stays set)</span></Label>
                              </div>
                            </RadioGroup>
                          </div>
                        )}

                        {form.sliding_config?.sub_type === 'double_door' && (
                          <div className="space-y-2">
                            <Label className="text-brand-secondary/80">Direction</Label>
                            <RadioGroup 
                              value={form.sliding_config?.direction || "inner_left"} 
                              onValueChange={(v) => updateConfig('sliding_config', 'direction', v)}
                              className="flex flex-col gap-2"
                            >
                              <div className="flex items-center space-x-2"><RadioGroupItem value="inner_left" id="dd_l"/><Label htmlFor="dd_l">Inner Door Left</Label></div>
                              <div className="flex items-center space-x-2"><RadioGroupItem value="inner_right" id="dd_r"/><Label htmlFor="dd_r">Inner Door Right</Label></div>
                            </RadioGroup>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-medium text-brand-secondary">4. Finishes & Hardware</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RichSelect
                    label="Glass Style"
                    value={form.glass_style}
                    onChange={(v) => updateFormField('glass_style', v as GlassStyle)}
                    options={glassOptions}
                  />
                  <RichSelect
                    label="Hardware Finish"
                    value={form.hardware_finish}
                    onChange={(v) => updateFormField('hardware_finish', v as HardwareFinish)}
                    options={hardwareOptions}
                  />
                  <RichSelect
                    label="Handle Style"
                    value={form.handle_style}
                    onChange={(v) => updateFormField('handle_style', v as HandleStyle)}
                    options={handleOptions}
                  />
                  <RichSelect
                    label="Framing Style"
                    value={form.track_preference}
                    onChange={(v) => updateFormField('track_preference', v as TrackPreference)}
                    options={framingOptions}
                  />
                </div>
              </div>
            </div>
          )}

          {form.mode === 'inspiration' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label htmlFor="insp-upload" className="text-lg font-medium text-brand-secondary">3. Upload Inspiration Photo</Label>
                <p className="text-sm text-gray-400">We will apply the style (glass, hardware, door type) of this photo to your bathroom.</p>
                <div className="relative flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg border-brand-primary/50 hover:border-brand-secondary transition-colors bg-black/20 overflow-hidden">
                  {validating === 'inspiration' && (
                    <div className="absolute inset-0 z-20 bg-black/70 flex flex-col items-center justify-center text-brand-secondary animate-in fade-in">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <span className="text-sm font-medium">Verifying & Collecting...</span>
                    </div>
                  )}
                  {inspirationPreviewUrl ? (
                    <>
                      <img src={inspirationPreviewUrl} alt="Inspiration" className="object-contain h-full w-full rounded-md" />
                      <button onClick={() => {setInspirationFile(null); setInspirationPreviewUrl(null);}} className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 z-10">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <ImagePlus className="mx-auto h-12 w-12 text-brand-secondary" />
                      <p className="mt-2 text-sm text-gray-400">Upload Inspiration Image</p>
                    </div>
                  )}
                  <Input 
                    id="insp-upload" 
                    type="file" 
                    accept="image/*" 
                    disabled={validating !== null}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                    onChange={(e) => handleFileChange(e, 'inspiration')} 
                  />
                </div>
              </div>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onGenerate} disabled={loading || validating !== null || !imageFile || (form.mode === 'inspiration' && !inspirationFile)} className="w-full sm:w-auto flex-grow">
            {loading ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Rendering...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> {history.length > 0 ? "Generate Another Option" : "Generate Preview"}</>
            )}
          </Button>
          <Button onClick={resetAll} variant="secondary" className="w-full sm:w-auto">Start Over</Button>
        </CardFooter>
      </Card>

      <Card className="shadow-2xl bg-brand-black-secondary border border-brand-primary/50 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-brand-secondary">
            <ImageIcon className="text-brand-secondary" />
            Instant Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          <div className="relative aspect-[4/5] bg-brand-black rounded-xl flex items-center justify-center overflow-hidden">
            {loading && (
              <div className="absolute inset-0 z-10 bg-black/50 flex flex-col items-center justify-center text-white">
                <RefreshCw className="h-10 w-10 animate-spin" />
                <p className="mt-4 text-lg font-medium">Generating your vision...</p>
                <p className="text-sm">This can take a few moments.</p>
              </div>
            )}
            {!resultUrl && !previewUrl && (
              <div className="text-center text-gray-400">
                <ImageIcon className="mx-auto h-12 w-12" />
                <p className="mt-2">Your preview will appear here.</p>
              </div>
            )}
            <div className="absolute inset-0 transition-opacity duration-500" style={{ opacity: showResult ? 0 : 1 }}>
              {previewUrl && <img src={previewUrl} alt="Before" className="object-contain h-full w-full" />}
            </div>
            <div className="absolute inset-0 transition-opacity duration-500" style={{ opacity: showResult ? 1 : 0 }}>
              {resultUrl && <img src={resultUrl} alt="After" className="object-contain h-full w-full" />}
            </div>
          </div>
          
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-md text-red-200 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resultUrl && (
            <div className="flex justify-center items-center gap-4 bg-brand-black p-2 rounded-lg">
              <span className="text-sm font-medium">Before</span>
              <div onClick={() => setShowResult(!showResult)} className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-black"
                style={{backgroundColor: showResult ? '#a37529' : '#6b7280'}}>
                <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  style={{transform: showResult ? 'translateX(1.25rem)' : 'translateX(0rem)'}}></span>
              </div>
              <span className="text-sm font-medium">After</span>
            </div>
          )}

          {/* HISTORY GALLERY */}
          {history.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-brand-secondary flex items-center gap-2"><History size={16}/> Design Gallery</Label>
                <span className="text-xs text-gray-400">Select to compare</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => selectHistoryItem(item, false)}
                    className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 cursor-pointer transition-all snap-start
                      ${resultUrl === item.imageUrl ? 'border-brand-secondary ring-2 ring-brand-primary/30' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-500'}
                    `}
                  >
                    <img src={item.imageUrl} alt="Option" className="w-full h-full object-cover" />
                    {resultUrl === item.imageUrl && (
                      <div className="absolute inset-0 bg-brand-secondary/10 flex items-center justify-center">
                        <div className="bg-brand-secondary text-black rounded-full p-1 shadow-sm">
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

        </CardContent>
        {resultUrl && (
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setContactModalMode('save');
                setContactModalOpen(true);
              }}
            >
              Save & Send to Me
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setContactModalMode('quote');
                setContactModalOpen(true);
              }}
            >
              Request Quote
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Contact Form Modal */}
      {resultUrl && imageFile && (
        <ContactFormModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          visualizationData={{
            resultUrl,
            uploadedImage: previewUrl || '',
            configs: form
          }}
          mode={contactModalMode}
        />
      )}
    </div>
  );
};
