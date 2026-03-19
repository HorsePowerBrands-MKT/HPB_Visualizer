import { NextRequest, NextResponse } from 'next/server';
import { deleteImage } from '@repo/api-handlers/storage';
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

  if (!expiredRows || expiredRows.length === 0) {
    return NextResponse.json({ cleaned: 0 });
  }

  let deletedCount = 0;
  const failedIds: string[] = [];

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

  console.log(`[CLEANUP] Cleaned ${deletedCount}/${expiredRows.length} expired images`);

  return NextResponse.json({
    cleaned: deletedCount,
    failed: failedIds.length,
    remaining: expiredRows.length === BATCH_SIZE,
  });
}
