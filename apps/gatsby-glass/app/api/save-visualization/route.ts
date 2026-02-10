import { NextRequest, NextResponse } from 'next/server';
import { saveVisualization } from '@repo/api-handlers/supabase';
import type { VisualizationData } from '@repo/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[SAVE-VIZ API] Request body:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.sessionId) {
      console.error('[SAVE-VIZ API] Missing sessionId in request');
      return NextResponse.json(
        { error: 'Session ID is required' },
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

    const visualizationData: VisualizationData = {
      sessionId: body.sessionId,
      mode: body.mode,
      enclosureType: body.enclosureType,
      glassStyle: body.glassStyle,
      hardwareFinish: body.hardwareFinish,
      handleStyle: body.handleStyle,
      trackPreference: body.trackPreference,
      showerShape: body.showerShape,
      visualizationImage: body.visualizationImage,
      originalImage: body.originalImage,
      source: 'Gatsby Glass Visualizer'
    };

    const result = await saveVisualization(
      { url: supabaseUrl, serviceKey: supabaseKey },
      visualizationData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Visualization save error:', error);
    return NextResponse.json(
      { error: 'An error occurred while saving visualization data' },
      { status: 500 }
    );
  }
}
