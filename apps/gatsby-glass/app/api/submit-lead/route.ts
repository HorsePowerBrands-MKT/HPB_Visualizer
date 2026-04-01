import { NextRequest, NextResponse } from 'next/server';
import { submitLead, lookupLocationByZipcode } from '@repo/api-handlers/supabase';
import { pushLeadToSharpSpring } from '@repo/api-handlers/sharpspring';
import { validateLeadData } from '@repo/api-handlers/validation';
import type { Lead } from '@repo/types';
import { LeadSubmissionSchema } from '../../../lib/validation';
import { ZodError } from 'zod';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod first
    const validatedData = LeadSubmissionSchema.parse(body);
    
    // Also use existing validation for backwards compatibility
    const validation = validateLeadData({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      zipCode: validatedData.zipCode
    });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    let authUserId: string | undefined;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) authUserId = user.id;
    } catch { /* not authenticated */ }

    const leadData: Lead = {
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      zipCode: validatedData.zipCode,
      visualizationImage: validatedData.visualizationImage,
      doorType: validatedData.doorType as any,
      finish: validatedData.finish as any,
      hardware: validatedData.hardware as any,
      handleStyle: validatedData.handleStyle as any,
      trackPreference: validatedData.trackPreference as any,
      mode: validatedData.mode as any,
      showerShape: validatedData.showerShape as any,
      sessionId: validatedData.sessionId,
      source: validatedData.source || 'Gatsby Glass Visualizer',
      tcpaConsent: validatedData.tcpaConsent,
      tcpaConsentText: validatedData.tcpaConsentText,
      consentIp: clientIp,
      consentUserAgent: validatedData.consentUserAgent,
      userFingerprint: validatedData.userFingerprint,
      userId: authUserId,
      leadType: validatedData.leadType,
    };

    const supabaseConfig = { url: supabaseUrl, serviceKey: supabaseKey };

    const result = await submitLead(supabaseConfig, leadData);

    // Push to Constant Contact CRM (SharpSpring) -- fire-and-forget
    const ssAccountId = process.env.SHARPSPRING_ACCOUNT_ID;
    const ssSecretKey = process.env.SHARPSPRING_SECRET_KEY;

    if (ssAccountId && ssSecretKey) {
      const location = await lookupLocationByZipcode(supabaseConfig, validatedData.zipCode);

      pushLeadToSharpSpring(
        { accountId: ssAccountId, secretKey: ssSecretKey },
        {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          zipCode: validatedData.zipCode,
          locationName: location.locationName,
          leadType: validatedData.leadType,
        },
      ).catch((err) => {
        console.error('[SUBMIT-LEAD] SharpSpring push failed:', err);
      });
    } else {
      console.warn('[SUBMIT-LEAD] SharpSpring credentials not configured, skipping CRM push');
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation failed', errors: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
