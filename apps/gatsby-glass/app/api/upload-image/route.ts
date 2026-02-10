import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@repo/api-handlers/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[UPLOAD-IMAGE API] Request received');
    
    // Validate required fields
    if (!body.imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    if (!body.fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[UPLOAD-IMAGE API] Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('[UPLOAD-IMAGE API] Uploading image:', body.fileName);

    // Upload to Supabase Storage
    const publicUrl = await uploadImage(
      { url: supabaseUrl, serviceKey: supabaseKey },
      body.imageData,
      body.fileName,
      body.bucket || 'visualizations'
    );

    console.log('[UPLOAD-IMAGE API] Upload successful:', publicUrl);

    return NextResponse.json({ 
      success: true,
      url: publicUrl 
    });
  } catch (error) {
    console.error('[UPLOAD-IMAGE API] Upload error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred while uploading image' 
      },
      { status: 500 }
    );
  }
}
