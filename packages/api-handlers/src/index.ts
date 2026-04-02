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
  lookupLocationByZipcode,
  updateLeadStatus,
  getTeamLocationWithPermissions,
  getUsageReport,
  hasAccess,
  logApiCall,
  getApiCallReport,
  type SupabaseConfig,
  type AccessLevel,
  type TeamLocationWithPermissions,
  type UsageReportRow,
  type ApiCallReportRow,
} from './supabase';

// Supabase Storage handlers
export {
  uploadImage,
  deleteImage,
  listImages
} from './storage';

// SharpSpring CRM handlers
export {
  pushLeadToSharpSpring,
  type SharpSpringConfig,
  type SharpSpringLeadData,
} from './sharpspring';

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
