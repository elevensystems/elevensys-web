import { NextRequest, NextResponse } from 'next/server';

import type { LogWorkRequest } from '@/types/timesheet';

export async function POST(request: NextRequest) {
  try {
    const body: LogWorkRequest = await request.json();
    const { baseUrl, token, worklog } = body;

    if (!baseUrl || !token || !worklog) {
      return NextResponse.json(
        { error: 'Missing required fields: baseUrl, token, and worklog' },
        { status: 400 }
      );
    }

    if (!worklog.issueKey || !worklog.username || !worklog.startDate) {
      return NextResponse.json(
        { error: 'Missing required worklog fields' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(
      `${baseUrl}/rest/tempo/1.0/log-work/create-log-work`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(worklog),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || `Jira API error: ${response.status}` },
        { status: response.status }
      );
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
