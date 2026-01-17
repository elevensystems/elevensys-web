import { NextRequest, NextResponse } from 'next/server';

import { getUserFromSession } from '@/lib/auth';
import { requireEnv } from '@/lib/utils';

interface TranslateRequestBody {
  input?: string;
  direction?: 'vi-en' | 'en-vi';
  tones?: string[];
  model?: string;
}

const DEFAULT_MODEL = 'gpt-5-nano';
const MODEL_ALLOWLIST = new Set(['gpt-5', 'gpt-5-mini', 'gpt-5-nano']);

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
      return NextResponse.json(
        { error: 'Pro access required.' },
        { status: 403 }
      );
    }
    const body = (await request.json()) as TranslateRequestBody;
    const input = body.input?.trim();
    const direction = body.direction ?? 'vi-en';
    const tones =
      Array.isArray(body.tones) && body.tones.length > 0
        ? body.tones
        : ['neutral'];
    const model = MODEL_ALLOWLIST.has(body.model ?? '')
      ? (body.model as string)
      : DEFAULT_MODEL;

    if (!input) {
      return NextResponse.json(
        { error: 'Input text is required.' },
        { status: 400 }
      );
    }

    const directionLabel =
      direction === 'vi-en' ? 'Vietnamese to English' : 'English to Vietnamese';
    const tonesLabel = tones.join(', ');

    const systemMessage =
      'You are an expert bilingual translator specializing in high-quality Vietnamese-English and English-Vietnamese translations.';
    const userMessage = buildPrompt(input, directionLabel, tonesLabel);

    const lambdaBase = requireEnv('OPENAI_URL');
    const response = await fetch(lambdaBase, {
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
        // max_output_tokens: 1000,
        store: true,
      }),
    });

    const data = await response.json();
    console.log('Translate API response status:', {
      userMessage,
      data,
      dataOutput: data?.data?.output,
      outputText: data?.data?.output_text,
    });
    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.error || 'Translation service error.',
          details: data?.details ?? null,
        },
        { status: response.status }
      );
    }

    const outputText = data?.output_text || data?.data?.output_text || '';

    return NextResponse.json({ outputText });
  } catch (error) {
    console.error('Translate API error:', error);
    return NextResponse.json(
      { error: 'Failed to translate. Please try again later.' },
      { status: 500 }
    );
  }
}
