import { NextRequest, NextResponse } from 'next/server';

import { sanitizeErrorText } from '@/lib/fetch-utils';

const ISSUE_API_URL = 'https://api.elevensys.dev/timesheet/issue';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const authHeader = request.headers.get('Authorization') || '';
    const body = await request.json();
    const { jiraInstance } = body;

    if (!authHeader || !jiraInstance) {
      return NextResponse.json(
        {
          error: 'Missing required fields: Authorization header, jiraInstance',
        },
        { status: 400 }
      );
    }

    const queryParams = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${ISSUE_API_URL}/${issueId}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: sanitizeErrorText(errorText, response.status) },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
