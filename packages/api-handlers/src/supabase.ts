import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Lead, LeadSubmissionResponse, IssueReport, GenerationRecord } from '@repo/types';

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
 * Remove expiry from visualization images for a session so they are retained
 * indefinitely (used when a quote/lead is submitted).
 */
async function retainVisualizationImages(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from('visualizations')
    .update({ expires_at: null })
    .eq('session_id', sessionId);

  if (error) {
    console.error('[retainVisualizationImages] Failed to clear expiry:', error);
  }
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
      const { data, error } = await supabase
        .from('leads')
        .update({
          name,
          email,
          phone: phone || null,
          zip_code: zipCode,
          contact_submitted: true,
          images_retained: true,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to update lead information');
      }

      await retainVisualizationImages(supabase, sessionId);

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
        original_image_url: null,
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
        images_retained: true,
        contact_submitted: true
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to save lead information');
  }

  if (sessionId) {
    await retainVisualizationImages(supabase, sessionId);
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
      mode: record.mode || null,
      enclosure_type: record.enclosureType || null,
      framing_style: record.framingStyle || null,
      hardware_finish: record.hardwareFinish || null,
      handle_style: record.handleStyle || null,
      shower_shape: record.showerShape || null,
      hinged_config: record.hingedConfig || null,
      pivot_config: record.pivotConfig || null,
      sliding_config: record.slidingConfig || null,
      visualization_image_url: record.visualizationImageUrl || null,
      original_image_url: null,
      team: record.team || null,
      user_fingerprint: record.userFingerprint || null,
      user_id: record.userId || null,
    }])
    .select('id')
    .single();

  if (error) {
    console.error('[saveGeneration] Database error:', error);
    throw new Error('Failed to save generation record');
  }

  return { id: data.id };
}

// ---------------------------------------------------------------------------
// Rate limiting helpers
// ---------------------------------------------------------------------------

const MONTHLY_GENERATION_LIMIT = 10;

/**
 * Count how many generations a fingerprint has used in the current calendar month.
 */
export async function getMonthlyUsageCount(
  config: SupabaseConfig,
  fingerprint: string
): Promise<number> {
  const supabase = getSupabaseClient(config);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_fingerprint', fingerprint)
    .gte('created_at', monthStart);

  if (error) {
    console.error('[getMonthlyUsageCount] Database error:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Record a generation event for rate-limiting purposes.
 */
export async function recordUsage(
  config: SupabaseConfig,
  fingerprint: string,
  ipAddress: string | null
): Promise<void> {
  const supabase = getSupabaseClient(config);

  const { error } = await supabase
    .from('rate_limits')
    .insert([{ user_fingerprint: fingerprint, ip_address: ipAddress }]);

  if (error) {
    console.error('[recordUsage] Database error:', error);
  }
}

export { MONTHLY_GENERATION_LIMIT };

// ---------------------------------------------------------------------------
// Team location helpers
// ---------------------------------------------------------------------------

export interface TeamLocation {
  locationId: string;
  locationName: string | null;
}

/**
 * Look up a team member by email. Returns location info if the email belongs
 * to an active franchisee, or null otherwise.
 */
export async function getTeamLocation(
  config: SupabaseConfig,
  email: string
): Promise<TeamLocation | null> {
  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase
    .from('team_locations')
    .select('location_id, location_name')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    locationId: data.location_id,
    locationName: data.location_name,
  };
}

// ---------------------------------------------------------------------------
// Past visualizations retrieval
// ---------------------------------------------------------------------------

export interface PastVisualization {
  id: string;
  visualization_image_url: string | null;
  original_image_url: string | null;
  mode: string | null;
  enclosure_type: string | null;
  framing_style: string | null;
  hardware_finish: string | null;
  handle_style: string | null;
  shower_shape: string | null;
  created_at: string;
}

/**
 * Fetch past visualizations for a given user fingerprint, most recent first.
 */
export async function getVisualizationsByFingerprint(
  config: SupabaseConfig,
  fingerprint: string,
  limit = 20
): Promise<PastVisualization[]> {
  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase
    .from('visualizations')
    .select('id, visualization_image_url, original_image_url, mode, enclosure_type, framing_style, hardware_finish, handle_style, shower_shape, created_at')
    .eq('user_fingerprint', fingerprint)
    .not('visualization_image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getVisualizationsByFingerprint] Database error:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Fetch past visualizations for an authenticated user, most recent first.
 */
export async function getVisualizationsByUserId(
  config: SupabaseConfig,
  userId: string,
  limit = 50
): Promise<PastVisualization[]> {
  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase
    .from('visualizations')
    .select('id, visualization_image_url, original_image_url, mode, enclosure_type, framing_style, hardware_finish, handle_style, shower_shape, created_at')
    .eq('user_id', userId)
    .not('visualization_image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getVisualizationsByUserId] Database error:', error);
    return [];
  }

  return data ?? [];
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
