import { NextRequest, NextResponse } from 'next/server';

import type { LogWorkRequest } from '@/types/timesheet';

const LOG_WORK_API_URL = 'https://api.elevensys.dev/timesheet/logwork';

export async function POST(request: NextRequest) {
  try {
    const body: LogWorkRequest = await request.json();
    const { token, worklog, jiraInstance } = body;

    if (!token || !worklog || !jiraInstance) {
      return NextResponse.json(
        { error: 'Missing required fields: token, worklog, and jiraInstance' },
        { status: 400 }
      );
    }

    if (!worklog.issueKey || !worklog.username || !worklog.startDate) {
      return NextResponse.json(
        { error: 'Missing required worklog fields' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(`${LOG_WORK_API_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(worklog),
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
