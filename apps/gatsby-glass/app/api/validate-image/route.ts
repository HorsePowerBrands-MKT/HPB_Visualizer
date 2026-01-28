import { NextRequest, NextResponse } from 'next/server';
import { validateImage } from '@repo/api-handlers/gemini';
import type { ImageData } from '@repo/types';
import { ValidationRequestSchema } from '../../../lib/validation';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = ValidationRequestSchema.parse(body);
    
    // Support both formats
    const imageData = 'data' in validatedData ? validatedData.data : validatedData.imageData;
    const mimeType = validatedData.mimeType;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const imageDataObj: ImageData = { data: imageData, mimeType };
    console.log('[VALIDATE-IMAGE] Starting validation...');
    const result = await validateImage({ apiKey }, imageDataObj);
    console.log('[VALIDATE-IMAGE] Result:', JSON.stringify(result));

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        {
          valid: false,
          reason: `Invalid request: ${error.issues[0]?.message || 'Validation failed'}`,
          shape: 'standard'
        },
        { status: 400 }
      );
    }
    
    console.error('Image validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        reason: 'Unable to verify image content. Please try again.',
        shape: 'standard'
      },
      { status: 500 }
    );
  }
}
