'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
import { Card, CardContent } from './ui/Card';
import { ContactFormModal } from './ContactFormModal';
import { ModeSelectionStep } from './wizard/ModeSelectionStep';
import { PhotoUploadStep } from './wizard/PhotoUploadStep';
import { EnclosureTypeStep } from './wizard/EnclosureTypeStep';
import { GlassFramingStep } from './wizard/GlassFramingStep';
import { HardwareHandlesStep } from './wizard/HardwareHandlesStep';
import { ResultStep } from './wizard/ResultStep';
import { ProgressIndicator } from './wizard/ProgressIndicator';
import { StepNavigation } from './wizard/StepNavigation';
import { 
  Droplets, Grid, BoxSelect, Minimize, Shield, Square, Sparkles 
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

// Rich Select Option Interface (for step components)
interface RichSelectOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

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
    currentStep,
    maxStepReached,
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
    resetAll,
    createHistoryLabel,
    setForm,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    canProceedToNextStep,
    getTotalSteps
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
          // Auto-advance to next step
          setTimeout(() => goToNextStep(), 500);
        } else {
          setInspirationFile(file);
          setInspirationPreviewUrl(URL.createObjectURL(file));
          // Auto-advance to next step
          setTimeout(() => goToNextStep(), 500);
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
        prompt,
        targetWidth: bathroomImageData.width,
        targetHeight: bathroomImageData.height
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
      
      // Auto-advance to result step
      goToNextStep();

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
  }, [imageFile, inspirationFile, form, setLoading, setError, setResultUrl, addHistoryItem, setShowResult, createHistoryLabel, goToNextStep]);

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        // Mode Selection
        return (
          <ModeSelectionStep
            mode={form.mode}
            onModeSelect={(mode) => updateFormField('mode', mode)}
            onNext={goToNextStep}
          />
        );
      
      case 2:
        // Upload Bathroom Photo
        return (
          <PhotoUploadStep
            type="bathroom"
            file={imageFile}
            previewUrl={previewUrl}
            validating={validating === 'target'}
            onFileChange={(e) => handleFileChange(e, 'target')}
            onRemove={() => {
              setImageFile(null);
              setPreviewUrl(null);
            }}
          />
        );
      
      case 3:
        if (form.mode === 'configure') {
          // Enclosure Type Selection
          return (
            <EnclosureTypeStep
              enclosureType={form.enclosure_type}
              showerShape={form.shower_shape}
              infoMessage={infoMessage}
              onEnclosureSelect={handleEnclosureChange}
            />
          );
        } else {
          // Upload Inspiration Photo
          return (
            <PhotoUploadStep
              type="inspiration"
              file={inspirationFile}
              previewUrl={inspirationPreviewUrl}
              validating={validating === 'inspiration'}
              onFileChange={(e) => handleFileChange(e, 'inspiration')}
              onRemove={() => {
                setInspirationFile(null);
                setInspirationPreviewUrl(null);
              }}
            />
          );
        }
      
      case 4:
        if (form.mode === 'configure') {
          // Glass & Framing
          return (
            <GlassFramingStep
              glassStyle={form.glass_style}
              trackPreference={form.track_preference}
              onGlassStyleChange={(style) => updateFormField('glass_style', style)}
              onTrackPreferenceChange={(track) => updateFormField('track_preference', track)}
              glassOptions={glassOptions}
              framingOptions={framingOptions}
            />
          );
        } else {
          // Result for inspiration mode
          return (
            <ResultStep
              loading={loading}
              resultUrl={resultUrl}
              previewUrl={previewUrl}
              showResult={showResult}
              error={error}
              history={history}
              onToggleView={() => setShowResult(!showResult)}
              onSelectHistory={(item) => selectHistoryItem(item, false)}
              onSave={() => {
                setContactModalMode('save');
                setContactModalOpen(true);
              }}
              onRequestQuote={() => {
                setContactModalMode('quote');
                setContactModalOpen(true);
              }}
              onTryAgain={() => {
                resetAll();
                goToStep(1);
              }}
            />
          );
        }
      
      case 5:
        // Hardware & Handles (configure only)
        return (
          <HardwareHandlesStep
            hardwareFinish={form.hardware_finish}
            handleStyle={form.handle_style}
            onHardwareFinishChange={(finish) => updateFormField('hardware_finish', finish)}
            onHandleStyleChange={(style) => updateFormField('handle_style', style)}
            hardwareOptions={hardwareOptions}
            handleOptions={handleOptions}
          />
        );
      
      case 6:
        // Result (configure only)
        return (
          <ResultStep
            loading={loading}
            resultUrl={resultUrl}
            previewUrl={previewUrl}
            showResult={showResult}
            error={error}
            history={history}
            onToggleView={() => setShowResult(!showResult)}
            onSelectHistory={(item) => selectHistoryItem(item, false)}
            onSave={() => {
              setContactModalMode('save');
              setContactModalOpen(true);
            }}
            onRequestQuote={() => {
              setContactModalMode('quote');
              setContactModalOpen(true);
            }}
            onTryAgain={() => {
              resetAll();
              goToStep(1);
            }}
          />
        );
      
      default:
        return null;
    }
  };

  // Determine if we should show generate button
  const showGenerateButton = 
    (form.mode === 'configure' && currentStep === 5) ||
    (form.mode === 'inspiration' && currentStep === 3);

  const isResultStep = 
    (form.mode === 'configure' && currentStep === 6) ||
    (form.mode === 'inspiration' && currentStep === 4);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Indicator */}
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={getTotalSteps()}
        maxStepReached={maxStepReached}
        onStepClick={goToStep}
        mode={form.mode}
      />

      {/* Main Card with Current Step */}
      <Card className="shadow-2xl bg-brand-black-secondary border border-brand-primary/50">
        <CardContent className="p-6 md:p-10 lg:p-12">
          {renderCurrentStep()}
        </CardContent>
        
        {/* Step Navigation - Integrated at bottom of card */}
        {!isResultStep && (
          <div className="border-t border-brand-primary/20 px-6 md:px-10 lg:px-12 py-6">
            <StepNavigation
              currentStep={currentStep}
              totalSteps={getTotalSteps()}
              canProceed={canProceedToNextStep()}
              loading={loading}
              onNext={goToNextStep}
              onPrevious={goToPreviousStep}
              onGenerate={onGenerate}
              showGenerateButton={showGenerateButton}
            />
          </div>
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
