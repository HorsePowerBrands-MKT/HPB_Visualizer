import { NextRequest, NextResponse } from 'next/server';
import { saveVisualization, saveGeneration } from '@repo/api-handlers/supabase';
import type { VisualizationData, GenerationRecord } from '@repo/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[SAVE-VIZ API] Request body:', JSON.stringify(body, null, 2));
    
    if (!body.sessionId) {
      console.error('[SAVE-VIZ API] Missing sessionId in request');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[SAVE-VIZ API] Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseConfig = { url: supabaseUrl, serviceKey: supabaseKey };

    // Upsert the session-level lead record (first gen creates it, re-gens update it)
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
      source: 'Gatsby Glass Visualizer',
      team: body.team || null,
    };

    const sessionResult = await saveVisualization(supabaseConfig, visualizationData);

    // Always insert a new row into visualizations for every generation event
    const generationRecord: GenerationRecord = {
      sessionId: body.sessionId,
      generationIndex: body.generationIndex || 1,
      enclosureType: body.enclosureType,
      hardwareFinish: body.hardwareFinish,
      handleStyle: body.handleStyle,
      trackPreference: body.trackPreference,
      showerShape: body.showerShape,
      mode: body.mode,
      visualizationImageUrl: body.visualizationImage,
      originalImageUrl: body.originalImage,
      team: body.team || null,
    };

    const genResult = await saveGeneration(supabaseConfig, generationRecord);
    console.log('[SAVE-VIZ API] Generation record saved:', genResult.id);

    return NextResponse.json({ ...sessionResult, generationId: genResult.id });
  } catch (error) {
    console.error('[SAVE-VIZ API] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while saving visualization data' },
      { status: 500 }
    );
  }
}
