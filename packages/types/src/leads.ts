import { EnclosureType, GlassStyle, HardwareFinish, ShowerShape } from './visualizer';

// Contact form data
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  zipCode: string;
}

// Lead submission data
export interface Lead extends ContactFormData {
  visualizationImage?: string;
  originalImage?: string;
  doorType?: EnclosureType;
  finish?: GlassStyle;
  hardware?: HardwareFinish;
  showerShape?: ShowerShape;
  source?: string;
  status?: 'new' | 'contacted' | 'quoted' | 'closed';
}

// Lead submission response
export interface LeadSubmissionResponse {
  success: boolean;
  message: string;
  leadId?: string;
}
