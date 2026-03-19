import { NextRequest, NextResponse } from 'next/server';
import { getVisualizationsByFingerprint, getVisualizationsByUserId } from '@repo/api-handlers/supabase';
import { createClient } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ visualizations: [] });
  }

  const sbConfig = { url: supabaseUrl, serviceKey: supabaseKey };

  // If authenticated, return visualizations linked to the user account
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const visualizations = await getVisualizationsByUserId(sbConfig, user.id);
      return NextResponse.json({ visualizations });
    }
  } catch {
    // Not authenticated — fall through to fingerprint lookup
  }

  // Fall back to fingerprint-based lookup for anonymous users
  const fingerprint = request.nextUrl.searchParams.get('fingerprint');

  if (!fingerprint) {
    return NextResponse.json(
      { error: 'fingerprint query param is required' },
      { status: 400 }
    );
  }

  const visualizations = await getVisualizationsByFingerprint(sbConfig, fingerprint);
  return NextResponse.json({ visualizations });
}
