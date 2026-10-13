'use client';

/**
 * Gatsby Glass Railing Module state hook
 *
 * Mirrors the navigation contract of the shower `useVisualizerState` so the
 * shared ProgressIndicator, PhotoUploadStep and ResultStep drive both flows.
 *
 * The Application (stairs / balcony / deck / pool) is detected from the
 * uploaded photo during validation, so there is no step for it; the
 * consumer can correct it on the upload step or the result page.
 *
 * Design Your Own (configure):  1 mode → 2 upload → 3 system / handrail / finish (generate) → 4 result
 * Match Inspiration:            1 mode → 2 upload both (generate) → 3 result
 */

import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  RailingForm,
  RailingMode,
  RailingPayload,
  RailingPromptInput,
  RailingHistoryItem,
} from '../lib/railing';
import {
  buildRailingPayload,
  buildRailingPromptInput,
  formatRailingSummary,
} from '../lib/railing';

export const RAILING_STEP_LABELS: Record<RailingMode, readonly string[]> = {
  configure: [
    'Choose Design Method',
    'Upload Your Space Photo',
    'Railing System, Handrail & Finish',
    'View Your Design',
  ],
  inspiration: [
    'Choose Design Method',
    'Upload Your Photos',
    'View Your Design',
  ],
};

export const railingTotalSteps = (mode: RailingMode): number => RAILING_STEP_LABELS[mode].length;
/** The step whose primary action is "Generate Preview". */
export const railingGenerateStep = (mode: RailingMode): number => (mode === 'configure' ? 3 : 2);
export const railingResultStep = (mode: RailingMode): number => railingTotalSteps(mode);

const createInitialForm = (): RailingForm => ({
  mode: 'configure',
  application: null,
  railing_system: null,
  handrail: null,
  finish: null,
  existing_condition: null,
  detected_setting: null,
  application_detected: false,
});

export interface RailingVisualizerState {
  form: RailingForm;
  imageFile: File | null;
  inspirationFile: File | null;
  previewUrl: string | null;
  inspirationPreviewUrl: string | null;
  resultUrl: string | null;
  history: RailingHistoryItem[];
  loading: boolean;
  validating: 'target' | 'inspiration' | null;
  error: string | null;
  showResult: boolean;
  currentStep: number;
  maxStepReached: number;
  uploadConsent: boolean;
  marketingConsent: boolean;
  sessionId: string;
  /** Completed payload, or null until every selection the mode needs is made. */
  payload: RailingPayload | null;
  /** Backend prompt input resolved from the payload, or null until complete. */
  promptInput: RailingPromptInput | null;
}

export interface RailingVisualizerActions {
  setForm: (form: RailingForm) => void;
  updateFormField: <K extends keyof RailingForm>(field: K, value: RailingForm[K]) => void;
  setImageFile: (file: File | null) => void;
  setInspirationFile: (file: File | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setInspirationPreviewUrl: (url: string | null) => void;
  setResultUrl: (url: string | null) => void;
  addHistoryItem: (item: RailingHistoryItem) => void;
  selectHistoryItem: (item: RailingHistoryItem, restoreConfig?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setValidating: (type: 'target' | 'inspiration' | null) => void;
  setError: (error: string | null) => void;
  setShowResult: (show: boolean) => void;
  setUploadConsent: (value: boolean) => void;
  setMarketingConsent: (value: boolean) => void;
  createHistoryLabel: (payload: RailingPayload) => string;
  goToNextStep: (force?: boolean) => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  canProceedToNextStep: () => boolean;
  getTotalSteps: () => number;
  getStepLabels: () => string[];
  resetAll: () => void;
}

export function useRailingVisualizerState(): RailingVisualizerState & RailingVisualizerActions {
  const [form, setForm] = useState<RailingForm>(createInitialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inspirationPreviewUrl, setInspirationPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<RailingHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [validating, setValidating] = useState<'target' | 'inspiration' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);
  const [uploadConsent, setUploadConsent] = useState<boolean>(false);
  const [marketingConsent, setMarketingConsent] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>(() => uuidv4());

  const updateFormField = useCallback(
    <K extends keyof RailingForm>(field: K, value: RailingForm[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addHistoryItem = useCallback((item: RailingHistoryItem) => {
    setHistory((prev) => [item, ...prev]);
  }, []);

  const selectHistoryItem = useCallback((item: RailingHistoryItem, restoreConfig = false) => {
    setResultUrl(item.imageUrl);
    setShowResult(true);
    if (restoreConfig) {
      setForm((prev) => ({
        ...prev,
        mode: item.payload.mode,
        application: item.payload.application,
        railing_system: item.payload.railing_system,
        handrail: item.payload.handrail,
        finish: item.payload.finish,
      }));
    }
  }, []);

  const createHistoryLabel = useCallback((payload: RailingPayload): string => {
    return formatRailingSummary(payload);
  }, []);

  const getTotalSteps = useCallback((): number => railingTotalSteps(form.mode), [form.mode]);
  const getStepLabels = useCallback((): string[] => [...RAILING_STEP_LABELS[form.mode]], [form.mode]);

  const canProceedToNextStep = useCallback((): boolean => {
    switch (currentStep) {
      case 1:
        return true;
      case 2: {
        // Photo validated + consent + application resolved (auto-detected on
        // upload). In inspiration mode this is also the generate step.
        const hasSpacePhoto =
          imageFile !== null && previewUrl !== null && uploadConsent && form.application !== null;
        if (form.mode === 'configure') return hasSpacePhoto;
        return hasSpacePhoto && inspirationFile !== null && inspirationPreviewUrl !== null;
      }
      case 3:
        if (form.mode === 'configure') {
          return form.railing_system !== null && form.handrail !== null && form.finish !== null;
        }
        return false;
      default:
        return false;
    }
  }, [currentStep, form, imageFile, previewUrl, inspirationFile, inspirationPreviewUrl, uploadConsent]);

  const goToNextStep = useCallback(
    (force: boolean = false) => {
      if (force || canProceedToNextStep()) {
        const nextStep = currentStep + 1;
        if (nextStep <= getTotalSteps()) {
          setCurrentStep(nextStep);
          setMaxStepReached((prev) => Math.max(prev, nextStep));
          setError(null);
        }
      }
    },
    [currentStep, canProceedToNextStep, getTotalSteps]
  );

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= maxStepReached) {
        setCurrentStep(step);
        setError(null);
      }
    },
    [maxStepReached]
  );

  const resetAll = useCallback(() => {
    setForm(createInitialForm());
    setImageFile(null);
    setInspirationFile(null);
    setPreviewUrl(null);
    setInspirationPreviewUrl(null);
    setResultUrl(null);
    setHistory([]);
    setLoading(false);
    setValidating(null);
    setError(null);
    setShowResult(false);
    setCurrentStep(1);
    setMaxStepReached(1);
    setUploadConsent(false);
    setMarketingConsent(false);
    setSessionId(uuidv4());
  }, []);

  const payload = useMemo(() => buildRailingPayload(form, sessionId), [form, sessionId]);
  const promptInput = useMemo(
    () => (payload ? buildRailingPromptInput(payload) : null),
    [payload]
  );

  return {
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
    setForm,
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
  };
}
