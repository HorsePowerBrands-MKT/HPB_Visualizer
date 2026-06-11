import { NextRequest, NextResponse } from 'next/server';
import {
  CORPORATE_LOCATION_ID,
  getTeamLocationWithPermissions,
  getTeamUserById,
  hasAccess,
  listActiveLocations,
  updateTeamUser,
  type AccessLevel,
} from '@repo/api-handlers/supabase';
import { createClient } from '../../../../../lib/supabase/server';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

const GRANTABLE_LEVELS: AccessLevel[] = ['member', 'social', 'admin'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sbConfig = getSupabaseConfig();
  if (!sbConfig) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let actorEmail: string;
  let actorLevel: AccessLevel;
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
      return NextResponse.json({ error: 'You do not have permission to manage users' }, { status: 403 });
    }

    actorEmail = user.email.toLowerCase();
    actorLevel = location.accessLevel;
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  const target = await getTeamUserById(sbConfig, params.id);
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const actorIsSuperAdmin = actorLevel === 'super_admin';

  if (target.accessLevel === 'super_admin' && !actorIsSuperAdmin) {
    return NextResponse.json({ error: 'Only super admins can modify super admin users' }, { status: 403 });
  }

  let body: {
    accessLevel?: AccessLevel;
    isActive?: boolean;
    userType?: 'corporate' | 'franchise';
    locationId?: string;
    locationName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const isSelf = target.email === actorEmail;
  const updates: {
    accessLevel?: AccessLevel;
    isActive?: boolean;
    locationId?: string;
    locationName?: string | null;
  } = {};

  if (body.accessLevel !== undefined) {
    const allowedLevels: AccessLevel[] =
      actorIsSuperAdmin ? [...GRANTABLE_LEVELS, 'super_admin'] : GRANTABLE_LEVELS;
    if (!allowedLevels.includes(body.accessLevel)) {
      return NextResponse.json({ error: 'You cannot grant that access level' }, { status: 403 });
    }
    if (isSelf && body.accessLevel !== target.accessLevel) {
      return NextResponse.json({ error: 'You cannot change your own access level' }, { status: 403 });
    }
    updates.accessLevel = body.accessLevel;
  }

  if (body.isActive !== undefined) {
    if (isSelf && body.isActive === false) {
      return NextResponse.json({ error: 'You cannot deactivate yourself' }, { status: 403 });
    }
    updates.isActive = body.isActive;
  }

  if (body.userType !== undefined) {
    if (body.userType === 'corporate') {
      const name = (body.locationName ?? '').trim();
      if (!name) {
        return NextResponse.json({ error: 'A name is required for corporate users' }, { status: 400 });
      }
      updates.locationId = CORPORATE_LOCATION_ID;
      updates.locationName = name;
    } else if (body.userType === 'franchise') {
      const requestedId = (body.locationId ?? '').trim();
      const locations = await listActiveLocations(sbConfig);
      const match = locations.find(l => l.locationId === requestedId);
      if (!match) {
        return NextResponse.json({ error: 'Unknown franchise location' }, { status: 400 });
      }
      updates.locationId = match.locationId;
      updates.locationName = match.locationName;
    } else {
      return NextResponse.json({ error: 'userType must be "corporate" or "franchise"' }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  try {
    const user = await updateTeamUser(sbConfig, params.id, updates);
    return NextResponse.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
