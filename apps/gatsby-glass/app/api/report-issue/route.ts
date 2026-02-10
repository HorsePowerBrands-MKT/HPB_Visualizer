import { NextRequest, NextResponse } from 'next/server';
import { reportIssue } from '@repo/api-handlers/supabase';
import type { IssueReport } from '@repo/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.sessionId || !body.issueMessage) {
      return NextResponse.json(
        { error: 'Session ID and issue message are required' },
        { status: 400 }
      );
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const issueData: IssueReport = {
      sessionId: body.sessionId,
      issueMessage: body.issueMessage
    };

    const result = await reportIssue(
      { url: supabaseUrl, serviceKey: supabaseKey },
      issueData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Issue report error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while reporting the issue';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
