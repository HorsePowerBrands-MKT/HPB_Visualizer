import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required');
  }

  // The app may be embedded in an iframe on another origin (HubSpot, the
  // Horsepower Brands site, etc.). Browsers will only send the Supabase auth
  // cookies into that iframe when they are flagged SameSite=None; Secure.
  // On http://localhost the Secure flag would prevent the cookie from being
  // stored at all, so we keep the library defaults during local development.
  const isHttps =
    typeof window !== 'undefined' && window.location.protocol === 'https:';

  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookieOptions: isHttps
      ? { sameSite: 'none', secure: true, path: '/' }
      : undefined,
  });
}
