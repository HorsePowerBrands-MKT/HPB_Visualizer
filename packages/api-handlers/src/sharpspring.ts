/**
 * Constant Contact CRM (SharpSpring) API client.
 *
 * Uses the JSON-RPC style v1.2 endpoint to create leads.
 * All calls are fault-tolerant -- errors are logged and returned,
 * never thrown, so the caller's main flow is never interrupted.
 */

export interface SharpSpringConfig {
  accountId: string;
  secretKey: string;
}

export interface SharpSpringLeadData {
  name: string;
  email: string;
  phone?: string;
  zipCode: string;
  locationName?: string;
  leadType?: 'SAS' | 'RAQ';
}

interface SharpSpringError {
  code?: number;
  message?: string;
  data?: unknown;
}

interface SharpSpringResponse {
  result?: { creates?: Array<{ success: boolean; error?: unknown }> };
  error?: SharpSpringError[] | SharpSpringError | null;
  id: string;
}

const API_URL = 'https://api.sharpspring.com/pubapi/v1.2/';

const CUSTOM_FIELDS = {
  leadSource: 'leadsource_6670699148d8a',
  brandName: 'brand_name_6670693631e03',
  locationName: 'location_name_667069b66d712',
  visualizerLeadType: 'visualizer_lead_69cd376489e06',
} as const;

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx === -1) return { firstName: trimmed, lastName: '' };
  return {
    firstName: trimmed.slice(0, spaceIdx),
    lastName: trimmed.slice(spaceIdx + 1).trim(),
  };
}

/**
 * Push a lead to the Constant Contact CRM (SharpSpring).
 * Returns `{ success: true }` on success, or `{ success: false, error }` on
 * failure. Never throws.
 */
export async function pushLeadToSharpSpring(
  config: SharpSpringConfig,
  data: SharpSpringLeadData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { firstName, lastName } = splitName(data.name);

    const leadObject: Record<string, unknown> = {
      emailAddress: data.email,
      firstName,
      lastName,
      zipcode: data.zipCode,
      [CUSTOM_FIELDS.leadSource]: 'Visualizer',
      [CUSTOM_FIELDS.brandName]: 'Gatsby Glass',
    };

    if (data.phone) {
      leadObject.phoneNumber = data.phone;
    }

    if (data.locationName && data.locationName !== 'No Territory') {
      leadObject[CUSTOM_FIELDS.locationName] = data.locationName;
    }

    if (data.leadType) {
      leadObject[CUSTOM_FIELDS.visualizerLeadType] = data.leadType;
    }

    const requestId = `viz-${Date.now()}`;

    const url = new URL(API_URL);
    url.searchParams.set('accountID', config.accountId);
    url.searchParams.set('secretKey', config.secretKey);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'createLeads',
        params: { objects: [leadObject] },
        id: requestId,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[SHARPSPRING] HTTP ${response.status}: ${text}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const json = await response.json();

    console.log('[SHARPSPRING] Raw response:', JSON.stringify(json));

    // SharpSpring returns "error": [] on success, so check for non-empty errors
    const errors = Array.isArray(json.error)
      ? json.error.filter((e: SharpSpringError) => e && e.message)
      : json.error ? [json.error] : [];

    if (errors.length > 0) {
      console.error('[SHARPSPRING] API error:', JSON.stringify(errors));
      const msg = errors.map((e: SharpSpringError) => e.message || 'Unknown').join('; ');
      return { success: false, error: msg };
    }

    const createResult = json.result?.creates?.[0];
    if (createResult && !createResult.success) {
      console.error('[SHARPSPRING] Lead create failed:', JSON.stringify(createResult.error));
      return { success: false, error: String(createResult.error || 'Create failed') };
    }

    if (createResult?.success) {
      console.log(`[SHARPSPRING] Lead pushed for ${data.email} (${data.leadType || 'unknown type'}, id: ${createResult.id})`);
      return { success: true };
    }

    console.warn('[SHARPSPRING] Unexpected response shape:', JSON.stringify(json));
    return { success: false, error: 'Unexpected response from API' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[SHARPSPRING] Unexpected error:', msg);
    return { success: false, error: msg };
  }
}
