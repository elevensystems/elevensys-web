import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_HOST =
  'https://aiportalapi.stu-platform.live/use/chat/completions';
const OPENAI_API_KEY = 'Bearer sk-2LQ3zHN989dyBkpD7zIx7Q';
const OPENAI_API_MODEL = 'GPT-5-nano';

interface MoodRequest {
  action: 'detect-language' | 'recommend-songs';
  mood?: string;
  language?: string;
  genres?: string[];
  excludedSongs?: string[];
}

interface Message {
  role: 'system' | 'user';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MoodRequest = await request.json();
    const { action, mood, language, genres, excludedSongs } = body;

    if (action === 'detect-language') {
      if (!mood) {
        return NextResponse.json(
          { error: 'Mood is required for language detection' },
          { status: 400 }
        );
      }

      const messages: Message[] = [
        {
          role: 'system',
          content:
            'You are a language detector. Respond with only the ISO 639-1 language code (e.g., "en", "vi", "ja", "es"). No explanation, just the code.',
        },
        {
          role: 'user',
          content: `What language is this text in? "${mood}"`,
        },
      ];

      try {
        const response = await fetch(OPENAI_API_HOST, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: OPENAI_API_KEY,
          },
          body: JSON.stringify({
            model: OPENAI_API_MODEL,
            messages,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            'OpenAI API error (detect-language):',
            response.status,
            errorText
          );
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const detectedLanguage =
          data.choices[0]?.message?.content?.trim() || 'en';

        return NextResponse.json({ language: detectedLanguage });
      } catch (error) {
        console.error('Language detection error:', error);
        // Default to English if detection fails
        return NextResponse.json({ language: 'en' });
      }
    }

    if (action === 'recommend-songs') {
      if (!mood) {
        return NextResponse.json(
          { error: 'Mood is required for song recommendations' },
          { status: 400 }
        );
      }

      const genresStr =
        genres && genres.length > 0 ? genres.join(', ') : 'any genre';
      const excludeStr =
        excludedSongs && excludedSongs.length > 0
          ? `\n\nExclude these songs that were already recommended:\n${excludedSongs.join(', ')}`
          : '';

      const systemPrompt =
        language === 'vi'
          ? `Bạn là một chuyên gia âm nhạc. Đề xuất 5 bài hát phù hợp với tâm trạng người dùng. ${
              genres && genres.length > 0
                ? `Chỉ gợi ý bài hát thuộc thể loại: ${genresStr}.`
                : 'Gợi ý bài hát thuộc bất kỳ thể loại nào.'
            }

Trả về trong định dạng JSON như sau:
{
  "songs": [
    {"title": "Tên bài hát", "artist": "Tên ca sĩ", "reason": "Lý do ngắn gọn"},
    ...
  ]
}

Chỉ trả về JSON thuần túy, không có markdown hoặc giải thích thêm.${excludeStr}`
          : `You are a music expert. Recommend 5 songs that match the user's mood. ${
              genres && genres.length > 0
                ? `Only recommend songs from these genres: ${genresStr}.`
                : 'Recommend songs from any genre.'
            }

Return in this JSON format:
{
  "songs": [
    {"title": "Song Title", "artist": "Artist Name", "reason": "Brief reason"},
    ...
  ]
}

Return only pure JSON, no markdown or explanations.${excludeStr}`;

      const messages: Message[] = [
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
        const response = await fetch(OPENAI_API_HOST, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: OPENAI_API_KEY,
          },
          body: JSON.stringify({
            model: OPENAI_API_MODEL,
            messages,
            temperature: 0.8,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            'OpenAI API error (recommend-songs):',
            response.status,
            errorText
          );
          return NextResponse.json(
            { error: `AI service error: ${response.status}` },
            { status: 502 }
          );
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content?.trim() || '';

        if (!content) {
          console.error('Empty response from OpenAI');
          return NextResponse.json(
            { error: 'Received empty response from AI service' },
            { status: 502 }
          );
        }

        // Clean markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');

        try {
          const parsedData = JSON.parse(content);

          // Validate response structure
          if (!parsedData.songs || !Array.isArray(parsedData.songs)) {
            console.error('Invalid response structure:', parsedData);
            return NextResponse.json(
              { error: 'Invalid response format from AI service' },
              { status: 502 }
            );
          }

          return NextResponse.json(parsedData);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Raw content:', content);
          return NextResponse.json(
            { error: 'Failed to parse AI response' },
            { status: 502 }
          );
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        return NextResponse.json(
          { error: 'Failed to connect to AI service' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Song Recommender API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process request', details: errorMessage },
      { status: 500 }
    );
  }
}
