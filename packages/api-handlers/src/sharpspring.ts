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

interface SharpSpringResponse {
  result?: { creates?: Array<{ success: boolean; error?: unknown }> };
  error?: { message?: string; code?: number } | null;
  id: string;
}

const API_URL = 'https://api.sharpspring.com/pubapi/v1.2/';

const CUSTOM_FIELDS = {
  leadSource: '300000000036543',
  brandName: '300000000036541',
  locationName: '300000000036545',
  visualizerLeadType: '400000055554051',
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

    const json: SharpSpringResponse = await response.json();

    if (json.error) {
      console.error('[SHARPSPRING] API error:', json.error);
      return { success: false, error: json.error.message || 'API error' };
    }

    const createResult = json.result?.creates?.[0];
    if (createResult && !createResult.success) {
      console.error('[SHARPSPRING] Lead create failed:', createResult.error);
      return { success: false, error: String(createResult.error || 'Create failed') };
    }

    console.log(`[SHARPSPRING] Lead pushed for ${data.email} (${data.leadType || 'unknown type'})`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[SHARPSPRING] Unexpected error:', msg);
    return { success: false, error: msg };
  }
}
