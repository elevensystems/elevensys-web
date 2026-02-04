import { NextRequest, NextResponse } from 'next/server';

import { getValidModel } from '@/lib/ai-config';
import {
  badRequest,
  errorResponse,
  forbidden,
  gatewayTimeout,
} from '@/lib/api-helpers';
import { getUserFromSession } from '@/lib/auth';
import { MAX_INPUT_LENGTH } from '@/lib/constants';
import { fetchWithTimeout, TimeoutError } from '@/lib/fetch-with-timeout';
import { requireEnv } from '@/lib/utils';
import type { TranslateRequest } from '@/types/api';

const buildPrompt = (
  input: string,
  directionLabel: string,
  tonesLabel: string
) =>
  `Translate the user input from ${directionLabel}. Apply these tones in order: ${tonesLabel}. Return only the translated text without quotes or extra commentary.\n\nUser input:\n${input}`;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user || (user.role !== 'pro' && user.role !== 'admin')) {
      return forbidden('Pro access required.');
    }

    const body = (await request.json()) as TranslateRequest;
    const input = body.input?.trim();
    const direction = body.direction ?? 'vi-en';
    const tones =
      Array.isArray(body.tones) && body.tones.length > 0
        ? body.tones
        : ['neutral'];
    const model = getValidModel(body.model);

    if (!input) {
      return badRequest('Input text is required.');
    }

    if (input.length > MAX_INPUT_LENGTH) {
      return badRequest(
        `Input text exceeds maximum length of ${MAX_INPUT_LENGTH} characters.`
      );
    }

    const directionLabel =
      direction === 'vi-en'
        ? 'Vietnamese to English'
        : 'English to Vietnamese';
    const tonesLabel = tones.join(', ');

    const systemMessage =
      'You are an expert bilingual translator specializing in high-quality Vietnamese-English and English-Vietnamese translations.';
    const userMessage = buildPrompt(input, directionLabel, tonesLabel);

    const lambdaBase = requireEnv('OPENAI_URL');

    try {
      const response = await fetchWithTimeout(lambdaBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: 'system',
              content: systemMessage,
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 1,
          store: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Translation service error:', {
          status: response.status,
          error: data?.error,
        });
        return errorResponse(
          data?.error || 'Translation service error.',
          response.status
        );
      }

      const outputText = data?.output_text || data?.data?.output_text || '';

      if (!outputText) {
        throw new Error('Empty translation response');
      }

      return NextResponse.json({ outputText });
    } catch (fetchError) {
      if (fetchError instanceof TimeoutError) {
        console.error('Translation request timeout');
        return gatewayTimeout(
          'Translation request timed out. Please try again.'
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error(
      'Translation error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return errorResponse('Failed to translate. Please try again later.', 500);
  }
}
