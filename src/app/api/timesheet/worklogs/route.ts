import { NextRequest, NextResponse } from 'next/server';

import type { FetchWorklogsRequest } from '@/types/timesheet';

const WORKLOGS_API_URL = 'https://api.elevensys.dev/timesheet/worklogs';

export async function POST(request: NextRequest) {
  try {
    const body: FetchWorklogsRequest = await request.json();
    const { token, username, fromDate, toDate, jiraInstance } = body;

    if (!token || !username || !fromDate || !toDate || !jiraInstance) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: token, username, fromDate, toDate, jiraInstance',
        },
        { status: 400 }
      );
    }

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
