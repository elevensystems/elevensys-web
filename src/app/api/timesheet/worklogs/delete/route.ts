import { NextRequest, NextResponse } from 'next/server';

const DELETE_API_BASE_URL =
  'https://api.elevensys.dev/timesheet/project-worklogs';

interface DeleteWorklogRequest {
  issueId: number;
  timesheetId: number;
  jiraInstance: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const body: DeleteWorklogRequest = await request.json();
    const { issueId, timesheetId, jiraInstance } = body;

    if (!authHeader || !issueId || !timesheetId || !jiraInstance) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, issueId, timesheetId, jiraInstance',
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
          Authorization: authHeader,
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
