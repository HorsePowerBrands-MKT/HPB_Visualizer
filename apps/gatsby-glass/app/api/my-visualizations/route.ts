import { NextRequest, NextResponse } from 'next/server';
import { getVisualizationsByFingerprint } from '@repo/api-handlers/supabase';

export async function GET(request: NextRequest) {
  const fingerprint = request.nextUrl.searchParams.get('fingerprint');

  if (!fingerprint) {
    return NextResponse.json(
      { error: 'fingerprint query param is required' },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ visualizations: [] });
  }

  const visualizations = await getVisualizationsByFingerprint(
    { url: supabaseUrl, serviceKey: supabaseKey },
    fingerprint
  );

  return NextResponse.json({ visualizations });
}
