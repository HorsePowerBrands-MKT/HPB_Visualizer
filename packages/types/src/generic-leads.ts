/**
 * Generic lead types for multi-brand support.
 *
 * These types use a flexible `productConfig` blob instead of brand-specific
 * fields (e.g. EnclosureType, GlassStyle). Each brand populates productConfig
 * with its own product-specific data.
 *
 * Brand-specific Lead types (like the Gatsby Glass Lead) extend or compose
 * these generics and are defined in their respective app directories.
 */

export interface GenericContactFormData {
  name: string;
  email: string;
  phone?: string;
  zipCode: string;
}

export interface GenericLead extends GenericContactFormData {
  visualizationImage?: string;
  originalImage?: string;
  productConfig?: Record<string, unknown>;
  source?: string;
  brand?: string;
  status?: 'new' | 'contacted' | 'quoted' | 'closed';
  mode?: string;
  sessionId?: string;
  issueReported?: boolean;
  issueMessage?: string;
  contactSubmitted?: boolean;
  tcpaConsent?: boolean;
  tcpaConsentText?: string;
  consentIp?: string;
  consentUserAgent?: string;
  userFingerprint?: string;
  userId?: string;
}

export interface GenericGenerationRecord {
  sessionId: string;
  generationIndex: number;
  mode?: string;
  productConfig?: Record<string, unknown>;
  visualizationImageUrl?: string;
  originalImageUrl?: string;
  brand?: string;
  team?: string;
  userFingerprint?: string;
  userId?: string;
}

export interface GenericVisualizationData {
  sessionId: string;
  mode?: string;
  productConfig?: Record<string, unknown>;
  visualizationImage?: string;
  originalImage?: string;
  source?: string;
  brand?: string;
  team?: string;
}
