import { NextRequest, NextResponse } from 'next/server';
import {
  getMonthlyUsageCount,
  MONTHLY_GENERATION_LIMIT,
} from '@repo/api-handlers/supabase';

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
    return NextResponse.json(
      { usageCount: 0, limit: MONTHLY_GENERATION_LIMIT, remaining: MONTHLY_GENERATION_LIMIT }
    );
  }

  const usageCount = await getMonthlyUsageCount(
    { url: supabaseUrl, serviceKey: supabaseKey },
    fingerprint
  );

  return NextResponse.json({
    usageCount,
    limit: MONTHLY_GENERATION_LIMIT,
    remaining: Math.max(0, MONTHLY_GENERATION_LIMIT - usageCount),
  });
}
