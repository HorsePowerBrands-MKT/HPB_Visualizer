/**
 * Generic API types for multi-brand support.
 *
 * These types avoid brand-specific fields (e.g. ShowerShape). Each brand
 * can extend these with its own detection/validation fields.
 */

export interface GenericImageValidationResponse {
  valid: boolean;
  reason?: string;
  detectedShape?: string;
  detectedHardware?: string;
  contentFlag?: 'safe' | 'pii' | 'inappropriate';
  brandSpecific?: Record<string, unknown>;
}
