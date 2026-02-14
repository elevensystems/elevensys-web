import { NextRequest, NextResponse } from 'next/server';

import { requireEnv } from '@/lib/utils';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;
    const baseUrl = requireEnv('API_BASE_URL');

    const response = await fetch(`${baseUrl}/urlify/url/${shortCode}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting URL:', error);
    return NextResponse.json(
      { error: 'Failed to delete URL' },
      { status: 500 }
    );
  }
}
