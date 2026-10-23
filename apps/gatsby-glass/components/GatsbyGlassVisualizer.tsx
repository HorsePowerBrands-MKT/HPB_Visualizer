'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  EnclosureType,
  HardwareFinish,
  HandleStyle,
  TrackPreference,
  ShowerShape,
  HistoryItem,
  HingedConfig,
  PivotConfig,
  SlidingConfig
} from '@repo/types';
import { CATALOG } from '../lib/gatsby-constants/src';
import { useVisualizerState } from '@repo/visualizer-core';
import { buildVisualizationPrompt, buildInspirationPrompt } from '../lib/promptBuilder';
import { validateUploadedPhoto } from '../lib/uploadValidation';
import { runGenerationPipeline, GenerationRateLimitedError } from '../lib/generationPipeline';
import { useVisualizerSession } from '../hooks/useVisualizerSession';
import { Card, CardContent } from './ui/Card';
import { ContactFormModal } from './ContactFormModal';
import { LeadCapturePopup } from './LeadCapturePopup';
import { ModeSelectionStep } from './wizard/ModeSelectionStep';
import { PhotoUploadStep } from './wizard/PhotoUploadStep';
import { EnclosureTypeStep } from './wizard/EnclosureTypeStep';
import { FramingHardwareStep } from './wizard/GlassFramingStep';
import { ResultStep } from './wizard/ResultStep';
import { ProgressIndicator } from './wizard/ProgressIndicator';
import { VisualizerChrome } from './VisualizerChrome';
import { pastItemToLeadConfigs, type PastVisualizationItem } from './PastVisualizations';
import { GeneratingOverlay } from './GeneratingOverlay';

import {
  BoxSelect, Minimize, Shield, Square
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

interface GatsbyGlassVisualizerProps {
  /** Return to the product chooser. */
  onChangeProduct?: () => void;
}

// Main Component
export const GatsbyGlassVisualizer: React.FC<GatsbyGlassVisualizerProps> = ({
  onChangeProduct,
}) => {
  const {
    form,
    imageFile,
    inspirationFile,
    previewUrl,
    inspirationPreviewUrl,
    resultUrl,
    resultStorageUrl,
    history,
    loading,
    validating,
    error,
    showResult,
    infoMessage,
    currentStep,
    maxStepReached,
    uploadConsent,
    marketingConsent,
    setImageFile,
    setInspirationFile,
    setPreviewUrl,
    setInspirationPreviewUrl,
    setResultUrl,
    setResultStorageUrl,
    addHistoryItem,
    selectHistoryItem,
    setLoading,
    setValidating,
    setError,
    setShowResult,
    setInfoMessage,
    setUploadConsent,
    setMarketingConsent,
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
  const [pastVizModalItem, setPastVizModalItem] = useState<PastVisualizationItem | null>(null);

  // Blocking lead-capture popup that fires once after the 5th generation in
  // a session. `popHandled` flips on submit OR explicit dismiss so we never
  // re-prompt for the rest of the session.
  const [leadPopupOpen, setLeadPopupOpen] = useState<boolean>(false);
  const [popHandled, setPopHandled] = useState<boolean>(false);

  // Visitor session: fingerprint, usage, auth, past visualizations, team UTM.
  // Shared with the railing module (see hooks/useVisualizerSession.ts).
  const {
    userFingerprint,
    usageCount,
    setUsageCount,
    usageLimit,
    setUsageLimit,
    isRateLimited,
    authUser,
    isUnlimitedTeamMember,
    isCandidateUser,
    pastVisualizations,
    refreshPastVisualizations,
    teamUtm,
    handleLogout,
  } = useVisualizerSession();

  // Track how many times the user has generated an image in this session
  const [generationIndex, setGenerationIndex] = useState(0);

  // --- Submission tracking state ---
  const [submissionId, setSubmissionId] = useState<string | null>(null);

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

    if (!file) {
      console.log('[FILE UPLOAD] No file selected');
      return;
    }

    setError(null);

    // Device-side prep (size cap, HEIC, compression) + server validation.
    // Shared with the railing module; see lib/uploadValidation.ts.
    const outcome = await validateUploadedPhoto(file, {
      product: 'shower',
      onBusy: () => setValidating(type),
    });

    if (!outcome.ok) {
      setError(outcome.message);
      e.target.value = '';
      setValidating(null);
      return;
    }

    const { file: fileForFlow, result } = outcome;
    console.log('[FILE UPLOAD] Validation successful, shape detected:', result.shape);

    if (type === 'target') {
      setImageFile(fileForFlow);
      setPreviewUrl(URL.createObjectURL(fileForFlow));
      setResultUrl(null);
      setResultStorageUrl(null);
      setShowResult(false);

      const detectedHw = result.detectedHardware || 'none';
      setForm({
        ...form,
        shower_shape: (result.shape ?? 'standard') as ShowerShape,
        detected_hardware: detectedHw,
        ...(detectedHw !== 'none' ? { hardware_finish: detectedHw as HardwareFinish } : {}),
        ...(result.shape === 'neo_angle' ? { enclosure_type: 'hinged' as EnclosureType } : {})
      });
      if (result.shape === 'neo_angle') {
        setInfoMessage("We detected a Neo-Angle corner shower. We've automatically set your door type to 'Hinged' to match this specific layout.");
        setTimeout(() => setInfoMessage(null), 8000);
      }
      // No auto-advance: user must check the upload consent checkbox before proceeding

    } else {
      setInspirationFile(fileForFlow);
      setInspirationPreviewUrl(URL.createObjectURL(fileForFlow));
    }

    setValidating(null);
    console.log('[FILE UPLOAD] Validation process complete');
  };

  const onGenerate = useCallback(async () => {
    // Block any generation while the 5-image lead popup is up. The user must
    // submit or explicitly dismiss before they can keep generating.
    if (leadPopupOpen) {
      return;
    }
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
      const prompt = form.mode === 'configure'
        ? buildVisualizationPrompt(form)
        : buildInspirationPrompt(form.shower_shape);

      const sessionId = form.session_id || uuidv4();
      const nextGenIndex = generationIndex + 1;

      // Upload submission → generate → attach image → save record.
      // Shared with the railing module; see lib/generationPipeline.ts.
      await runGenerationPipeline({
        product: 'shower',
        imageFile,
        inspirationFile: form.mode === 'inspiration' ? inspirationFile : null,
        prompt,
        sessionId,
        generationIndex: nextGenIndex,
        userFingerprint,
        marketingConsent,
        submissionId,
        teamUtm,
        onSubmissionCreated: setSubmissionId,
        submissionMetadata: {
          mode: form.mode,
          enclosureType: form.enclosure_type,
          framingStyle: form.track_preference,
          hardwareFinish: form.hardware_finish,
          handleStyle: form.handle_style,
          showerShape: form.shower_shape,
        },
        // Pass the structured door config so the server route can attach
        // anatomy reference images for door types with a wrong-default bias
        // (currently pivot). Hinged + sliding pass through unchanged.
        generateExtras: {
          doorType: form.enclosure_type,
          ...(form.pivot_config?.direction
            ? { pivotDirection: form.pivot_config.direction }
            : {}),
        },
        saveRecord: {
          mode: form.mode,
          enclosureType: form.enclosure_type,
          framingStyle: form.track_preference,
          hardwareFinish: form.hardware_finish,
          handleStyle: form.handle_style,
          showerShape: form.shower_shape,
          hingedConfig: form.hinged_config ?? null,
          pivotConfig: form.pivot_config ?? null,
          slidingConfig: form.sliding_config ?? null,
        },
        onGenerated: (outcome) => {
          const updatedForm = { ...form, session_id: sessionId };
          setForm(updatedForm);

          const newHistoryItem: HistoryItem = {
            id: uuidv4(),
            timestamp: Date.now(),
            imageUrl: outcome.image,
            storageUrl: outcome.watermarkedUrl,
            label: createHistoryLabel(form),
            payload: updatedForm
          };

          if (typeof outcome.usageCount === 'number') {
            setUsageCount(outcome.usageCount);
          }
          if (typeof outcome.limit === 'number' && isCandidateUser) {
            setUsageLimit(outcome.limit);
          }
          setGenerationIndex(nextGenIndex);
          setResultUrl(outcome.image);
          setResultStorageUrl(outcome.watermarkedUrl);
          addHistoryItem(newHistoryItem);
          setShowResult(true);

          // After the 5th generation in this session, surface the blocking
          // lead-capture popup once. Submit or explicit dismiss flips
          // `popHandled` so it never re-opens this session.
          if (nextGenIndex === 5 && !popHandled && !isCandidateUser) {
            setLeadPopupOpen(true);
          }
        },
      });

      refreshPastVisualizations();

      // Auto-advance to result step
      goToNextStep();

    } catch (err) {
      if (err instanceof GenerationRateLimitedError) {
        setUsageCount(err.usageCount ?? usageLimit);
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, [imageFile, inspirationFile, form, generationIndex, teamUtm, userFingerprint, usageLimit, marketingConsent, submissionId, leadPopupOpen, popHandled, isCandidateUser, setLoading, setError, setResultUrl, setResultStorageUrl, addHistoryItem, setShowResult, createHistoryLabel, goToNextStep, refreshPastVisualizations, setForm, setUsageCount, setUsageLimit]);

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
                setUploadConsent(false);
                setMarketingConsent(false);
              }}
              error={error}
              uploadConsent={uploadConsent}
              marketingConsent={marketingConsent}
              onUploadConsentChange={setUploadConsent}
              onMarketingConsentChange={setMarketingConsent}
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
                setUploadConsent(false);
                setMarketingConsent(false);
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
              uploadConsent={uploadConsent}
              marketingConsent={marketingConsent}
              onUploadConsentChange={setUploadConsent}
              onMarketingConsentChange={setMarketingConsent}
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
              onSelectHistory={(item) => selectHistoryItem(item as HistoryItem, false)}
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
              isTeamMember={isUnlimitedTeamMember}
              usageCount={usageCount}
              usageLimit={usageLimit}
              hideContactActions={isCandidateUser}
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
            onSelectHistory={(item) => selectHistoryItem(item as HistoryItem, false)}
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
            isTeamMember={isUnlimitedTeamMember}
            usageCount={usageCount}
            usageLimit={usageLimit}
            hideContactActions={isCandidateUser}
          />
        );

      default:
        return null;
    }
  };

  // Determine if we should show generate button (disabled when rate-limited for non-team users
  // or while the 5-image lead popup is blocking the user)
  const canGenerate = isUnlimitedTeamMember || !isRateLimited;
  const showGenerateButton =
    ((form.mode === 'configure' && currentStep === 4) ||
    (form.mode === 'inspiration' && currentStep === 2)) && canGenerate && !leadPopupOpen;

  const isResultStep =
    (form.mode === 'configure' && currentStep === 5) ||
    (form.mode === 'inspiration' && currentStep === 3);

  return (
    <div className="mx-auto">
      {/* Full-screen generation loading overlay */}
      <GeneratingOverlay visible={loading} />

      {/* Change product / auth badge / usage counter / past visualizations */}
      <VisualizerChrome
        onChangeProduct={onChangeProduct}
        authUser={authUser}
        isCandidateUser={isCandidateUser}
        usageCount={usageCount}
        usageLimit={usageLimit}
        isRateLimited={isRateLimited}
        onLogout={handleLogout}
        pastVisualizations={pastVisualizations}
        onPastSave={(item) => {
          setPastVizModalItem(item);
          setContactModalMode('save');
          setContactModalOpen(true);
        }}
        onPastRequestQuote={(item) => {
          setPastVizModalItem(item);
          setContactModalMode('quote');
          setContactModalOpen(true);
        }}
      />

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
        isTeamMember={isUnlimitedTeamMember}
        usageCount={usageCount}
        usageLimit={usageLimit}
      />

      {/* Contact Form Modal — not available for candidate accounts */}
      {!isCandidateUser && (pastVizModalItem || (resultUrl && imageFile)) && (
        <ContactFormModal
          isOpen={contactModalOpen}
          onClose={() => {
            setContactModalOpen(false);
            setPastVizModalItem(null);
          }}
          visualizationData={
            pastVizModalItem
              ? {
                  resultUrl: pastVizModalItem.visualization_image_url || '',
                  uploadedImage: pastVizModalItem.original_image_url || '',
                  configs: pastItemToLeadConfigs(pastVizModalItem),
                }
              : {
                  // Prefer the storage URL so the server can match the hero
                  // against the saved history (the data URL never matches).
                  resultUrl: resultStorageUrl || resultUrl || '',
                  uploadedImage: previewUrl || '',
                  configs: form
                }
          }
          mode={contactModalMode}
          userFingerprint={userFingerprint ?? undefined}
        />
      )}

      {/* Blocking lead-capture popup — fires once after the 5th generation
          in a session. Both Submit and explicit Dismiss set `popHandled` so
          the user is unblocked and never re-prompted this session. */}
      <LeadCapturePopup
        isOpen={leadPopupOpen}
        defaultProduct="shower"
        userFingerprint={userFingerprint ?? undefined}
        onSubmitted={() => {
          setLeadPopupOpen(false);
          setPopHandled(true);
        }}
        onDismissed={() => {
          setLeadPopupOpen(false);
          setPopHandled(true);
        }}
      />
    </div>
  );
};
