import { NextRequest, NextResponse } from 'next/server';

import { getValidModel } from '@/lib/ai-config';
import {
  badGateway,
  badRequest,
  errorResponse,
  gatewayTimeout,
  getErrorMessage,
  serviceUnavailable,
} from '@/lib/api-helpers';
import { fetchWithTimeout, TimeoutError } from '@/lib/fetch-with-timeout';
import { requireEnv } from '@/lib/utils';
import type { AiMessage, SongRecommenderRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body: SongRecommenderRequest = await request.json();
    const { action, mood, language, genres, excludedSongs } = body;

    const lambdaBase = requireEnv('OPENAI_URL');
    const model = getValidModel(body.model);

    if (action === 'recommend-songs') {
      if (!mood) {
        return badRequest('Mood is required for song recommendations');
      }

      const genresStr =
        genres && genres.length > 0 ? genres.join(', ') : 'any genre';
      const excludeStr =
        excludedSongs && excludedSongs.length > 0
          ? `\n\nExclude these songs that were already recommended:\n${excludedSongs.join(', ')}`
          : '';

      const languageLine = language
        ? `Write the "reason" field in ${language}.`
        : 'Write the "reason" field in English.';

      const systemPrompt = `You are a music expert. Recommend exactly 5 songs that match the user's mood. ${
        genres && genres.length > 0
          ? `Only recommend songs from these genres: ${genresStr}.`
          : 'Recommend songs from any genre.'
      }
Avoid duplicates, keep the list diverse (different artists when possible), and keep each reason to one short sentence. ${languageLine}

Return in this JSON format:
{
  "songs": [
    {"title": "Song Title", "artist": "Artist Name", "reason": "Brief reason"}
  ]
}

Return only pure JSON, no markdown or explanations.${excludeStr}`;

      const messages: AiMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: mood,
        },
      ];

      try {
        const response = await fetchWithTimeout(lambdaBase, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            input: messages,
            temperature: 1,
            store: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            'OpenAI API error (recommend-songs):',
            response.status,
            errorText
          );
          return badGateway(`AI service error: ${response.status}`);
        }

        const data = await response.json();
        const content =
          data?.output_text?.trim() || data?.data?.output_text?.trim() || '';

        if (!content) {
          console.error('Empty response from OpenAI');
          return badGateway('Received empty response from AI service');
        }
        console.log('Raw AI response content:', content);

        try {
          const parsedData = JSON.parse(content);

          if (!parsedData.songs || !Array.isArray(parsedData.songs)) {
            console.error('Invalid response structure:', parsedData);
            return badGateway('Invalid response format from AI service');
          }

          return NextResponse.json(parsedData);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Raw content:', content);
          return badGateway('Failed to parse AI response');
        }
      } catch (fetchError) {
        if (fetchError instanceof TimeoutError) {
          console.error('Recommend songs request timeout');
          return gatewayTimeout('AI request timed out. Please try again.');
        }
        console.error('Fetch error:', fetchError);
        return serviceUnavailable('Failed to connect to AI service');
      }
    }

    return badRequest('Invalid action');
  } catch (error) {
    console.error('Song Recommender API error:', error);
    return errorResponse(
      'Failed to process request',
      500,
      getErrorMessage(error)
    );
  }
}
