import { NextRequest, NextResponse } from 'next/server';
import { deleteImage } from '@repo/api-handlers/storage';
import { getExpiredSubmissions, deleteSubmissionRows } from '@repo/api-handlers/supabase';
import { createClient } from '@supabase/supabase-js';

const BATCH_SIZE = 50;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const storageConfig = { url: supabaseUrl, serviceKey: supabaseKey };

  // --- Phase 1: Clean expired visualizations (existing behavior) ---
  const { data: expiredRows, error: queryError } = await supabase
    .from('visualizations')
    .select('id, visualization_image_url')
    .not('visualization_image_url', 'is', null)
    .lt('expires_at', new Date().toISOString())
    .limit(BATCH_SIZE);

  if (queryError) {
    console.error('[CLEANUP] Query error:', queryError);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  let deletedCount = 0;
  const failedIds: string[] = [];

  if (expiredRows && expiredRows.length > 0) {
    for (const row of expiredRows) {
      try {
        if (row.visualization_image_url) {
          await deleteImage(storageConfig, row.visualization_image_url);
        }

        await supabase
          .from('visualizations')
          .update({ visualization_image_url: null })
          .eq('id', row.id);

        deletedCount++;
      } catch (err) {
        console.error(`[CLEANUP] Failed to clean row ${row.id}:`, err);
        failedIds.push(row.id);
      }
    }
  }

  // --- Phase 2: Clean expired visualizer_submissions ---
  let submissionsCleaned = 0;
  let submissionsFailed = 0;

  try {
    const expiredSubs = await getExpiredSubmissions(storageConfig, BATCH_SIZE);
    const cleanedIds: string[] = [];

    for (const sub of expiredSubs) {
      try {
        // Delete the original uploaded photo from visualizer-uploads.
        // The generated image lives in the `visualizations` bucket and is
        // already cleaned up by Phase 1 above (same expires_at window),
        // so we only need to remove the original here.
        if (sub.originalPhotoPath) {
          await deleteImage(storageConfig, sub.originalPhotoPath, 'visualizer-uploads');
        }
        cleanedIds.push(sub.id);
        submissionsCleaned++;
      } catch (err) {
        console.error(`[CLEANUP] Failed to clean submission ${sub.id}:`, err);
        submissionsFailed++;
      }
    }

    if (cleanedIds.length > 0) {
      await deleteSubmissionRows(storageConfig, cleanedIds);
    }
  } catch (err) {
    console.error('[CLEANUP] Submissions cleanup error:', err);
  }

  console.log(`[CLEANUP] Visualizations: ${deletedCount} cleaned. Submissions: ${submissionsCleaned} cleaned, ${submissionsFailed} failed.`);

  return NextResponse.json({
    cleaned: deletedCount,
    failed: failedIds.length,
    remaining: (expiredRows?.length ?? 0) === BATCH_SIZE,
    submissions: { cleaned: submissionsCleaned, failed: submissionsFailed },
  });
}
