'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import ProAccessOnly from '@/components/layouts/pro-access-only';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { hasRole } from '@/lib/utils';

const TONES = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'friendly', label: 'Friendly 😊' },
  { value: 'formal', label: 'Formal' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
];

const MODELS = [
  { value: 'gpt-5', label: 'gpt-5' },
  { value: 'gpt-5-mini', label: 'gpt-5-mini' },
  { value: 'gpt-5-nano', label: 'gpt-5-nano' },
];

const STORAGE_KEY = 'translate-tool-preferences';
const COPY_FEEDBACK_DURATION = 2000;
const MAX_INPUT_LENGTH = 10000;

const PAGE_METADATA = {
  title: 'AI Translator',
  description:
    'Translate between Vietnamese and English with tone control for natural, context-aware results.',
};

const DIRECTION = {
  VI_EN: 'vi-en',
  EN_VI: 'en-vi',
} as const;

type Direction = (typeof DIRECTION)[keyof typeof DIRECTION];

interface Preferences {
  direction: Direction;
  tones: string[];
  model: string;
}

export default function TranslatePage() {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [direction, setDirection] = useState<Direction>(DIRECTION.VI_EN);
  const [tones, setTones] = useState<string[]>(['neutral']);
  const [model, setModel] = useState('gpt-5-nano');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);

  const directionLabel = useMemo(
    () =>
      direction === DIRECTION.VI_EN
        ? '🇻🇳 Vietnamese → 🇺🇸 English'
        : '🇺🇸 English → 🇻🇳 Vietnamese',
    [direction]
  );

  const inputPlaceholder = useMemo(
    () =>
      direction === DIRECTION.VI_EN
        ? 'Enter Vietnamese text...'
        : 'Enter English text...',
    [direction]
  );

  const outputLabel = useMemo(
    () =>
      direction === DIRECTION.VI_EN
        ? 'English Translation'
        : 'Vietnamese Translation',
    [direction]
  );

  const persistPreferences = useCallback((next: Preferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (storageError) {
      console.warn('Failed to persist preferences', storageError);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Preferences>;

      if (
        parsed.direction === DIRECTION.VI_EN ||
        parsed.direction === DIRECTION.EN_VI
      ) {
        setDirection(parsed.direction);
      }

      if (Array.isArray(parsed.tones) && parsed.tones.length > 0) {
        setTones(parsed.tones);
      }

      if (typeof parsed.model === 'string') {
        const nextModel = MODELS.find(item => item.value === parsed.model);
        if (nextModel) {
          setModel(nextModel.value);
        }
      }
    } catch (storageError) {
      console.warn('Failed to read preferences', storageError);
    }
  }, []);

  useEffect(() => {
    persistPreferences({ direction, tones, model });
  }, [direction, tones, model, persistPreferences]);

  const handleSwap = useCallback(() => {
    setDirection(prev =>
      prev === DIRECTION.VI_EN ? DIRECTION.EN_VI : DIRECTION.VI_EN
    );
    setInputText(outputText);
    setOutputText(inputText);

    setTimeout(() => {
      const inputElement = document.getElementById('input-text');
      if (inputElement instanceof HTMLTextAreaElement) {
        inputElement.focus();
      }
    }, 0);
  }, [inputText, outputText]);

  const handleToneToggle = useCallback((tone: string, checked: boolean) => {
    setTones(prev => {
      if (checked) {
        const next = [...prev, tone];
        return next;
      }

      const next = prev.filter(item => item !== tone);
      return next.length === 0 ? prev : next;
    });
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: inputText,
          direction,
          tones,
          model,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Translation failed');
      }

      setOutputText(result?.outputText || '');
    } catch (err) {
      console.error('Translation error:', err);
      setError('Unable to translate right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [direction, inputText, tones, model]);

  const handleCopy = useCallback(async () => {
    if (!outputText) return;

    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
    } catch (err) {
      console.error('Failed to copy translation:', err);
      setError('Failed to copy to clipboard. Please try again.');
    }
  }, [outputText]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleTranslate();
      }
    },
    [handleTranslate]
  );

  const inputCount = inputText.length;

  if (!hasRole(user, ['pro'])) {
    return (
      <ProAccessOnly
        title={PAGE_METADATA.title}
        description={PAGE_METADATA.description}
        toolName={PAGE_METADATA.title}
      />
    );
  }

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto'>
          <ToolPageHeader
            title={PAGE_METADATA.title}
            description={PAGE_METADATA.description}
          />

          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertTitle>Translation failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start'>
            <Card className='lg:sticky lg:top-6'>
              <CardHeader>
                <CardTitle className='flex items-center justify-between py-2'>
                  <span>Input Text</span>
                  <p className='text-sm text-muted-foreground'>
                    {directionLabel}
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-5'>
                <div className='space-y-2'>
                  <Textarea
                    id='input-text'
                    value={inputText}
                    onChange={event => {
                      const newValue = event.target.value;
                      if (newValue.length <= MAX_INPUT_LENGTH) {
                        setInputText(newValue);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={inputPlaceholder}
                    className='min-h-[180px]'
                    disabled={loading}
                    maxLength={MAX_INPUT_LENGTH}
                  />
                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <span>Ctrl + Enter to translate</span>
                    <span
                      className={
                        inputCount > MAX_INPUT_LENGTH * 0.9
                          ? 'text-warning'
                          : ''
                      }
                    >
                      {inputCount} / {MAX_INPUT_LENGTH}
                    </span>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-3'>
                    <Label className='text-base'>Model</Label>
                    <NativeSelect
                      value={model}
                      onChange={event => setModel(event.target.value)}
                      containerClassName='w-full'
                    >
                      {MODELS.map(item => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className='space-y-3'>
                    <Label className='text-base'>Tone & Style</Label>
                    <Dialog
                      open={isToneModalOpen}
                      onOpenChange={setIsToneModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant='outline'
                          className='w-full justify-between hover:bg-accent'
                        >
                          <span className='flex items-center gap-2 text-sm'>
                            <SlidersHorizontal className='h-4 w-4' />
                            {tones.length > 0
                              ? `${tones.length} selected`
                              : 'Select tones'}
                          </span>
                          <ChevronDown className='h-4 w-4' />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='max-w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[85vh]'>
                        <DialogHeader>
                          <DialogTitle className='flex items-center gap-2'>
                            <SlidersHorizontal className='h-5 w-5' />
                            Select Tone & Style
                          </DialogTitle>
                        </DialogHeader>
                        <div className='overflow-y-auto max-h-[60vh] pr-2'>
                          <div className='flex flex-wrap gap-2'>
                            {TONES.map(tone => {
                              const checked = tones.includes(tone.value);
                              return (
                                <Badge
                                  key={tone.value}
                                  variant={checked ? 'default' : 'outline'}
                                  className='cursor-pointer transition-all hover:scale-105 text-xs py-1.5 px-3'
                                  onClick={() =>
                                    handleToneToggle(tone.value, !checked)
                                  }
                                >
                                  {tone.label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        <div className='flex items-center justify-between pt-4 border-t'>
                          <div className='text-sm text-muted-foreground'>
                            {tones.length > 0 ? (
                              <span>
                                {tones.length} tone
                                {tones.length !== 1 ? 's' : ''} selected
                              </span>
                            ) : (
                              <span>No tones selected (default)</span>
                            )}
                          </div>
                          <div className='flex gap-2'>
                            {tones.length > 1 && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setTones(['neutral'])}
                              >
                                Clear All
                              </Button>
                            )}
                            <Button
                              size='sm'
                              onClick={() => setIsToneModalOpen(false)}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                {tones.length > 0 && (
                  <div className='flex flex-wrap gap-1.5 p-3 bg-accent/50 rounded-lg'>
                    {tones.map(tone => {
                      const toneLabel =
                        TONES.find(item => item.value === tone)?.label || tone;
                      return (
                        <Badge
                          key={tone}
                          variant='default'
                          className='cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors'
                          onClick={() => handleToneToggle(tone, false)}
                        >
                          {toneLabel}
                          <X className='ml-1 h-3 w-3' />
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <RainbowButton
                  className='w-full'
                  size='lg'
                  variant='outline'
                  onClick={handleTranslate}
                  disabled={loading || !inputText.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Sparkles className='h-4 w-4 mr-2' />
                      Translate
                    </>
                  )}
                </RainbowButton>
              </CardContent>
            </Card>

            <div className='flex flex-col items-center justify-center gap-3 lg:pt-10'>
              <Button
                variant='outline'
                size='icon'
                onClick={handleSwap}
                disabled={loading}
                aria-label='Swap translation direction'
                className='h-11 w-11 rounded-full shadow-sm'
              >
                <ArrowRightLeft className='h-4 w-4' />
              </Button>
              <span className='text-xs text-muted-foreground text-center max-w-[120px]'>
                Swap direction
              </span>
            </div>

            <Card className='lg:sticky lg:top-6'>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>{outputLabel}</span>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleCopy}
                    disabled={!outputText}
                  >
                    {copied ? (
                      <Check className='h-4 w-4 mr-2' />
                    ) : (
                      <Copy className='h-4 w-4 mr-2' />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Textarea
                  value={outputText}
                  readOnly
                  placeholder='Translation will appear here...'
                  className='min-h-[180px]'
                />
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>Auto-filled after translation</span>
                  <span>{outputText.length} characters</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
