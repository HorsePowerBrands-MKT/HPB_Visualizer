import { NextRequest, NextResponse } from 'next/server';
import { getTeamLocationWithPermissions, getUsageReport, hasAccess } from '@repo/api-handlers/supabase';
import { createClient } from '../../../../lib/supabase/server';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

export async function GET(request: NextRequest) {
  const sbConfig = getSupabaseConfig();
  if (!sbConfig) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const location = await getTeamLocationWithPermissions(sbConfig, user.email);
    if (!location) {
      return NextResponse.json({ error: 'Team authorization required' }, { status: 403 });
    }

    if (!hasAccess(location.accessLevel, 'admin')) {
      return NextResponse.json({ error: 'You do not have permission to view reports' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const month = Math.min(12, Math.max(1, parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10)));
  const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);

  const rows = await getUsageReport(sbConfig, { year, month });

  return NextResponse.json({ year, month, rows });
}
