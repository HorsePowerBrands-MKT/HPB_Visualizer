import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { backfillAuthUserId } from '@repo/api-handlers/supabase';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;

        if (supabaseUrl && serviceKey) {
          const sbConfig = { url: supabaseUrl, serviceKey };
          const adminClient = createSupabaseClient(supabaseUrl, serviceKey);
          const { data: location } = await adminClient
            .from('team_locations')
            .select('is_active, auth_user_id')
            .eq('email', user.email.toLowerCase())
            .single();

          if (!location || !location.is_active) {
            await supabase.auth.signOut();
            return NextResponse.redirect(
              `${origin}/login?error=unauthorized`
            );
          }

          if (!location.auth_user_id && user.id) {
            await backfillAuthUserId(sbConfig, user.email, user.id);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
