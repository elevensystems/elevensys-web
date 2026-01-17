import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalUrl } = body;
    const apiUrl = process.env.URL_SHORTENER_API;

    // Validate input
    if (!originalUrl || typeof originalUrl !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    if (!apiUrl) {
      console.error('Missing URL_SHORTENER_API environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Call external API
    const response = await fetch(apiUrl, {
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

    return NextResponse.json({
      shortUrl: result.data.shortUrl,
      shortCode:
        result.data.shortCode || result.data.shortUrl?.split('/').pop(),
    });
  } catch (error) {
    console.error('Error in URL shortener API:', error);
    return NextResponse.json(
      { error: 'Failed to shorten URL' },
      { status: 500 }
    );
  }
}
