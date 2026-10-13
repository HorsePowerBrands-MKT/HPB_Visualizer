'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Building2, Home, Sun, Waves } from 'lucide-react';
import type {
  RailingApplication,
  RailingSystem,
  RailingHandrail,
  RailingFinish,
  RailingHistoryItem,
  RailingMode,
} from '../lib/railing';
import {
  railingApplications,
  railingSystems,
  railingHandrailOptions,
  railingFinishes,
  RAILING_APPLICATION_ORDER,
  RAILING_SYSTEM_ORDER,
  RAILING_HANDRAIL_ORDER,
  RAILING_FINISH_ORDER,
  buildRailingPrompt,
  formatRailingSummary,
} from '../lib/railing';
import {
  useRailingVisualizerState,
  railingGenerateStep,
  railingResultStep,
} from '../hooks/useRailingVisualizerState';
import { useVisualizerSession } from '../hooks/useVisualizerSession';
import { validateUploadedPhoto } from '../lib/uploadValidation';
import { runGenerationPipeline, GenerationRateLimitedError } from '../lib/generationPipeline';
import { Card, CardContent } from './ui/Card';
import { ContactFormModal } from './ContactFormModal';
import { LeadCapturePopup } from './LeadCapturePopup';
import { VisualizerChrome } from './VisualizerChrome';
import { GeneratingOverlay } from './GeneratingOverlay';
import { pastItemToLeadConfigs, type PastVisualizationItem } from './PastVisualizations';
import { ModeSelectionStep } from './wizard/ModeSelectionStep';
import { PhotoUploadStep } from './wizard/PhotoUploadStep';
import { ProgressIndicator } from './wizard/ProgressIndicator';
import { ResultStep, type ResultDescription, type ResultHistoryItem } from './wizard/ResultStep';
import { RailingOptionStep, type RailingOption } from './wizard/railing/RailingOptionStep';
import { RailingSystemStep, RailingFinishSwatch } from './wizard/railing/RailingSystemStep';

const APPLICATION_ICON_CLASS = 'w-16 h-16 text-brand-gold';

interface GatsbyRailingVisualizerProps {
  /** Return to the product chooser. */
  onChangeProduct?: () => void;
}

/** Pill row used in the result step's Change Options panel. */
const PillRow: React.FC<{
  label: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div className="flex items-start gap-3">
    <span className="text-[11px] text-gray-500 uppercase tracking-wider w-24 flex-shrink-0 pt-1.5">{label}</span>
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`inline-flex items-center gap-1.5 px-2 h-7 text-[11px] font-medium transition-all duration-200 ${
            value === opt.value
              ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40'
              : 'text-gray-500 hover:text-gray-300 border border-transparent'
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

/** Sentinel pill value meaning "take this from the inspiration photo". */
const FROM_PHOTO = '__from_photo__';

/**
 * Railing Module wizard. Collects a design mode, the space photo (plus an
 * inspiration photo on the Match Inspiration path), Application, and —
 * on the Design Your Own path — Railing System, Handrail and Finish. The
 * hidden prompt is assembled from those selections only; no technical
 * installation details are ever asked of the consumer.
 */
export const GatsbyRailingVisualizer: React.FC<GatsbyRailingVisualizerProps> = ({
  onChangeProduct,
}) => {
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
    currentStep,
    maxStepReached,
    uploadConsent,
    marketingConsent,
    sessionId,
    payload,
    promptInput,
    updateFormField,
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
    setUploadConsent,
    setMarketingConsent,
    createHistoryLabel,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    canProceedToNextStep,
    getTotalSteps,
    getStepLabels,
    resetAll,
  } = useRailingVisualizerState();

  // Visitor session shared with the shower module.
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

  // Cleanup preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (inspirationPreviewUrl) URL.revokeObjectURL(inspirationPreviewUrl);
    };
  }, [previewUrl, inspirationPreviewUrl]);

  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
  const [contactModalMode, setContactModalMode] = useState<'save' | 'quote'>('save');
  const [pastVizModalItem, setPastVizModalItem] = useState<PastVisualizationItem | null>(null);

  // Blocking lead-capture popup that fires once after the 5th generation in
  // a session (same rule as the shower flow).
  const [leadPopupOpen, setLeadPopupOpen] = useState<boolean>(false);
  const [popHandled, setPopHandled] = useState<boolean>(false);

  const [generationIndex, setGenerationIndex] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // --- Option lists -------------------------------------------------------

  const applicationOptions = useMemo<RailingOption<RailingApplication>[]>(() => {
    const icons: Record<RailingApplication, React.ReactNode> = {
      interior_staircase: <Building2 className={APPLICATION_ICON_CLASS} strokeWidth={1.25} />,
      interior_balcony: <Home className={APPLICATION_ICON_CLASS} strokeWidth={1.25} />,
      exterior_deck: <Sun className={APPLICATION_ICON_CLASS} strokeWidth={1.25} />,
      pool_balustrade: <Waves className={APPLICATION_ICON_CLASS} strokeWidth={1.25} />,
    };
    return RAILING_APPLICATION_ORDER.map((id) => ({
      value: id,
      label: railingApplications[id].name,
      description: railingApplications[id].description,
      icon: icons[id],
      badge: railingApplications[id].setting === 'interior' ? 'Interior' : 'Exterior',
    }));
  }, []);

  // --- Upload + validation ------------------------------------------------

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'target' | 'inspiration'
  ) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setError(null);

    const outcome = await validateUploadedPhoto(file, {
      product: 'railing',
      onBusy: () => setValidating(type),
    });

    if (!outcome.ok) {
      setError(outcome.message);
      e.target.value = '';
      setValidating(null);
      return;
    }

    const { file: fileForFlow, result } = outcome;

    if (type === 'target') {
      setImageFile(fileForFlow);
      setPreviewUrl(URL.createObjectURL(fileForFlow));
      setResultUrl(null);
      setShowResult(false);
      // Hidden image interpretation that feeds the backend placement rules.
      // Never shown to the consumer; the Application selection still wins.
      updateFormField(
        'existing_condition',
        (result.existingCondition as RailingHistoryItem['payload']['existing_condition']) ?? 'none'
      );
      updateFormField('detected_setting', result.setting ?? null);
      // No auto-advance: user must check the upload consent checkbox before proceeding
    } else {
      setInspirationFile(fileForFlow);
      setInspirationPreviewUrl(URL.createObjectURL(fileForFlow));
    }

    setValidating(null);
  };

  // --- Generate -----------------------------------------------------------

  const onGenerate = useCallback(async () => {
    if (leadPopupOpen) return;
    if (!imageFile) {
      setError('Please upload a photo of your space first.');
      return;
    }
    if (form.mode === 'inspiration' && !inspirationFile) {
      setError('Please upload an inspiration photo.');
      return;
    }
    if (!payload || !promptInput) {
      setError('Please finish your selections first.');
      return;
    }

    setLoading(true);
    setError(null);
    setShowResult(false);

    try {
      const prompt = buildRailingPrompt(promptInput);
      const nextGenIndex = generationIndex + 1;
      const currentPayload = payload;

      await runGenerationPipeline({
        product: 'railing',
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
          product: 'railing',
          mode: currentPayload.mode,
          application: currentPayload.application,
          railingSystem: currentPayload.railing_system,
          handrail: currentPayload.handrail,
          finish: currentPayload.finish,
        },
        saveRecord: {
          mode: currentPayload.mode,
          // Mirrors the finish into the legacy column so existing admin
          // views and emails still show a finish for railing rows.
          hardwareFinish: currentPayload.finish,
          productConfig: {
            mode: currentPayload.mode,
            application: currentPayload.application,
            railing_system: currentPayload.railing_system,
            handrail: currentPayload.handrail,
            finish: currentPayload.finish,
            existing_condition: currentPayload.existing_condition,
            catalog_version: currentPayload.catalog_version,
          },
        },
        onGenerated: (outcome) => {
          const newHistoryItem: RailingHistoryItem = {
            id: uuidv4(),
            timestamp: Date.now(),
            imageUrl: outcome.image,
            label: createHistoryLabel(currentPayload),
            payload: currentPayload,
          };

          if (typeof outcome.usageCount === 'number') setUsageCount(outcome.usageCount);
          if (typeof outcome.limit === 'number' && isCandidateUser) setUsageLimit(outcome.limit);
          setGenerationIndex(nextGenIndex);
          setResultUrl(outcome.image);
          addHistoryItem(newHistoryItem);
          setShowResult(true);

          if (nextGenIndex === 5 && !popHandled && !isCandidateUser) {
            setLeadPopupOpen(true);
          }
        },
      });

      refreshPastVisualizations();
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
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, [
    leadPopupOpen,
    imageFile,
    inspirationFile,
    form.mode,
    payload,
    promptInput,
    generationIndex,
    sessionId,
    userFingerprint,
    marketingConsent,
    submissionId,
    teamUtm,
    isCandidateUser,
    popHandled,
    usageLimit,
    setLoading,
    setError,
    setShowResult,
    setResultUrl,
    addHistoryItem,
    createHistoryLabel,
    setUsageCount,
    setUsageLimit,
    refreshPastVisualizations,
    goToNextStep,
  ]);

  // --- Result step helpers ------------------------------------------------

  const resultDescription = useMemo<ResultDescription | undefined>(() => {
    if (!form.application) return undefined;
    const app = railingApplications[form.application];
    const sys = form.railing_system ? railingSystems[form.railing_system] : null;
    const rail = form.handrail ? railingHandrailOptions[form.handrail] : null;
    const fin = form.finish ? railingFinishes[form.finish] : null;

    const features: string[] = [`${app.name} application`];
    if (sys) features.push(`${sys.name} mounting system`);
    if (rail) features.push(rail.name === 'Handrail' ? 'Continuous handrail' : 'Clean open glass edge');
    if (fin) features.push(`${fin.name} hardware`);
    if (form.mode === 'inspiration') features.push('Style matched from your inspiration photo');

    const summary =
      form.mode === 'inspiration'
        ? `A frameless glass railing for your ${app.name.toLowerCase()}, styled after your inspiration photo and fitted to your space.`
        : `A frameless glass railing for your ${app.name.toLowerCase()}${
            sys ? ` on a ${sys.name.toLowerCase()} system` : ''
          }${fin ? ` with ${fin.name.toLowerCase()} hardware` : ''}. Open sightlines, clean lines, and a design tailored to your space.`;

    return {
      title: form.mode === 'inspiration' ? 'Inspiration-Based Railing' : 'Your Custom Configuration',
      features,
      summary,
    };
  }, [form.application, form.railing_system, form.handrail, form.finish, form.mode]);

  const isInspiration = form.mode === 'inspiration';
  const fromPhotoOption = { value: FROM_PHOTO, label: 'Match photo' };

  const changeOptionsPanel = (
    <div className="space-y-3">
      <PillRow
        label="Application"
        options={RAILING_APPLICATION_ORDER.map((id) => ({ value: id, label: railingApplications[id].name }))}
        value={form.application ?? ''}
        onChange={(v) => updateFormField('application', v as RailingApplication)}
      />
      <PillRow
        label="System"
        options={[
          ...(isInspiration ? [fromPhotoOption] : []),
          ...RAILING_SYSTEM_ORDER.map((id) => ({ value: id, label: railingSystems[id].name })),
        ]}
        value={form.railing_system ?? (isInspiration ? FROM_PHOTO : '')}
        onChange={(v) => updateFormField('railing_system', v === FROM_PHOTO ? null : (v as RailingSystem))}
      />
      <PillRow
        label="Handrail"
        options={[
          ...(isInspiration ? [fromPhotoOption] : []),
          ...RAILING_HANDRAIL_ORDER.map((id) => ({ value: id, label: railingHandrailOptions[id].name })),
        ]}
        value={form.handrail ?? (isInspiration ? FROM_PHOTO : '')}
        onChange={(v) => updateFormField('handrail', v === FROM_PHOTO ? null : (v as RailingHandrail))}
      />
      <PillRow
        label="Finish"
        options={[
          ...(isInspiration ? [fromPhotoOption] : []),
          ...RAILING_FINISH_ORDER.map((id) => ({
            value: id,
            label: railingFinishes[id].name,
            icon: <RailingFinishSwatch finish={id} className="w-3.5 h-3.5" />,
          })),
        ]}
        value={form.finish ?? (isInspiration ? FROM_PHOTO : '')}
        onChange={(v) => updateFormField('finish', v === FROM_PHOTO ? null : (v as RailingFinish))}
      />
    </div>
  );

  const renderResultStep = () => (
    <ResultStep
      loading={loading}
      resultUrl={resultUrl}
      previewUrl={previewUrl}
      showResult={showResult}
      error={error}
      history={history}
      title="Your Custom Railing Design"
      subtitle="See how your glass railing will look"
      description={resultDescription}
      changeOptionsPanel={changeOptionsPanel}
      sessionId={sessionId}
      team={teamUtm}
      onToggleView={() => setShowResult(!showResult)}
      onSelectHistory={(item: ResultHistoryItem) => {
        const match = history.find((h) => h.id === item.id);
        if (match) selectHistoryItem(match, false);
      }}
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
      onRegenerate={onGenerate}
      isTeamMember={isUnlimitedTeamMember}
      usageCount={usageCount}
      usageLimit={usageLimit}
      hideContactActions={isCandidateUser}
    />
  );

  // --- Steps --------------------------------------------------------------

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ModeSelectionStep
            mode={form.mode}
            onModeSelect={(mode: RailingMode) => updateFormField('mode', mode)}
            onNext={goToNextStep}
            subtitle="How would you like to design your glass railing?"
            configureDescription="Pick your application, railing system, handrail, and finish"
            inspirationDescription="Upload a photo of a glass railing you love and we'll match the style to your space"
          />
        );

      case 2:
        if (form.mode === 'configure') {
          return (
            <PhotoUploadStep
              type="space"
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
        }
        return (
          <PhotoUploadStep
            type="both"
            title="Upload Your Photos"
            description="Upload your space and the glass railing style you want to match"
            primaryLabel="Your Space"
            primaryHint="Take a clear photo of the stairs, balcony, deck, or pool area"
            inspirationLabel="Inspiration Photo"
            inspirationHint="Upload a photo of the glass railing style you love"
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

      case 3:
        return (
          <RailingOptionStep
            title="Where Will Your Railing Go?"
            subtitle="Choose the setting that best matches your project"
            options={applicationOptions}
            value={form.application}
            onSelect={(v) => updateFormField('application', v)}
            columnsClassName="md:grid-cols-2 lg:grid-cols-4"
          />
        );

      case 4:
        if (form.mode === 'configure') {
          return (
            <RailingSystemStep
              railingSystem={form.railing_system}
              handrail={form.handrail}
              finish={form.finish}
              onRailingSystemChange={(v) => updateFormField('railing_system', v)}
              onHandrailChange={(v) => updateFormField('handrail', v)}
              onFinishChange={(v) => updateFormField('finish', v)}
            />
          );
        }
        return renderResultStep();

      case 5:
        return form.mode === 'configure' ? renderResultStep() : null;

      default:
        return null;
    }
  };

  const canGenerate = isUnlimitedTeamMember || !isRateLimited;
  const showGenerateButton =
    currentStep === railingGenerateStep(form.mode) && canGenerate && !leadPopupOpen;
  const isResultStep = currentStep === railingResultStep(form.mode);

  const leadConfigs = {
    product: 'railing' as const,
    productSummary: formatRailingSummary(form),
    mode: form.mode,
    session_id: sessionId,
  };

  return (
    <div className="mx-auto">
      <GeneratingOverlay visible={loading} />

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

      <Card className="shadow-none bg-brand-brown border-0">
        <CardContent className="p-0">{renderCurrentStep()}</CardContent>
      </Card>

      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={getTotalSteps()}
        maxStepReached={maxStepReached}
        onStepClick={goToStep}
        mode={form.mode}
        stepLabels={getStepLabels()}
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
                  resultUrl: resultUrl || '',
                  uploadedImage: previewUrl || '',
                  configs: leadConfigs,
                }
          }
          mode={contactModalMode}
          userFingerprint={userFingerprint ?? undefined}
        />
      )}

      <LeadCapturePopup
        isOpen={leadPopupOpen}
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
