import { NextRequest, NextResponse } from 'next/server';
import {
  CORPORATE_LOCATION_ID,
  createTeamUser,
  getTeamLocationWithPermissions,
  hasAccess,
  listActiveLocations,
  listTeamUsers,
  type AccessLevel,
  type TeamLocationWithPermissions,
} from '@repo/api-handlers/supabase';
import { createClient } from '../../../../lib/supabase/server';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

type Actor = TeamLocationWithPermissions & { email: string };

async function requireAdmin(
  sbConfig: { url: string; serviceKey: string }
): Promise<{ actor: Actor } | { response: NextResponse }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return { response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }

  const location = await getTeamLocationWithPermissions(sbConfig, user.email);
  if (!location) {
    return { response: NextResponse.json({ error: 'Team authorization required' }, { status: 403 }) };
  }

  if (!hasAccess(location.accessLevel, 'admin')) {
    return { response: NextResponse.json({ error: 'You do not have permission to manage users' }, { status: 403 }) };
  }

  return { actor: { ...location, email: user.email.toLowerCase() } };
}

const GRANTABLE_LEVELS: AccessLevel[] = ['member', 'social', 'admin'];

export async function GET() {
  const sbConfig = getSupabaseConfig();
  if (!sbConfig) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let actor: Actor;
  try {
    const gate = await requireAdmin(sbConfig);
    if ('response' in gate) return gate.response;
    actor = gate.actor;
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  try {
    const [users, locations] = await Promise.all([
      listTeamUsers(sbConfig),
      listActiveLocations(sbConfig),
    ]);

    return NextResponse.json({
      users,
      locations,
      currentUser: { email: actor.email, accessLevel: actor.accessLevel },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load users';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sbConfig = getSupabaseConfig();
  if (!sbConfig) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let actor: Actor;
  try {
    const gate = await requireAdmin(sbConfig);
    if ('response' in gate) return gate.response;
    actor = gate.actor;
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  let body: {
    email?: string;
    userType?: 'corporate' | 'franchise';
    locationId?: string;
    locationName?: string;
    accessLevel?: AccessLevel;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
  }

  const accessLevel = body.accessLevel ?? 'member';
  const allowedLevels: AccessLevel[] =
    actor.accessLevel === 'super_admin' ? [...GRANTABLE_LEVELS, 'super_admin'] : GRANTABLE_LEVELS;
  if (!allowedLevels.includes(accessLevel)) {
    return NextResponse.json({ error: 'You cannot grant that access level' }, { status: 403 });
  }

  let locationId: string;
  let locationName: string | null;

  if (body.userType === 'corporate') {
    const name = (body.locationName ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'A name is required for corporate users' }, { status: 400 });
    }
    locationId = CORPORATE_LOCATION_ID;
    locationName = name;
  } else if (body.userType === 'franchise') {
    const requestedId = (body.locationId ?? '').trim();
    if (!requestedId.startsWith('GG-')) {
      return NextResponse.json({ error: 'A valid franchise location is required' }, { status: 400 });
    }
    const locations = await listActiveLocations(sbConfig);
    const match = locations.find(l => l.locationId === requestedId);
    if (!match) {
      return NextResponse.json({ error: 'Unknown franchise location' }, { status: 400 });
    }
    locationId = match.locationId;
    locationName = match.locationName;
  } else {
    return NextResponse.json({ error: 'userType must be "corporate" or "franchise"' }, { status: 400 });
  }

  try {
    const user = await createTeamUser(sbConfig, { email, locationId, locationName, accessLevel });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create user';
    const status = message.includes('already exists') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
