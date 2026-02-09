import { NextRequest, NextResponse } from 'next/server';

const PROJECTS_API_URL = 'https://api.elevensys.dev/timesheet/projects';

export async function GET(request: NextRequest) {
  try {
    const jiraInstance =
      request.nextUrl.searchParams.get('jiraInstance') || 'jiradc';

    const authHeader = request.headers.get('Authorization') || '';
    const params = new URLSearchParams({ jiraInstance });

    const response = await fetch(`${PROJECTS_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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

    const result = await response.json();

    if (result.success && Array.isArray(result.data)) {
      const projects = result.data.map(
        (p: { id: string; key: string; name: string }) => ({
          id: p.id,
          key: p.key,
          name: p.name,
        })
      );
      return NextResponse.json({ success: true, data: projects });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
