import { NextRequest, NextResponse } from 'next/server';

import type { FetchWorklogsRequest } from '@/types/timesheet';

const WORKLOGS_API_URL = 'https://api.elevensys.dev/timesheet/worklogs';

export async function POST(request: NextRequest) {
  try {
    const body: FetchWorklogsRequest = await request.json();
    const { baseUrl, token, username, fromDate, toDate } = body;

    if (!baseUrl || !token || !username || !fromDate || !toDate) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: baseUrl, token, username, fromDate, toDate',
        },
        { status: 400 }
      );
    }

    // Extract jiraInstance from baseUrl (e.g., "https://insight.fsoft.com.vn/jiradc" → "jiradc")
    const jiraInstance = baseUrl.split('/').pop() || 'jiradc';

    const params = new URLSearchParams({
      fromDate,
      toDate,
      user: username,
      jiraInstance,
    });

    const response = await fetch(`${WORKLOGS_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || `API error: ${response.status}` },
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
