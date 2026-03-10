import { NextRequest, NextResponse } from 'next/server';
import { generateVisualization } from '@repo/api-handlers/gemini';
import {
  getMonthlyUsageCount,
  recordUsage,
  getTeamLocation,
  MONTHLY_GENERATION_LIMIT,
} from '@repo/api-handlers/supabase';
import type { VisualizationRequest } from '@repo/types';
import { VisualizationRequestSchema } from '../../../lib/validation';
import { ZodError } from 'zod';
import { createClient } from '../../../lib/supabase/server';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = VisualizationRequestSchema.parse(body);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const sbConfig = getSupabaseConfig();

    // --- Auth check: is this an authenticated team member? ---
    let isTeamMember = false;
    let teamLocationId: string | null = null;

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email && sbConfig) {
        const location = await getTeamLocation(sbConfig, user.email);
        if (location) {
          isTeamMember = true;
          teamLocationId = location.locationId;
        }
      }
    } catch {
      // Auth check failed — treat as public user
    }

    // --- Rate limiting (public users only) ---
    const fingerprint = validatedData.userFingerprint;
    let usageCount = 0;

    if (!isTeamMember && sbConfig) {
      if (fingerprint) {
        usageCount = await getMonthlyUsageCount(sbConfig, fingerprint);
      }

      if (usageCount >= MONTHLY_GENERATION_LIMIT) {
        return NextResponse.json(
          {
            error: 'Monthly visualization limit reached',
            rateLimited: true,
            usageCount,
            limit: MONTHLY_GENERATION_LIMIT,
          },
          { status: 429 }
        );
      }
    }

    // --- Generate the visualization ---
    const visualizationRequest: VisualizationRequest = {
      bathroomImage: validatedData.bathroomImage,
      inspirationImage: validatedData.inspirationImage,
      prompt: validatedData.prompt,
    };

    const result = await generateVisualization({ apiKey }, visualizationRequest);

    // --- Record usage for rate limiting ---
    if (!isTeamMember && sbConfig && fingerprint) {
      const ip = getClientIp(request);
      await recordUsage(sbConfig, fingerprint, ip);
      usageCount += 1;
    }

    return NextResponse.json({
      ...result,
      usageCount,
      limit: MONTHLY_GENERATION_LIMIT,
      ...(teamLocationId ? { teamLocationId } : {}),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: `Invalid request: ${error.issues[0]?.message || 'Validation failed'}` },
        { status: 400 }
      );
    }

    console.error('Visualization generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: `Failed to generate visualization: ${errorMessage}` },
      { status: 500 }
    );
  }
}
