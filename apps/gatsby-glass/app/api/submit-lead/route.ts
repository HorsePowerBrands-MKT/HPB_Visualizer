import { NextRequest, NextResponse } from 'next/server';
import { submitLead } from '@repo/api-handlers/supabase';
import { validateLeadData } from '@repo/api-handlers/validation';
import type { Lead } from '@repo/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      zipCode,
      visualizationImage,
      originalImage,
      doorType,
      finish,
      hardware,
      showerShape,
      source
    } = body;

    // Validate input
    const validation = validateLeadData({ name, email, phone, zipCode });
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
      name,
      email,
      phone,
      zipCode,
      visualizationImage,
      originalImage,
      doorType,
      finish,
      hardware,
      showerShape,
      source: source || 'Gatsby Glass Visualizer'
    };

    const result = await submitLead(
      { url: supabaseUrl, serviceKey: supabaseKey },
      leadData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
