import { NextRequest, NextResponse } from 'next/server';
import { createIssueReport } from '@repo/api-handlers/supabase';
import type { IssueReport } from '@repo/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.sessionId || !body.issueMessage) {
      return NextResponse.json(
        { error: 'Session ID and issue message are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[REPORT-ISSUE API] Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const issueData: IssueReport = {
      sessionId: body.sessionId,
      issueMessage: body.issueMessage,
      visualizationImageUrl: body.visualizationImageUrl,
      team: body.team || null,
    };

    const result = await createIssueReport(
      { url: supabaseUrl, serviceKey: supabaseKey },
      issueData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[REPORT-ISSUE API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while reporting the issue';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
