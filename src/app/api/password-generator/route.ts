import { NextRequest, NextResponse } from 'next/server';

interface CharacterOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

interface GeneratePasswordRequest {
  length: number;
  options: CharacterOptions;
}

/**
 * Generate a random password based on the selected options
 */
const generatePassword = (
  length: number,
  options: CharacterOptions
): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = '';
  if (options.uppercase) charset += uppercase;
  if (options.lowercase) charset += lowercase;
  if (options.numbers) charset += numbers;
  if (options.symbols) charset += symbols;

  if (charset === '') return '';

  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
};

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePasswordRequest = await request.json();
    const { length, options } = body;

    // Validate input
    if (!length || typeof length !== 'number' || length < 4 || length > 128) {
      return NextResponse.json(
        { error: 'Invalid length. Must be between 4 and 128.' },
        { status: 400 }
      );
    }

    if (!options || typeof options !== 'object') {
      return NextResponse.json(
        { error: 'Invalid options provided' },
        { status: 400 }
      );
    }

    // Check if at least one character type is selected
    const hasAtLeastOneOption = Object.values(options).some(Boolean);
    if (!hasAtLeastOneOption) {
      return NextResponse.json(
        { error: 'At least one character type must be selected' },
        { status: 400 }
      );
    }

    // Generate 5 passwords
    const passwords: string[] = [];
    for (let i = 0; i < 5; i++) {
      passwords.push(generatePassword(length, options));
    }

    return NextResponse.json({
      success: true,
      passwords,
    });
  } catch (error) {
    console.error('Error in password generator API:', error);
    return NextResponse.json(
      { error: 'Failed to generate passwords' },
      { status: 500 }
    );
  }
}
