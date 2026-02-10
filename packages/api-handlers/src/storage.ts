import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  serviceKey: string;
}

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize or get Supabase client
 */
function getSupabaseClient(config: SupabaseConfig): SupabaseClient {
  if (!config.url || !config.serviceKey) {
    throw new Error('Supabase URL and service key are required');
  }

  // Reuse client if already initialized
  if (!supabaseClient) {
    supabaseClient = createClient(config.url, config.serviceKey);
  }

  return supabaseClient;
}

/**
 * Upload an image to Supabase Storage
 * @param config - Supabase configuration
 * @param imageData - Base64 data URL or blob data
 * @param fileName - Name for the file (will be prefixed with timestamp)
 * @param bucket - Storage bucket name (default: 'visualizations')
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(
  config: SupabaseConfig,
  imageData: string,
  fileName: string,
  bucket: string = 'visualizations'
): Promise<string> {
  const supabase = getSupabaseClient(config);

  // Convert base64 data URL to blob
  let blob: Blob;
  
  if (imageData.startsWith('data:')) {
    // Extract base64 data from data URL
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.match(/data:([^;]+);/)?.[1] || 'image/png';
    
    // Convert base64 to binary
    const binaryString = Buffer.from(base64Data, 'base64');
    blob = new Blob([binaryString], { type: mimeType });
  } else if (imageData.startsWith('blob:')) {
    // For blob URLs, we can't upload directly - need the actual file
    throw new Error('Blob URLs cannot be uploaded directly. Please provide base64 data or File object.');
  } else {
    throw new Error('Unsupported image format. Expected base64 data URL.');
  }

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${timestamp}_${sanitizedFileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, blob, {
      contentType: blob.type,
      upsert: false
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return publicUrlData.publicUrl;
}

/**
 * Delete an image from Supabase Storage
 * @param config - Supabase configuration
 * @param url - Public URL of the image to delete
 * @param bucket - Storage bucket name (default: 'visualizations')
 */
export async function deleteImage(
  config: SupabaseConfig,
  url: string,
  bucket: string = 'visualizations'
): Promise<void> {
  const supabase = getSupabaseClient(config);

  // Extract file path from URL
  const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
  if (urlParts.length !== 2) {
    throw new Error('Invalid storage URL format');
  }
  
  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error('Storage delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * List all images in a bucket
 * @param config - Supabase configuration
 * @param bucket - Storage bucket name (default: 'visualizations')
 * @param limit - Maximum number of files to return
 */
export async function listImages(
  config: SupabaseConfig,
  bucket: string = 'visualizations',
  limit: number = 100
): Promise<string[]> {
  const supabase = getSupabaseClient(config);

  const { data, error } = await supabase.storage
    .from(bucket)
    .list('', {
      limit,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) {
    console.error('Storage list error:', error);
    throw new Error(`Failed to list images: ${error.message}`);
  }

  // Convert to public URLs
  return data.map(file => {
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(file.name);
    return publicUrlData.publicUrl;
  });
}
