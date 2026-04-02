import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Lead, LeadSubmissionResponse, IssueReport, GenerationRecord, VisualizerSubmission, VisualizerSubmissionInput } from '@repo/types';

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
 * Collect all visualization URLs for a user across all sessions.
 * Prefers user_id (authenticated), falls back to user_fingerprint, then session_id.
 */
async function collectAllVisualizationUrls(
  supabase: ReturnType<typeof getSupabaseClient>,
  identifiers: { sessionId?: string; userId?: string; userFingerprint?: string }
): Promise<{ watermarked: string | null; original: string | null; created_at: string }[]> {
  const { sessionId, userId, userFingerprint } = identifiers;

  let query = supabase
    .from('visualizations')
    .select('visualization_image_url, original_image_url, created_at')
    .not('visualization_image_url', 'is', null)
    .order('created_at', { ascending: true });

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (userFingerprint) {
    query = query.eq('user_fingerprint', userFingerprint);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  } else {
    return [];
  }

  const { data: vizRows } = await query;

  return vizRows
    ? vizRows.map(r => ({
        watermarked: r.visualization_image_url,
        original: r.original_image_url,
        created_at: r.created_at,
      }))
    : [];
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
    source = 'Visualizer',
    tcpaConsent,
    tcpaConsentText,
    consentIp,
    consentUserAgent,
    userFingerprint,
    userId,
  } = leadData;

  // Validate required fields
  if (!name || !email || !zipCode) {
    throw new Error('Missing required fields: name, email, zipCode');
  }

  const supabase = getSupabaseClient(config);

  // Resolve franchise location from the lead's zip code
  const resolvedLocation = await lookupLocationByZipcode(config, zipCode);

  // If sessionId provided, try to update existing record
  if (sessionId) {
    const { data: existing, error: findError } = await supabase
      .from('leads')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (!findError && existing) {
      const vizUrls = await collectAllVisualizationUrls(supabase, { sessionId, userId, userFingerprint });

      const { data, error } = await supabase
        .from('leads')
        .update({
          name,
          email,
          phone: phone || null,
          zip_code: zipCode,
          location_id: resolvedLocation.locationId,
          location_name: resolvedLocation.locationName,
          contact_submitted: true,
          images_retained: true,
          all_visualization_urls: vizUrls.length > 0 ? vizUrls : null,
          tcpa_consent: tcpaConsent || false,
          tcpa_consent_at: tcpaConsent ? new Date().toISOString() : null,
          tcpa_consent_text: tcpaConsentText || null,
          consent_ip: consentIp || null,
          consent_user_agent: consentUserAgent || null,
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

  const allVisualizationUrls = await collectAllVisualizationUrls(supabase, { sessionId, userId, userFingerprint });

  // Create new record (fallback or no sessionId)
  const { data, error } = await supabase
    .from('leads')
    .insert([
      {
        name,
        email,
        phone: phone || null,
        zip_code: zipCode,
        location_id: resolvedLocation.locationId,
        location_name: resolvedLocation.locationName,
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
        contact_submitted: true,
        all_visualization_urls: allVisualizationUrls.length > 0 ? allVisualizationUrls : null,
        tcpa_consent: tcpaConsent || false,
        tcpa_consent_at: tcpaConsent ? new Date().toISOString() : null,
        tcpa_consent_text: tcpaConsentText || null,
        consent_ip: consentIp || null,
        consent_user_agent: consentUserAgent || null,
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
      original_image_url: record.originalImageUrl || null,
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
 * Resolve a franchise location from a customer's zip code by querying
 * the territory_zipcodes table (populated by sync_gatsby_glass_locations).
 * Returns the first matching active location, or a placeholder when no
 * territory covers the supplied zip.
 */
export async function lookupLocationByZipcode(
  config: SupabaseConfig,
  zipCode: string
): Promise<{ locationId: string; locationName: string }> {
  const supabase = getSupabaseClient(config);
  const NO_TERRITORY = { locationId: 'NO_TERRITORY', locationName: 'No Territory' };

  const cleanZip = zipCode.replace(/[^0-9]/g, '').slice(0, 5);
  if (cleanZip.length !== 5) return NO_TERRITORY;

  const { data: zipRow, error: zipErr } = await supabase
    .from('territory_zipcodes')
    .select('location_id')
    .eq('zip_code', cleanZip)
    .order('location_id', { ascending: true })
    .limit(1)
    .single();

  if (zipErr || !zipRow) return NO_TERRITORY;

  const { data: locRow } = await supabase
    .from('team_locations')
    .select('location_name')
    .eq('location_id', zipRow.location_id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!locRow) return NO_TERRITORY;

  return {
    locationId: zipRow.location_id,
    locationName: locRow.location_name || zipRow.location_id,
  };
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

// ---------------------------------------------------------------------------
// Visualizer submissions (consent-driven photo storage)
// ---------------------------------------------------------------------------

/**
 * Create a new visualizer submission (original photo + consent flags).
 */
export async function createSubmission(
  config: SupabaseConfig,
  input: VisualizerSubmissionInput
): Promise<{ id: string }> {
  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase
    .from('visualizer_submissions')
    .insert([{
      original_photo_path: input.originalPhotoPath,
      upload_consent: input.uploadConsent,
      marketing_consent: input.marketingConsent,
      source_url: input.sourceUrl || null,
      metadata: input.metadata || {},
    }])
    .select('id')
    .single();

  if (error) {
    console.error('[createSubmission] Database error:', error);
    throw new Error('Failed to create submission record');
  }

  return { id: data.id };
}

/**
 * Update a submission with the generated image path after AI completes.
 * Only updates rows where generated_image_path is still null (prevents overwriting).
 */
export async function updateSubmissionGeneratedImage(
  config: SupabaseConfig,
  submissionId: string,
  generatedImagePath: string
): Promise<void> {
  const supabase = getSupabaseClient(config);

  const { error } = await supabase
    .from('visualizer_submissions')
    .update({ generated_image_path: generatedImagePath })
    .eq('id', submissionId)
    .is('generated_image_path', null);

  if (error) {
    console.error('[updateSubmissionGeneratedImage] Database error:', error);
    throw new Error('Failed to update submission with generated image');
  }
}

/**
 * Fetch non-expired submissions for the admin UI.
 */
export async function getSubmissions(
  config: SupabaseConfig,
  options: { marketingOnly?: boolean; limit?: number } = {}
): Promise<VisualizerSubmission[]> {
  const { marketingOnly = false, limit = 50 } = options;
  const supabase = getSupabaseClient(config);

  let query = supabase
    .from('visualizer_submissions')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (marketingOnly) {
    query = query.eq('marketing_consent', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getSubmissions] Database error:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    originalPhotoPath: row.original_photo_path,
    generatedImagePath: row.generated_image_path,
    uploadConsent: row.upload_consent,
    marketingConsent: row.marketing_consent,
    sourceUrl: row.source_url,
    metadata: row.metadata || {},
  }));
}

/**
 * Query expired submission rows (for the purge cron).
 * Returns the rows so the caller can delete storage files before removing DB rows.
 */
export async function getExpiredSubmissions(
  config: SupabaseConfig,
  limit = 50
): Promise<{ id: string; originalPhotoPath: string; generatedImagePath: string | null }[]> {
  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase
    .from('visualizer_submissions')
    .select('id, original_photo_path, generated_image_path')
    .lt('expires_at', new Date().toISOString())
    .limit(limit);

  if (error) {
    console.error('[getExpiredSubmissions] Database error:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    originalPhotoPath: row.original_photo_path,
    generatedImagePath: row.generated_image_path,
  }));
}

/**
 * Delete submission rows by IDs (after storage files have been cleaned up).
 */
export async function deleteSubmissionRows(
  config: SupabaseConfig,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const supabase = getSupabaseClient(config);

  const { error } = await supabase
    .from('visualizer_submissions')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('[deleteSubmissionRows] Database error:', error);
  }
}

// ---------------------------------------------------------------------------
// Team location permissions
// ---------------------------------------------------------------------------

export type AccessLevel = 'member' | 'social' | 'admin';

const ACCESS_HIERARCHY: Record<AccessLevel, number> = {
  member: 0,
  social: 1,
  admin: 2,
};

export interface TeamLocationWithPermissions extends TeamLocation {
  accessLevel: AccessLevel;
}

/**
 * True when the user's access level is at least `required`.
 * admin >= social >= member.
 */
export function hasAccess(
  userLevel: AccessLevel,
  required: AccessLevel
): boolean {
  return (ACCESS_HIERARCHY[userLevel] ?? 0) >= ACCESS_HIERARCHY[required];
}

/**
 * Look up a team member by email and return location info plus their access
 * level. Returns null when the email does not belong to an active location.
 */
export async function getTeamLocationWithPermissions(
  config: SupabaseConfig,
  email: string
): Promise<TeamLocationWithPermissions | null> {
  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase
    .from('team_locations')
    .select('location_id, location_name, access_level')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    locationId: data.location_id,
    locationName: data.location_name,
    accessLevel: (data.access_level as AccessLevel) ?? 'member',
  };
}

// ---------------------------------------------------------------------------
// Usage report
// ---------------------------------------------------------------------------

export interface UsageReportRow {
  locationId: string;
  locationName: string;
  dailyVisualizations: Record<string, number>;
  dailyLeads: Record<string, number>;
  totalVisualizations: number;
  totalLeads: number;
}

/**
 * Build a monthly usage report across all active locations.
 *
 * Returns one row per location that had any activity (visualizations or leads)
 * during the requested calendar month, plus rows for locations with zero
 * activity so the caller can show them as well.
 */
export async function getUsageReport(
  config: SupabaseConfig,
  { year, month }: { year: number; month: number }
): Promise<UsageReportRow[]> {
  const supabase = getSupabaseClient(config);

  const monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const nextMonthStart = new Date(Date.UTC(year, month, 1)).toISOString();

  const [vizResult, leadsResult, locationsResult] = await Promise.all([
    supabase
      .from('visualizations')
      .select('team, created_at')
      .not('team', 'is', null)
      .gte('created_at', monthStart)
      .lt('created_at', nextMonthStart),

    supabase
      .from('leads')
      .select('location_id, created_at')
      .not('location_id', 'is', null)
      .neq('location_id', 'NO_TERRITORY')
      .gte('created_at', monthStart)
      .lt('created_at', nextMonthStart),

    supabase
      .from('team_locations')
      .select('location_id, location_name')
      .eq('is_active', true),
  ]);

  const locationMap = new Map<string, UsageReportRow>();

  for (const loc of locationsResult.data ?? []) {
    locationMap.set(loc.location_id, {
      locationId: loc.location_id,
      locationName: loc.location_name ?? loc.location_id,
      dailyVisualizations: {},
      dailyLeads: {},
      totalVisualizations: 0,
      totalLeads: 0,
    });
  }

  const toDateKey = (iso: string) => iso.slice(0, 10);

  for (const row of vizResult.data ?? []) {
    const locId = row.team as string;
    const day = toDateKey(row.created_at);
    let entry = locationMap.get(locId);
    if (!entry) {
      entry = {
        locationId: locId,
        locationName: locId,
        dailyVisualizations: {},
        dailyLeads: {},
        totalVisualizations: 0,
        totalLeads: 0,
      };
      locationMap.set(locId, entry);
    }
    entry.dailyVisualizations[day] = (entry.dailyVisualizations[day] ?? 0) + 1;
    entry.totalVisualizations += 1;
  }

  for (const row of leadsResult.data ?? []) {
    const locId = row.location_id as string;
    const day = toDateKey(row.created_at);
    let entry = locationMap.get(locId);
    if (!entry) {
      entry = {
        locationId: locId,
        locationName: locId,
        dailyVisualizations: {},
        dailyLeads: {},
        totalVisualizations: 0,
        totalLeads: 0,
      };
      locationMap.set(locId, entry);
    }
    entry.dailyLeads[day] = (entry.dailyLeads[day] ?? 0) + 1;
    entry.totalLeads += 1;
  }

  return Array.from(locationMap.values()).sort(
    (a, b) =>
      b.totalVisualizations + b.totalLeads - (a.totalVisualizations + a.totalLeads)
  );
}
