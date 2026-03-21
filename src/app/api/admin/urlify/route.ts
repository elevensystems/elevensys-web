import { NextRequest, NextResponse } from 'next/server';

import { URLIFY_URLS } from '@/lib/api-urls';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = searchParams.get('limit') || '20';
    const lastKey = searchParams.get('lastKey');

    const params = new URLSearchParams({ limit });
    if (lastKey) params.set('lastKey', lastKey);

    const response = await fetch(
      `${URLIFY_URLS.URLS}?${params.toString()}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching URLs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch URLs' },
      { status: 500 }
    );
  }
}
