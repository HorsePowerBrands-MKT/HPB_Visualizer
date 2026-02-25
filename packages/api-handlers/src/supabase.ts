import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Lead, LeadSubmissionResponse, VisualizationData, IssueReport, GenerationRecord } from '@repo/types';

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
 * If sessionId is provided, updates existing record; otherwise creates new one
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
    trackPreference,
    handleStyle,
    mode,
    sessionId,
    source = 'Visualizer'
  } = leadData;

  // Validate required fields
  if (!name || !email || !zipCode) {
    throw new Error('Missing required fields: name, email, zipCode');
  }

  const supabase = getSupabaseClient(config);

  // If sessionId provided, try to update existing record
  if (sessionId) {
    const { data: existing, error: findError } = await supabase
      .from('leads')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (!findError && existing) {
      // Update existing record with contact info
      const { data, error } = await supabase
        .from('leads')
        .update({
          name,
          email,
          phone: phone || null,
          zip_code: zipCode,
          contact_submitted: true,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to update lead information');
      }

      return {
        success: true,
        message: 'Your information has been submitted successfully',
        leadId: data.id
      };
    }
  }

  // Create new record (fallback or no sessionId)
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
        track_preference: trackPreference || null,
        handle_style: handleStyle || null,
        mode: mode || null,
        session_id: sessionId || null,
        status: 'new',
        source,
        contact_submitted: true
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

/**
 * Save visualization data automatically (without contact info)
 */
export async function saveVisualization(
  config: SupabaseConfig,
  visualizationData: VisualizationData
): Promise<LeadSubmissionResponse> {
  const {
    sessionId,
    mode,
    enclosureType,
    glassStyle,
    hardwareFinish,
    handleStyle,
    trackPreference,
    showerShape,
    visualizationImage,
    originalImage,
    source = 'Gatsby Glass Visualizer',
    team
  } = visualizationData;

  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  const supabase = getSupabaseClient(config);

  // Check if record already exists for this session
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('session_id', sessionId)
    .single();

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('leads')
      .update({
        mode: mode || null,
        door_type: enclosureType || null,
        finish: glassStyle || null,
        hardware: hardwareFinish || null,
        handle_style: handleStyle || null,
        track_preference: trackPreference || null,
        shower_shape: showerShape || null,
        visualization_image_url: visualizationImage || null,
        original_image_url: originalImage || null,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to update visualization data');
    }

    return {
      success: true,
      message: 'Visualization data updated',
      leadId: data.id
    };
  }

  // Create new record
  const { data, error } = await supabase
    .from('leads')
    .insert([
      {
        session_id: sessionId,
        mode: mode || null,
        door_type: enclosureType || null,
        finish: glassStyle || null,
        hardware: hardwareFinish || null,
        handle_style: handleStyle || null,
        track_preference: trackPreference || null,
        shower_shape: showerShape || null,
        visualization_image_url: visualizationImage || null,
        original_image_url: originalImage || null,
        source,
        team: team || null,
        status: 'new',
        contact_submitted: false
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to save visualization data');
  }

  return {
    success: true,
    message: 'Visualization data saved',
    leadId: data.id
  };
}

/**
 * Report an issue with a visualization
 */
export async function reportIssue(
  config: SupabaseConfig,
  issueData: IssueReport
): Promise<LeadSubmissionResponse> {
  const { sessionId, issueMessage } = issueData;

  if (!sessionId || !issueMessage) {
    throw new Error('Session ID and issue message are required');
  }

  const supabase = getSupabaseClient(config);

  // Find record by session_id
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('session_id', sessionId)
    .single();

  if (!existing) {
    throw new Error('Visualization record not found');
  }

  // Update with issue information
  const { data, error } = await supabase
    .from('leads')
    .update({
      issue_reported: true,
      issue_message: issueMessage,
      updated_at: new Date().toISOString()
    })
    .eq('session_id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to report issue');
  }

  return {
    success: true,
    message: 'Issue reported successfully',
    leadId: data.id
  };
}

/**
 * Save a single image generation event to the visualizations table
 * Called every time an image is generated (including re-generates)
 */
export async function saveGeneration(
  config: SupabaseConfig,
  record: GenerationRecord
): Promise<{ id: string }> {
  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase
    .from('visualizations')
    .insert([{
      session_id: record.sessionId,
      generation_index: record.generationIndex,
      enclosure_type: record.enclosureType || null,
      hardware_finish: record.hardwareFinish || null,
      handle_style: record.handleStyle || null,
      track_preference: record.trackPreference || null,
      shower_shape: record.showerShape || null,
      mode: record.mode || null,
      visualization_image_url: record.visualizationImageUrl || null,
      original_image_url: record.originalImageUrl || null,
      team: record.team || null,
    }])
    .select('id')
    .single();

  if (error) {
    console.error('[saveGeneration] Database error:', error);
    throw new Error('Failed to save generation record');
  }

  return { id: data.id };
}

/**
 * Create an issue report in the issue_reports table (many per session)
 */
export async function createIssueReport(
  config: SupabaseConfig,
  issueData: IssueReport
): Promise<LeadSubmissionResponse> {
  const { sessionId, issueMessage, visualizationImageUrl, team } = issueData;

  if (!sessionId || !issueMessage) {
    throw new Error('Session ID and issue message are required');
  }

  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase
    .from('issue_reports')
    .insert([{
      session_id: sessionId,
      message: issueMessage,
      visualization_image_url: visualizationImageUrl || null,
      team: team || null,
    }])
    .select('id')
    .single();

  if (error) {
    console.error('[createIssueReport] Database error:', error);
    throw new Error('Failed to save issue report');
  }

  // Also flag the lead record so it's easy to filter in the leads view
  await supabase
    .from('leads')
    .update({ issue_reported: true, updated_at: new Date().toISOString() })
    .eq('session_id', sessionId);

  return {
    success: true,
    message: 'Issue reported successfully',
    leadId: data.id
  };
}
