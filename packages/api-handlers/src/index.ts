// Gemini AI handlers
export {
  generateVisualization,
  validateImage,
  GeminiRateLimitError,
  type GeminiConfig,
} from './gemini';

// Supabase handlers
export {
  submitLead,
  getLeads,
  getLeadsByZipCode,
  lookupLocationByZipcode,
  findNearestLocation,
  updateLeadStatus,
  getTeamLocation,
  getTeamLocationWithPermissions,
  getMonthlyUsageCountByUserId,
  backfillAuthUserId,
  getCandidateMetrics,
  getUsageReport,
  hasAccess,
  logApiCall,
  getApiCallReport,
  MONTHLY_GENERATION_LIMIT,
  DEFAULT_CANDIDATE_RENDERING_CAP,
  CORPORATE_LOCATION_ID,
  CANDIDATE_LOCATION_ID,
  type SupabaseConfig,
  type AccessLevel,
  type UserType,
  type TeamLocation,
  type TeamLocationWithPermissions,
  type TeamUser,
  type UsageReportRow,
  type ApiCallReportRow,
  type AdminLeadRow,
  type CandidateMetricsRow,
  type CandidateVisualization,
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

// Resend transactional email handlers
export {
  sendSasEmail,
  sendRaqEmail,
  sendCustomerQuoteEmail,
  renderRaqEmailHtml,
  renderRaqEmailText,
  renderSasEmailHtml,
  renderSasEmailText,
  renderCustomerQuoteEmailHtml,
  renderCustomerQuoteEmailText,
  type ResendConfig,
  type SasEmailData,
  type SasGalleryItem,
  type RaqEmailData,
  type CustomerQuoteEmailData,
} from './resend';

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
