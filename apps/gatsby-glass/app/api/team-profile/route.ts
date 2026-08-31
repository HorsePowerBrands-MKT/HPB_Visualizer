import { NextResponse } from 'next/server';
import {
  getTeamLocationWithPermissions,
  getMonthlyUsageCountByUserId,
  DEFAULT_CANDIDATE_RENDERING_CAP,
} from '@repo/api-handlers/supabase';
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

    const response: Record<string, unknown> = {
      email: user.email.toLowerCase(),
      locationName: location.locationName,
      accessLevel: location.accessLevel,
      userType: location.userType,
    };

    if (location.userType === 'candidate') {
      const renderingCap = location.renderingCap ?? DEFAULT_CANDIDATE_RENDERING_CAP;
      const usageCount = await getMonthlyUsageCountByUserId(sbConfig, user.id);
      response.renderingCap = renderingCap;
      response.usageCount = usageCount;
      response.remaining = Math.max(0, renderingCap - usageCount);
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
