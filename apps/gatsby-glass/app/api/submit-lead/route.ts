import { NextRequest, NextResponse } from 'next/server';
import { submitLead } from '@repo/api-handlers/supabase';
import { validateLeadData } from '@repo/api-handlers/validation';
import type { Lead } from '@repo/types';
import { LeadSubmissionSchema } from '../../../lib/validation';
import { ZodError } from 'zod';

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

    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const leadData: Lead = {
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      zipCode: validatedData.zipCode,
      visualizationImage: validatedData.visualizationImage,
      originalImage: validatedData.originalImage,
      doorType: validatedData.doorType as any,
      finish: validatedData.finish as any,
      hardware: validatedData.hardware as any,
      handleStyle: validatedData.handleStyle as any,
      trackPreference: validatedData.trackPreference as any,
      mode: validatedData.mode as any,
      showerShape: validatedData.showerShape as any,
      sessionId: validatedData.sessionId,
      source: 'Gatsby Glass Visualizer'
    };

    const result = await submitLead(
      { url: supabaseUrl, serviceKey: supabaseKey },
      leadData
    );

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
