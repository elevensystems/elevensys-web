import { NextRequest, NextResponse } from 'next/server';

const AUTH_API_URL = 'https://api.elevensys.dev/timesheet/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const jiraInstance =
      request.nextUrl.searchParams.get('jiraInstance') || 'jiradc';

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing required Authorization header' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(`${AUTH_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
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
