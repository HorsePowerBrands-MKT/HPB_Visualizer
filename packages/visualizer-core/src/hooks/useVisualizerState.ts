import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Payload, 
  EnclosureType, 
  HistoryItem,
  HingedConfig,
  PivotConfig,
  SlidingConfig,
  OptionalConfig
} from '@repo/types';

// Default optional configuration
const DEFAULT_OPTIONAL_CONFIG: OptionalConfig = {
  glass_height: 'standard',
  custom_height_in: 0,
  towel_bar: {
    enabled: false,
    style: null
  }
};

export interface VisualizerConfig {
  catalogVersion?: string;
  defaultOptionalConfig?: OptionalConfig;
}

const createInitialFormState = (config?: VisualizerConfig): Payload => ({
  mode: "configure",
  image_ref: "",
  enclosure_type: "hinged",
  shower_shape: "standard",
  glass_style: "clear",
  hardware_finish: "matte_black",
  handle_style: "ladder",
  door_opening: {
    type: "hinged",
    side: "right",
    swing: null,
  },
  hinged_config: { to_ceiling: false, direction: 'right' },
  pivot_config: { direction: 'right' },
  sliding_config: { configuration: 'single', direction: 'left' },
  track_preference: "frameless",
  optional: config?.defaultOptionalConfig || DEFAULT_OPTIONAL_CONFIG,
  user_notes: "",
  session_id: "",
  catalog_version: config?.catalogVersion || '2025.10',
  detected_hardware: 'none',
});

export interface VisualizerState {
  form: Payload;
  imageFile: File | null;
  inspirationFile: File | null;
  previewUrl: string | null;
  inspirationPreviewUrl: string | null;
  resultUrl: string | null;
  history: HistoryItem[];
  loading: boolean;
  validating: 'target' | 'inspiration' | null;
  error: string | null;
  showResult: boolean;
  infoMessage: string | null;
  currentStep: number;
  maxStepReached: number;
}

export interface VisualizerActions {
  setForm: (form: Payload) => void;
  updateFormField: <K extends keyof Payload>(field: K, value: Payload[K]) => void;
  updateConfig: (
    configName: 'hinged_config' | 'pivot_config' | 'sliding_config',
    field: string,
    value: any
  ) => void;
  setImageFile: (file: File | null) => void;
  setInspirationFile: (file: File | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setInspirationPreviewUrl: (url: string | null) => void;
  setResultUrl: (url: string | null) => void;
  addHistoryItem: (item: HistoryItem) => void;
  selectHistoryItem: (item: HistoryItem, restoreConfig?: boolean) => void;
  setLoading: (loading: boolean) => void;
  setValidating: (type: 'target' | 'inspiration' | null) => void;
  setError: (error: string | null) => void;
  setShowResult: (show: boolean) => void;
  setInfoMessage: (message: string | null) => void;
  handleEnclosureChange: (value: EnclosureType) => void;
  resetAll: () => void;
  createHistoryLabel: (payload: Payload) => string;
  goToNextStep: (force?: boolean) => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  canProceedToNextStep: () => boolean;
  getTotalSteps: () => number;
}

export function useVisualizerState(config?: VisualizerConfig): VisualizerState & VisualizerActions {
  const INITIAL_FORM_STATE = createInitialFormState(config);
  const [form, setForm] = useState<Payload>(INITIAL_FORM_STATE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inspirationPreviewUrl, setInspirationPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [validating, setValidating] = useState<'target' | 'inspiration' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);

  const updateFormField = useCallback(<K extends keyof Payload>(field: K, value: Payload[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateConfig = useCallback((
    configName: 'hinged_config' | 'pivot_config' | 'sliding_config',
    field: string,
    value: any
  ) => {
    setForm(prev => ({
      ...prev,
      [configName]: {
        ...prev[configName]!,
        [field]: value
      }
    }));
  }, []);

  const handleEnclosureChange = useCallback((value: EnclosureType) => {
    // Logic: If shower is Neo-Angle, user cannot select Pivot or Sliding.
    setForm(prev => {
      if (prev.shower_shape === 'neo_angle') {
        if (value === 'sliding' || value === 'pivot') {
          setInfoMessage("Neo-Angle (Corner) showers are compatible only with Hinged doors. We have kept your selection as Hinged based on the shape of your shower.");
          setTimeout(() => setInfoMessage(null), 6000);
          return { ...prev, enclosure_type: 'hinged' };
        }
      }
      return { ...prev, enclosure_type: value };
    });
  }, []);

  const addHistoryItem = useCallback((item: HistoryItem) => {
    setHistory(prev => [item, ...prev]);
  }, []);

  const selectHistoryItem = useCallback((item: HistoryItem, restoreConfig: boolean = false) => {
    setResultUrl(item.imageUrl);
    setShowResult(true);
    if (restoreConfig) {
      setForm(item.payload);
    }
  }, []);

  const createHistoryLabel = useCallback((payload: Payload): string => {
    if (payload.mode === 'inspiration') return "Inspiration Match";
    const finishName = payload.hardware_finish;
    const typeName = payload.enclosure_type;
    return `${typeName} • ${finishName}`;
  }, []);

  const getTotalSteps = useCallback((): number => {
    // Step 1: Mode selection
    // Step 2: Upload bathroom
    // Step 3: Enclosure type (configure) OR Upload inspiration (inspiration)
    // Step 4: Framing, Hardware & Handles (configure only)
    // Step 5: Generate/Result (configure) OR Step 4: Result (inspiration)
    return form.mode === 'configure' ? 5 : 4;
  }, [form.mode]);

  const canProceedToNextStep = useCallback((): boolean => {
    switch (currentStep) {
      case 1: // Mode selection
        return form.mode !== undefined;
      case 2: // Upload bathroom photo
        return imageFile !== null && previewUrl !== null;
      case 3: // Enclosure type OR inspiration upload
        if (form.mode === 'configure') {
          return form.enclosure_type !== undefined;
        } else {
          return inspirationFile !== null && inspirationPreviewUrl !== null;
        }
      case 4: // Framing, Hardware & Handles (configure only)
        return form.track_preference !== undefined && form.hardware_finish !== undefined && form.handle_style !== undefined;
      default:
        return false;
    }
  }, [currentStep, form, imageFile, previewUrl, inspirationFile, inspirationPreviewUrl]);

  const goToNextStep = useCallback((force: boolean = false) => {
    if (force || canProceedToNextStep()) {
      const nextStep = currentStep + 1;
      const totalSteps = getTotalSteps();
      if (nextStep <= totalSteps) {
        setCurrentStep(nextStep);
        setMaxStepReached(Math.max(maxStepReached, nextStep));
        setError(null);
      }
    }
  }, [currentStep, canProceedToNextStep, getTotalSteps, maxStepReached]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= maxStepReached) {
      setCurrentStep(step);
      setError(null);
    }
  }, [maxStepReached]);

  const resetAll = useCallback(() => {
    setForm(INITIAL_FORM_STATE);
    setImageFile(null);
    setInspirationFile(null);
    setPreviewUrl(null);
    setInspirationPreviewUrl(null);
    setResultUrl(null);
    setHistory([]);
    setLoading(false);
    setError(null);
    setShowResult(false);
    setInfoMessage(null);
    setCurrentStep(1);
    setMaxStepReached(1);
  }, []);

  return {
    // State
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
    // Actions
    setForm,
    updateFormField,
    updateConfig,
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
    resetAll,
    createHistoryLabel,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    canProceedToNextStep,
    getTotalSteps,
  };
}
