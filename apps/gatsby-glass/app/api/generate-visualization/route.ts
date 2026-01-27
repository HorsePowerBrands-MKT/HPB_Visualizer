import { NextRequest, NextResponse } from 'next/server';
import { generateVisualization } from '@repo/api-handlers/gemini';
import type { VisualizationRequest } from '@repo/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bathroomImage, inspirationImage, prompt } = body;

    if (!bathroomImage || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: bathroomImage, prompt' },
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

    const visualizationRequest: VisualizationRequest = {
      bathroomImage,
      inspirationImage,
      prompt
    };

    const result = await generateVisualization({ apiKey }, visualizationRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Visualization generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: `Failed to generate visualization: ${errorMessage}` },
      { status: 500 }
    );
  }
}
