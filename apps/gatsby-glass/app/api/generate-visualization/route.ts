import { NextRequest, NextResponse } from 'next/server';
import { generateVisualization } from '@repo/api-handlers/gemini';
import type { VisualizationRequest } from '@repo/types';
import { VisualizationRequestSchema } from '../../../lib/validation';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input with Zod
    const validatedData = VisualizationRequestSchema.parse(body);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const visualizationRequest: VisualizationRequest = {
      bathroomImage: validatedData.bathroomImage,
      inspirationImage: validatedData.inspirationImage,
      prompt: validatedData.prompt
    };

    const result = await generateVisualization({ apiKey }, visualizationRequest);

    return NextResponse.json(result);
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
