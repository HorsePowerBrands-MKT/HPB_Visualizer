import type { CookieOptions } from '@supabase/ssr';

/**
 * Cookie options that allow Supabase auth cookies to be carried into iframes
 * hosted on other origins (e.g. the marketing site, HubSpot pages, the
 * Horsepower Brands portal). Browsers will only attach third-party cookies
 * when they are explicitly marked SameSite=None; Secure.
 *
 * In local development (NODE_ENV=development) we leave the defaults alone
 * because the Secure flag is dropped by browsers on plain http://localhost.
 */
export function iframeFriendlyCookieOptions(): Partial<CookieOptions> {
  if (process.env.NODE_ENV !== 'production') {
    return {};
  }
  return {
    sameSite: 'none',
    secure: true,
  };
}
