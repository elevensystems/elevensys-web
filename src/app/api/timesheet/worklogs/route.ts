import { NextRequest, NextResponse } from 'next/server';

import type { FetchWorklogsRequest } from '@/types/timesheet';

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

    // Build URL with params + cache buster
    const url = new URL(`${baseUrl}/rest/tempo/1.0/user-worklogs/get-list`);
    url.searchParams.set('fromDate', fromDate);
    url.searchParams.set('toDate', toDate);
    url.searchParams.set('user', username);
    url.searchParams.set('statusWorklog', 'All');
    url.searchParams.set('_', Date.now().toString());

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    const response = await fetch(url.toString(), { headers });
    console.log('response', response);
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || `Jira API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
