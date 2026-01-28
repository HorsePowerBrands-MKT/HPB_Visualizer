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
  hinged_config: {
    to_ceiling: false,
    direction: "swing_left"
  },
  pivot_config: {
    direction: "swing_left"
  },
  sliding_config: {
    sub_type: "single_door",
    direction: "sliding_left"
  },
  track_preference: "frameless",
  optional: config?.defaultOptionalConfig || DEFAULT_OPTIONAL_CONFIG,
  user_notes: "",
  session_id: "",
  catalog_version: config?.catalogVersion || '2025.10',
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
  };
}
