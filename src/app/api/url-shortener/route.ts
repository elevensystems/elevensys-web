import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalUrl } = body;

    // Validate input
    if (!originalUrl || typeof originalUrl !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Call external API
    const response = await fetch('https://api.urlify.cc/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalUrl: originalUrl.trim(),
      }),
    });

    if (!response.ok) {
      throw new Error('External API request failed');
    }

    const result = await response.json();

    // Return the result to client
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in URL shortener API:', error);
    return NextResponse.json(
      { error: 'Failed to shorten URL' },
      { status: 500 }
    );
  }
}
