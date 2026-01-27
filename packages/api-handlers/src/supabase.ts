import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Lead, LeadSubmissionResponse } from '@repo/types';

export interface SupabaseConfig {
  url: string;
  serviceKey: string;
}

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize or get Supabase client
 */
function getSupabaseClient(config: SupabaseConfig): SupabaseClient {
  if (!config.url || !config.serviceKey) {
    throw new Error('Supabase URL and service key are required');
  }

  // Reuse client if already initialized with same config
  if (!supabaseClient) {
    supabaseClient = createClient(config.url, config.serviceKey);
  }

  return supabaseClient;
}

/**
 * Submit a lead to the database
 */
export async function submitLead(
  config: SupabaseConfig,
  leadData: Lead
): Promise<LeadSubmissionResponse> {
  const {
    name,
    email,
    phone,
    zipCode,
    visualizationImage,
    originalImage,
    doorType,
    finish,
    hardware,
    showerShape,
    source = 'Visualizer'
  } = leadData;

  // Validate required fields
  if (!name || !email || !zipCode) {
    throw new Error('Missing required fields: name, email, zipCode');
  }

  const supabase = getSupabaseClient(config);

  // Insert lead into database
  const { data, error } = await supabase
    .from('leads')
    .insert([
      {
        name,
        email,
        phone: phone || null,
        zip_code: zipCode,
        visualization_image_url: visualizationImage || null,
        original_image_url: originalImage || null,
        door_type: doorType || null,
        finish: finish || null,
        hardware: hardware || null,
        shower_shape: showerShape || null,
        status: 'new',
        source
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to save lead information');
  }

  return {
    success: true,
    message: 'Your information has been submitted successfully',
    leadId: data.id
  };
}

/**
 * Get leads by zip code (for franchisee lookup)
 */
export async function getLeadsByZipCode(
  config: SupabaseConfig,
  zipCode: string
): Promise<Lead[]> {
  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('zip_code', zipCode)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to retrieve leads');
  }

  return data || [];
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  config: SupabaseConfig,
  leadId: string,
  status: Lead['status']
): Promise<void> {
  const supabase = getSupabaseClient(config);

  const { error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to update lead status');
  }
}
