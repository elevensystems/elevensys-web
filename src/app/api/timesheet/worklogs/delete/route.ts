import { NextRequest, NextResponse } from 'next/server';

const DELETE_API_BASE_URL =
  'https://api.elevensys.dev/timesheet/project-worklogs';

interface DeleteWorklogRequest {
  token: string;
  issueId: number;
  timesheetId: number;
  jiraInstance: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DeleteWorklogRequest = await request.json();
    const { token, issueId, timesheetId, jiraInstance } = body;

    if (!token || !issueId || !timesheetId || !jiraInstance) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: token, issueId, timesheetId, jiraInstance',
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(
      `${DELETE_API_BASE_URL}/${issueId}/${timesheetId}?${params.toString()}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || `API error: ${response.status}` },
        { status: response.status }
      );
    }

    // Some DELETE endpoints return 204 No Content
    if (response.status === 204) {
      return NextResponse.json({ success: true });
    }

    const data = await response.json().catch(() => ({ success: true }));
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
