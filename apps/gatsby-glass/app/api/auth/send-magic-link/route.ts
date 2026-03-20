import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Validates that the email belongs to an active team_locations entry.
 * Does NOT send the magic link -- the client handles that so PKCE
 * code_verifier cookies are stored in the browser correctly.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

    const normalizedEmail = email.trim().toLowerCase();

    const { data: location, error: lookupError } = await supabase
      .from('team_locations')
      .select('email, location_name, is_active')
      .eq('email', normalizedEmail)
      .single();

    if (lookupError || !location) {
      return NextResponse.json(
        { error: 'This email is not associated with a Gatsby Glass location.' },
        { status: 403 }
      );
    }

    if (!location.is_active) {
      return NextResponse.json(
        { error: 'This location account is no longer active.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Validate email error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
