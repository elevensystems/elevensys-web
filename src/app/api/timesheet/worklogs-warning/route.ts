import { NextRequest, NextResponse } from 'next/server';

const WORKLOGS_WARNING_API_URL =
  'https://api.elevensys.dev/timesheet/project-worklogs-warning';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, pid, startDate, endDate, jiraInstance } = body;

    if (!token || !pid || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: token, pid, startDate, endDate' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      jiraInstance: jiraInstance || 'jiradc',
    });

    const response = await fetch(
      `${WORKLOGS_WARNING_API_URL}?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pid, startDate, endDate }),
      }
    );

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
