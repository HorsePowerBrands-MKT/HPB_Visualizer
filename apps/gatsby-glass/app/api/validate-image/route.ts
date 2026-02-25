import { NextRequest, NextResponse } from 'next/server';
import { validateImage } from '@repo/api-handlers/gemini';
import type { ImageData } from '@repo/types';
import { ValidationRequestSchema } from '../../../lib/validation';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  console.log('[VALIDATE-IMAGE API] Request received');
  
  try {
    const body = await request.json();
    console.log('[VALIDATE-IMAGE API] Body parsed, keys:', Object.keys(body));
    
    // Validate input
    const validatedData = ValidationRequestSchema.parse(body);
    console.log('[VALIDATE-IMAGE API] Schema validation passed');
    
    // Support both formats
    const imageData = 'data' in validatedData ? validatedData.data : validatedData.imageData;
    const mimeType = validatedData.mimeType;
    console.log('[VALIDATE-IMAGE API] Image data length:', imageData.length, 'mimeType:', mimeType);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[VALIDATE-IMAGE API] GEMINI_API_KEY not configured');
      return NextResponse.json(
        { 
          valid: false,
          error: 'Server configuration error: Missing API key',
          reason: 'Server configuration error. Please contact support.',
          shape: 'standard'
        },
        { status: 500 }
      );
    }

    const imageDataObj: ImageData = { data: imageData, mimeType };
    console.log('[VALIDATE-IMAGE API] Starting Gemini validation...');
    const result = await validateImage({ apiKey }, imageDataObj);
    console.log('[VALIDATE-IMAGE API] Validation result:', JSON.stringify(result));

    if (result.contentFlag && result.contentFlag !== 'safe') {
      console.warn(`[VALIDATE-IMAGE API] Content flagged as: ${result.contentFlag}`);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('[VALIDATE-IMAGE API] Zod validation error:', error.issues);
      return NextResponse.json(
        {
          valid: false,
          reason: `Invalid request: ${error.issues[0]?.message || 'Validation failed'}`,
          shape: 'standard'
        },
        { status: 400 }
      );
    }
    
    console.error('[VALIDATE-IMAGE API] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[VALIDATE-IMAGE API] Error details:', errorMessage);
    
    return NextResponse.json(
      {
        valid: false,
        reason: 'Unable to verify image content. Please try again.',
        error: errorMessage,
        shape: 'standard'
      },
      { status: 500 }
    );
  }
}
