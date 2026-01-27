import { NextRequest, NextResponse } from 'next/server';
import { validateImage } from '@repo/api-handlers/gemini';
import type { ImageData } from '@repo/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Support both { data, mimeType } and { imageData, mimeType } formats
    const imageData = body.data || body.imageData;
    const mimeType = body.mimeType;

    if (!imageData || !mimeType) {
      console.log('[VALIDATE-IMAGE] Missing fields. Received:', Object.keys(body));
      return NextResponse.json(
        { error: 'Missing required fields: data/imageData, mimeType' },
        { status: 400 }
      );
    }

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
