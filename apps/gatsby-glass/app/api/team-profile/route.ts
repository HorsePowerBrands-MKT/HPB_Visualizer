import { NextResponse } from 'next/server';
import { getTeamLocationWithPermissions } from '@repo/api-handlers/supabase';
import { createClient } from '../../../lib/supabase/server';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

export async function GET() {
  const sbConfig = getSupabaseConfig();
  if (!sbConfig) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const location = await getTeamLocationWithPermissions(sbConfig, user.email);
    if (!location) {
      return NextResponse.json({ error: 'Team authorization required' }, { status: 403 });
    }

    return NextResponse.json({
      email: user.email.toLowerCase(),
      locationName: location.locationName,
      accessLevel: location.accessLevel,
    });
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
