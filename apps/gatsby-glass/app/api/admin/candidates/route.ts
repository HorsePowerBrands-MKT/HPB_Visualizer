import { NextRequest, NextResponse } from 'next/server';
import {
  getCandidateMetrics,
  getTeamLocationWithPermissions,
  hasAccess,
  updateTeamUser,
} from '@repo/api-handlers/supabase';
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

    if (!hasAccess(location.accessLevel, 'corporate_team')) {
      return NextResponse.json({ error: 'You do not have permission to view candidates' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1), 10);

    const candidates = await getCandidateMetrics(sbConfig, { year, month });

    return NextResponse.json({
      year,
      month,
      candidates,
      canManage: hasAccess(location.accessLevel, 'admin'),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load candidates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
      return NextResponse.json({ error: 'You do not have permission to manage candidates' }, { status: 403 });
    }

    let body: { id?: string; isActive?: boolean; renderingCap?: number | null };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!body.id) {
      return NextResponse.json({ error: 'Candidate id is required' }, { status: 400 });
    }

    const updates: { isActive?: boolean; renderingCap?: number | null } = {};
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.renderingCap !== undefined) updates.renderingCap = body.renderingCap;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const updatedUser = await updateTeamUser(sbConfig, body.id, updates);
    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update candidate';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
