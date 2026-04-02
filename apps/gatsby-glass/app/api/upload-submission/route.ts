import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@repo/api-handlers/storage';
import { createSubmission, updateSubmissionGeneratedImage, logApiCall } from '@repo/api-handlers/supabase';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BASE64_LENGTH = 15_000_000; // ~10 MB decoded
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

function isAllowedStorageUrl(url: string, supabaseUrl: string): boolean {
  try {
    const parsed = new URL(url);
    const expected = new URL(supabaseUrl);
    return parsed.hostname === expected.hostname && parsed.pathname.includes('/storage/v1/object/public/');
  } catch {
    return false;
  }
}

/**
 * POST: Upload an original photo and create a visualizer_submissions row.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { imageData, uploadConsent, marketingConsent, metadata, sourceUrl } = body;

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json({ error: 'imageData is required' }, { status: 400 });
    }
    if (uploadConsent !== true) {
      return NextResponse.json({ error: 'Upload consent is required' }, { status: 400 });
    }

    // Validate base64 data URL format and MIME type
    if (!imageData.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid image format: expected base64 data URL' }, { status: 400 });
    }
    const mimeMatch = imageData.match(/^data:([^;]+);base64,/);
    if (!mimeMatch || !ALLOWED_MIME_TYPES.includes(mimeMatch[1])) {
      return NextResponse.json({ error: 'Invalid image type: only JPEG, PNG, and WebP are accepted' }, { status: 400 });
    }
    if (imageData.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 });
    }

    const sbConfig = getSupabaseConfig();
    if (!sbConfig) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const fileName = `upload_${Date.now()}.png`;
    const originalPhotoPath = await uploadImage(
      sbConfig,
      imageData,
      fileName,
      'visualizer-uploads'
    );

    // Sanitize metadata: only allow known string keys, drop anything unexpected
    const safeMeta: Record<string, string | null> = {};
    const allowedMetaKeys = ['mode', 'enclosureType', 'framingStyle', 'hardwareFinish', 'handleStyle', 'showerShape'];
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      for (const key of allowedMetaKeys) {
        if (key in metadata) {
          const val = metadata[key];
          safeMeta[key] = typeof val === 'string' ? val.slice(0, 100) : null;
        }
      }
    }

    const { id: submissionId } = await createSubmission(sbConfig, {
      originalPhotoPath,
      uploadConsent: true,
      marketingConsent: !!marketingConsent,
      sourceUrl: typeof sourceUrl === 'string' ? sourceUrl.slice(0, 500) : null,
      metadata: safeMeta,
    });

    logApiCall(sbConfig, 'image_upload');

    return NextResponse.json({ submissionId });
  } catch (error) {
    console.error('[UPLOAD-SUBMISSION] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update an existing submission with the generated image path.
 * Only accepts URLs pointing to our own Supabase storage.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, generatedImageUrl } = body;

    if (!submissionId || typeof submissionId !== 'string' || !UUID_RE.test(submissionId)) {
      return NextResponse.json({ error: 'Valid submissionId is required' }, { status: 400 });
    }
    if (!generatedImageUrl || typeof generatedImageUrl !== 'string') {
      return NextResponse.json({ error: 'generatedImageUrl is required' }, { status: 400 });
    }

    const sbConfig = getSupabaseConfig();
    if (!sbConfig) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Only accept URLs from our own Supabase storage
    if (!isAllowedStorageUrl(generatedImageUrl, sbConfig.url)) {
      return NextResponse.json({ error: 'Invalid image URL origin' }, { status: 400 });
    }

    await updateSubmissionGeneratedImage(sbConfig, submissionId, generatedImageUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[UPLOAD-SUBMISSION] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}
