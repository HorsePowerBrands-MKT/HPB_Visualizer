'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  EnclosureType, 
  HardwareFinish, 
  HandleStyle, 
  TrackPreference,
  HistoryItem,
  Payload,
  HingedConfig,
  PivotConfig,
  SlidingConfig
} from '@repo/types';
import { CATALOG } from '../lib/gatsby-constants/src';
import { useVisualizerState, fileToBase64Data, buildVisualizationPrompt, buildInspirationPrompt } from '@repo/visualizer-core';
import { Card, CardContent } from './ui/Card';
import { ContactFormModal } from './ContactFormModal';
import { ModeSelectionStep } from './wizard/ModeSelectionStep';
import { PhotoUploadStep } from './wizard/PhotoUploadStep';
import { EnclosureTypeStep } from './wizard/EnclosureTypeStep';
import { FramingHardwareStep } from './wizard/GlassFramingStep';
import { ResultStep } from './wizard/ResultStep';
import { ProgressIndicator } from './wizard/ProgressIndicator';

import { 
  BoxSelect, Minimize, Shield, Square, Sparkles 
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
  <div className="w-10 h-10 flex items-center justify-center">
    {Icon ? <Icon className="text-brand-gold w-6 h-6" strokeWidth={1} /> : <span className="text-[10px] text-brand-gold font-bold uppercase">{label?.substring(0, 2)}</span>}
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
    <div className="w-10 h-10 border border-brand-gold" style={{ background: classes[type] }} />
  );
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

  // UTM team param — read once on mount from the URL
  const [teamUtm, setTeamUtm] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('team');
      if (t) setTeamUtm(t);
    }
  }, []);

  // Track how many times the user has generated an image in this session
  const [generationIndex, setGenerationIndex] = useState(0);

  // Prepare options for Rich Select
  const enclosureOptions: RichSelectOption[] = [
    { value: 'hinged', label: 'Hinged', icon: <IconHinged className="w-10 h-10" /> },
    { value: 'pivot', label: 'Pivot', icon: <IconPivot className="w-10 h-10" /> },
    { value: 'sliding', label: 'Sliding', icon: <IconSliding className="w-10 h-10" /> },
  ];

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
    console.log('[FILE UPLOAD] File selected:', file?.name, file?.size, file?.type);
    
    if (!file) {
      console.log('[FILE UPLOAD] No file selected');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      console.error('[FILE UPLOAD] File too large:', file.size);
      setError("Image size should be less than 10MB.");
      return;
    }

    setValidating(type);
    setError(null);
    console.log('[FILE UPLOAD] Starting validation for:', type);

    try {
      console.log('[FILE UPLOAD] Converting to base64...');
      const imageData = await fileToBase64Data(file);
      console.log('[FILE UPLOAD] Base64 conversion complete, data length:', imageData.data.length);

      console.log('[FILE UPLOAD] Calling validation API...');
      const response = await fetch('/api/validate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData)
      });

      console.log('[FILE UPLOAD] API response status:', response.status);
      const result = await response.json();
      console.log('[FILE UPLOAD] API result:', result);
      
      if (!result.valid) {
        console.warn('[FILE UPLOAD] Image validation failed:', result.reason);
        setError(result.reason || "The uploaded image does not appear to be a bathroom or shower. Please upload a valid photo.");
        e.target.value = '';
        setValidating(null);
        return;
      }

      console.log('[FILE UPLOAD] Validation successful, shape detected:', result.shape);

      if (type === 'target') {
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setResultUrl(null);
        setShowResult(false);
        
        const detectedHw = result.detectedHardware || 'none';
        setForm({
          ...form,
          shower_shape: result.shape,
          detected_hardware: detectedHw,
          ...(detectedHw !== 'none' ? { hardware_finish: detectedHw as HardwareFinish } : {}),
          ...(result.shape === 'neo_angle' ? { enclosure_type: 'hinged' as EnclosureType } : {})
        });
        if (result.shape === 'neo_angle') {
          setInfoMessage("We detected a Neo-Angle corner shower. We've automatically set your door type to 'Hinged' to match this specific layout.");
          setTimeout(() => setInfoMessage(null), 8000);
        }
        // Auto-advance for configure mode (single upload step)
        if (form.mode === 'configure') {
          console.log('[FILE UPLOAD] Auto-advancing to next step...');
          setTimeout(() => goToNextStep(true), 500);
        }
      } else {
        setInspirationFile(file);
        setInspirationPreviewUrl(URL.createObjectURL(file));
      }
    } catch (err) {
      console.error('[FILE UPLOAD] Error during validation:', err);
      const errorMessage = err instanceof Error ? err.message : "Unable to verify image. Please try again.";
      setError(errorMessage);
      alert(`Upload Error: ${errorMessage}\n\nPlease check the browser console for more details.`);
    } finally {
      setValidating(null);
      console.log('[FILE UPLOAD] Validation process complete');
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
      
      // Generate session_id if not already set
      const sessionId = form.session_id || uuidv4();
      
      // Update form with session_id
      const updatedForm = { ...form, session_id: sessionId };
      setForm(updatedForm);
      
      const newHistoryItem: HistoryItem = {
        id: uuidv4(),
        timestamp: Date.now(),
        imageUrl: result.image,
        label: createHistoryLabel(form),
        payload: updatedForm
      };

      const nextGenIndex = generationIndex + 1;
      setGenerationIndex(nextGenIndex);

      setResultUrl(result.image);
      addHistoryItem(newHistoryItem);
      setShowResult(true);
      
      // Auto-save visualization data to Supabase
      try {
        console.log('[AUTO-SAVE] Starting image uploads...');
        
        // Upload visualization image to Supabase Storage
        const vizUploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: result.image,
            fileName: `visualization_${sessionId}_${nextGenIndex}.png`
          })
        });
        
        if (!vizUploadResponse.ok) {
          throw new Error('Failed to upload visualization image');
        }
        
        const vizUploadData = await vizUploadResponse.json();
        console.log('[AUTO-SAVE] Visualization image uploaded:', vizUploadData.url);
        
        // Upload original image to Supabase Storage (only on first generation)
        let originalImageUrl: string | null = null;
        if (nextGenIndex === 1) {
          const originalImageData = await fileToBase64Data(imageFile);
          const originalUploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageData: `data:${originalImageData.mimeType};base64,${originalImageData.data}`,
              fileName: `original_${sessionId}.${originalImageData.mimeType.split('/')[1]}`
            })
          });
          
          if (!originalUploadResponse.ok) {
            throw new Error('Failed to upload original image');
          }
          
          const originalUploadData = await originalUploadResponse.json();
          originalImageUrl = originalUploadData.url;
          console.log('[AUTO-SAVE] Original image uploaded:', originalImageUrl);
        }
        
        // Save visualization data — upserts session record + inserts generation row
        await fetch('/api/save-visualization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            generationIndex: nextGenIndex,
            mode: form.mode,
            enclosureType: form.enclosure_type,
            framingStyle: form.track_preference,
            hardwareFinish: form.hardware_finish,
            handleStyle: form.handle_style,
            showerShape: form.shower_shape,
            // Door sub-option configs — whichever is active gets stored
            hingedConfig: form.hinged_config ?? null,
            pivotConfig: form.pivot_config ?? null,
            slidingConfig: form.sliding_config ?? null,
            visualizationImage: vizUploadData.url,
            ...(originalImageUrl ? { originalImage: originalImageUrl } : {}),
            team: teamUtm || null,
          })
        });
        
        console.log('[AUTO-SAVE] Visualization data saved successfully (generation #', nextGenIndex, ')');
      } catch (saveError) {
        // Log error but don't block user flow
        console.error('[AUTO-SAVE] Failed to auto-save visualization:', saveError);
      }
      
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
  }, [imageFile, inspirationFile, form, generationIndex, teamUtm, setLoading, setError, setResultUrl, addHistoryItem, setShowResult, createHistoryLabel, goToNextStep]);

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
        if (form.mode === 'configure') {
          // Upload Bathroom Photo (single)
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
                setError(null);
              }}
              error={error}
            />
          );
        } else {
          // Upload Both Photos (bathroom + inspiration side by side)
          return (
            <PhotoUploadStep
              type="both"
              file={imageFile}
              previewUrl={previewUrl}
              validating={validating === 'target'}
              onFileChange={(e) => handleFileChange(e, 'target')}
              onRemove={() => {
                setImageFile(null);
                setPreviewUrl(null);
                setError(null);
              }}
              inspirationFile={inspirationFile}
              inspirationPreviewUrl={inspirationPreviewUrl}
              inspirationValidating={validating === 'inspiration'}
              onInspirationFileChange={(e) => handleFileChange(e, 'inspiration')}
              onInspirationRemove={() => {
                setInspirationFile(null);
                setInspirationPreviewUrl(null);
                setError(null);
              }}
              error={error}
            />
          );
        }

      case 3:
        if (form.mode === 'configure') {
          // Enclosure Type Selection
          return (
            <EnclosureTypeStep
              enclosureType={form.enclosure_type}
              showerShape={form.shower_shape}
              infoMessage={infoMessage}
              onEnclosureSelect={handleEnclosureChange}
              hingedConfig={form.hinged_config!}
              pivotConfig={form.pivot_config!}
              slidingConfig={form.sliding_config!}
              onHingedConfigChange={(config: HingedConfig) => updateFormField('hinged_config', config)}
              onPivotConfigChange={(config: PivotConfig) => updateFormField('pivot_config', config)}
              onSlidingConfigChange={(config: SlidingConfig) => updateFormField('sliding_config', config)}
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
              form={form}
              sessionId={form.session_id}
              team={teamUtm}
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

      case 4:
        // Framing, Hardware & Handles (configure only)
        return (
          <FramingHardwareStep
            trackPreference={form.track_preference}
            hardwareFinish={form.hardware_finish}
            handleStyle={form.handle_style}
            onTrackPreferenceChange={(track) => updateFormField('track_preference', track)}
            onHardwareFinishChange={(finish) => updateFormField('hardware_finish', finish)}
            onHandleStyleChange={(style) => updateFormField('handle_style', style)}
            framingOptions={framingOptions}
            hardwareOptions={hardwareOptions}
            handleOptions={handleOptions}
            detectedHardware={form.detected_hardware}
          />
        );

      case 5:
        // Result (configure only)
        return (
          <ResultStep
            loading={loading}
            resultUrl={resultUrl}
            previewUrl={previewUrl}
            showResult={showResult}
            error={error}
            history={history}
            form={form}
            sessionId={form.session_id}
            team={teamUtm}
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
            enclosureOptions={enclosureOptions}
            framingOptions={framingOptions}
            hardwareOptions={hardwareOptions}
            handleOptions={handleOptions}
            onEnclosureChange={handleEnclosureChange}
            onTrackPreferenceChange={(track) => updateFormField('track_preference', track)}
            onHardwareFinishChange={(finish) => updateFormField('hardware_finish', finish)}
            onHandleStyleChange={(style) => updateFormField('handle_style', style)}
            onRegenerate={onGenerate}
            detectedHardware={form.detected_hardware}
            onHingedConfigChange={(config: HingedConfig) => updateFormField('hinged_config', config)}
            onPivotConfigChange={(config: PivotConfig) => updateFormField('pivot_config', config)}
            onSlidingConfigChange={(config: SlidingConfig) => updateFormField('sliding_config', config)}
          />
        );

      default:
        return null;
    }
  };

  // Determine if we should show generate button
  const showGenerateButton =
    (form.mode === 'configure' && currentStep === 4) ||
    (form.mode === 'inspiration' && currentStep === 2);

  const isResultStep =
    (form.mode === 'configure' && currentStep === 5) ||
    (form.mode === 'inspiration' && currentStep === 3);

  return (
    <div className="mx-auto">
      {/* Main Card with Current Step */}
      <Card className="shadow-none bg-brand-brown border-0">
        <CardContent className="p-0">
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Progress Indicator with Navigation */}
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={getTotalSteps()}
        maxStepReached={maxStepReached}
        onStepClick={goToStep}
        mode={form.mode}
        canProceed={canProceedToNextStep()}
        loading={loading}
        onNext={goToNextStep}
        onPrevious={goToPreviousStep}
        onGenerate={onGenerate}
        showGenerateButton={showGenerateButton}
        isResultStep={isResultStep}
      />

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
