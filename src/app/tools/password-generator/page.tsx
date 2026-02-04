'use client';

import { useCallback, useMemo, useState } from 'react';

import { Check, Copy, Key, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const COPY_FEEDBACK_DURATION = 2000;

interface CharacterOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

interface PasswordEntry {
  id: string;
  value: string;
}

/**
 * Calculate password strength based on length and character variety
 */
const calculatePasswordStrength = (
  password: string,
  options: CharacterOptions
): { label: string; color: string } => {
  if (!password) return { label: '', color: '' };

  let score = 0;
  const length = password.length;

  // Length scoring
  if (length >= 8) score += 1;
  if (length >= 12) score += 1;
  if (length >= 16) score += 1;

  // Character variety scoring
  const varietyCount = Object.values(options).filter(Boolean).length;
  score += varietyCount;

  // Determine strength
  if (score <= 2) return { label: 'Weak', color: 'text-red-500' };
  if (score <= 4) return { label: 'Medium', color: 'text-yellow-500' };
  return { label: 'Strong', color: 'text-green-500' };
};

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(15);
  const [options, setOptions] = useState<CharacterOptions>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const createPasswordEntries = useCallback((values: string[]) => {
    return values.map(value => ({
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      value,
    }));
  }, []);

  const handleGeneratePasswords = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setCopiedId(null);

    try {
      const response = await fetch('/api/password-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          length,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate passwords');
      }

      const result = await response.json();

      if (result.success && result.passwords) {
        setPasswords(createPasswordEntries(result.passwords));
        toast.success('Passwords generated successfully', {
          description: `Passwords (${result.passwords.length}) have been generated.`,
          icon: <Check className='h-4 w-4' />,
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error generating passwords:', err);
      const errorMessage = 'Failed to generate passwords. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [createPasswordEntries, length, options]);

  const handleCopy = useCallback(async (password: string, id: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), COPY_FEEDBACK_DURATION);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  const toggleOption = useCallback((key: keyof CharacterOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const hasAtLeastOneOption = useMemo(() => {
    return Object.values(options).some(Boolean);
  }, [options]);

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto'>
          <ToolPageHeader
            title='Password Generator'
            description='Generate secure, random passwords with customizable options. Free tool for creating strong passwords.'
            infoMessage='Password generation is processed securely on the server. Passwords are not stored and are generated fresh each time.'
            error={error}
          />

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <SettingsIcon className='h-5 w-5' />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Password Length */}
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='length-input'>
                      Password Length: {length}
                    </Label>
                    <Input
                      id='length-input'
                      type='number'
                      min='4'
                      max='128'
                      value={length}
                      onChange={e =>
                        setLength(
                          Math.min(128, Math.max(4, Number(e.target.value)))
                        )
                      }
                      className='w-20 h-9'
                    />
                  </div>
                  <Slider
                    id='length'
                    min={4}
                    max={128}
                    step={1}
                    value={[length]}
                    onValueChange={values => setLength(values[0])}
                    className='w-full'
                  />
                </div>

                {/* Character Types */}
                <div className='space-y-3'>
                  <Label>Character Types</Label>
                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <Checkbox
                        checked={options.uppercase}
                        onCheckedChange={() => toggleOption('uppercase')}
                      />
                      <span className='text-sm'>Uppercase Letters (A-Z)</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <Checkbox
                        checked={options.lowercase}
                        onCheckedChange={() => toggleOption('lowercase')}
                      />
                      <span className='text-sm'>Lowercase Letters (a-z)</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <Checkbox
                        checked={options.numbers}
                        onCheckedChange={() => toggleOption('numbers')}
                      />
                      <span className='text-sm'>Numbers (0-9)</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <Checkbox
                        checked={options.symbols}
                        onCheckedChange={() => toggleOption('symbols')}
                      />
                      <span className='text-sm'>
                        Special Symbols (!@#$%^&*)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGeneratePasswords}
                  disabled={!hasAtLeastOneOption || isLoading}
                  className='w-full'
                  size='lg'
                >
                  <Key className='h-4 w-4 mr-2' />
                  {isLoading ? 'Generating...' : 'Generate Passwords'}
                </Button>
                <p className='text-xs text-muted-foreground text-center'>
                  Generates 5 unique passwords
                </p>
              </CardContent>
            </Card>

            {/* Result Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Key className='h-5 w-5' />
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {passwords.length === 0 ? (
                  <div className='flex items-center justify-center h-40 text-muted-foreground'>
                    <p>Click "Generate Passwords" to create 5 passwords</p>
                  </div>
                ) : (
                  passwords.map((password, index) => {
                    const strength = calculatePasswordStrength(
                      password.value,
                      options
                    );
                    return (
                      <div key={password.id} className='space-y-2'>
                        <Label className='text-xs text-muted-foreground'>
                          Password {index + 1}
                        </Label>
                        {index === 0 && (
                          <div className='flex items-center justify-between mb-1'>
                            <Label className='text-sm font-medium'>
                              Password Strength
                            </Label>
                            <span
                              className={`text-sm font-semibold ${strength.color}`}
                            >
                              {strength.label}
                            </span>
                          </div>
                        )}
                        <div className='flex items-center gap-2 p-3 bg-muted rounded-lg'>
                          <code className='flex-1 text-sm font-mono break-all select-all'>
                            {password.value}
                          </code>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() =>
                              handleCopy(password.value, password.id)
                            }
                            aria-label={
                              copiedId === password.id
                                ? 'Copied to clipboard'
                                : 'Copy to clipboard'
                            }
                          >
                            {copiedId === password.id ? (
                              <Check className='h-4 w-4' aria-hidden='true' />
                            ) : (
                              <Copy className='h-4 w-4' aria-hidden='true' />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
