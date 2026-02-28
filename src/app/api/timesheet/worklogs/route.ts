import { NextRequest, NextResponse } from 'next/server';

import type { FetchWorklogsRequest } from '@/types/timesheet';

const WORKLOGS_API_URL = 'https://api.elevensys.dev/timesheet/worklogs';
const PROJECT_WORKLOGS_API_URL =
  'https://api.elevensys.dev/timesheet/project-worklogs';
const PROJECT_WORKLOGS_PAGINATION_API_URL =
  'https://api.elevensys.dev/timesheet/project-worklogs/pagination';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const { searchParams } = request.nextUrl;

    const projectKey = searchParams.get('projectKey');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const jiraInstance = searchParams.get('jiraInstance');

    if (!authHeader || !projectKey || !fromDate || !toDate || !jiraInstance) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, projectKey, fromDate, toDate, jiraInstance',
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      projectKey,
      fromDate,
      toDate,
      jiraInstance,
    });

    // Forward any additional query params (e.g. username, statusWorklog, etc.)
    for (const [key, value] of searchParams.entries()) {
      if (!['projectKey', 'fromDate', 'toDate', 'jiraInstance'].includes(key)) {
        params.set(key, value);
      }
    }

    const queryString = params.toString();
    const headers = { Authorization: authHeader };

    const [worklogsResponse, paginationResponse] = await Promise.all([
      fetch(`${PROJECT_WORKLOGS_API_URL}?${queryString}`, { headers }),
      fetch(`${PROJECT_WORKLOGS_PAGINATION_API_URL}?${queryString}`, {
        headers,
      }),
    ]);

    if (!worklogsResponse.ok) {
      const errorText = await worklogsResponse.text();
      return NextResponse.json(
        {
          error:
            errorText ||
            `Project worklogs API error: ${worklogsResponse.status}`,
        },
        { status: worklogsResponse.status }
      );
    }

    if (!paginationResponse.ok) {
      const errorText = await paginationResponse.text();
      return NextResponse.json(
        {
          error:
            errorText || `Pagination API error: ${paginationResponse.status}`,
        },
        { status: paginationResponse.status }
      );
    }

    const [worklogsData, paginationData] = await Promise.all([
      worklogsResponse.json(),
      paginationResponse.json(),
    ]);
    console.log('Fetched project worklogs:', { worklogsData, paginationData });
    return NextResponse.json({
      success: true,
      data: {
        rows: worklogsData.data ?? worklogsData,
        ...(paginationData.data ?? paginationData),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const body: FetchWorklogsRequest = await request.json();
    const { username, fromDate, toDate, jiraInstance } = body;

    if (!authHeader || !username || !fromDate || !toDate || !jiraInstance) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: Authorization header, username, fromDate, toDate, jiraInstance',
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
