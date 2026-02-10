// Gemini AI handlers
export {
  generateVisualization,
  validateImage,
  type GeminiConfig
} from './gemini';

// Supabase handlers
export {
  submitLead,
  getLeadsByZipCode,
  updateLeadStatus,
  saveVisualization,
  reportIssue,
  type SupabaseConfig
} from './supabase';

// Supabase Storage handlers
export {
  uploadImage,
  deleteImage,
  listImages
} from './storage';

// Validation utilities
export {
  validateEmail,
  validateZipCode,
  validatePhone,
  validateImageType,
  validateImageSize,
  fileToImageData,
  validateLeadData,
  type ValidationResult
} from './validation';
