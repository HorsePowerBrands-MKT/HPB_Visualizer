import { NextRequest, NextResponse } from 'next/server';
import { saveGeneration } from '@repo/api-handlers/supabase';
import { createClient } from '../../../lib/supabase/server';
import type { GenerationRecord } from '@repo/types';

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

    // Read authenticated user (if any) from the Supabase session cookie
    let authUserId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) authUserId = user.id;
    } catch {
      // Not authenticated — proceed without user_id
    }

    const supabaseConfig = { url: supabaseUrl, serviceKey: supabaseKey };

    const generationRecord: GenerationRecord = {
      sessionId: body.sessionId,
      generationIndex: body.generationIndex || 1,
      mode: body.mode,
      enclosureType: body.enclosureType,
      framingStyle: body.framingStyle,
      hardwareFinish: body.hardwareFinish,
      handleStyle: body.handleStyle,
      showerShape: body.showerShape,
      hingedConfig: body.hingedConfig,
      pivotConfig: body.pivotConfig,
      slidingConfig: body.slidingConfig,
      visualizationImageUrl: body.visualizationImage,
      originalImageUrl: body.originalImageUrl || null,
      team: body.team || null,
      userFingerprint: body.userFingerprint || null,
      userId: authUserId,
    };

    const genResult = await saveGeneration(supabaseConfig, generationRecord);
    console.log('[SAVE-VIZ API] Generation record saved:', genResult.id);

    return NextResponse.json({ success: true, generationId: genResult.id });
  } catch (error) {
    console.error('[SAVE-VIZ API] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while saving visualization data' },
      { status: 500 }
    );
  }
}
