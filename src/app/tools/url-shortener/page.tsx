'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  CalendarClock,
  Check,
  Copy,
  Link2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { MainLayout } from '@/components/layouts';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const COPY_FEEDBACK_DURATION = 2000;

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 */
const isValidUrl = (urlString: string): boolean => {
  try {
    const parsedUrl = new URL(urlString.trim());
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function UrlShortenerPage() {
  const [url, setUrl] = useState('');
  const [autoDelete, setAutoDelete] = useState(false);
  const [ttlDays, setTtlDays] = useState('');
  const [result, setResult] = useState<{
    shortUrl: string;
    shortCode?: string;
    originalUrl?: string;
    createdAt?: string;
    expiresAt?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setResult(null);
    setError('');
  }, []);

  const handleShorten = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError(
        'Please enter a valid URL (must start with http:// or https://)'
      );
      return;
    }

    if (autoDelete && ttlDays.trim()) {
      const parsedTtlDays = Number(ttlDays);
      if (Number.isNaN(parsedTtlDays) || parsedTtlDays <= 0) {
        setError('TTL must be a positive number of days');
        return;
      }
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/url-shortener', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: url.trim(),
          autoDelete,
          ttlDays: autoDelete && ttlDays.trim() ? Number(ttlDays) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to shorten URL');
      }

      const result = await response.json();

      if (result.shortUrl) {
        setResult(result);
        toast.success('URL shortened successfully', {
          description: 'Your short URL is ready to use.',
          icon: <Check className='h-4 w-4' />,
          duration: 5000,
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error shortening URL:', err);
      const errorMessage = 'Failed to shorten URL. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [autoDelete, ttlDays, url]);

  const handleCopy = useCallback(async () => {
    try {
      if (!result?.shortUrl) {
        return;
      }

      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);

      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, COPY_FEEDBACK_DURATION);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [result?.shortUrl]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleShorten();
      }
    },
    [handleShorten]
  );

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto'>
          <ToolPageHeader
            title='URL Shortener'
            description='Make your URLs shorter and easier to share. Free tool for creating short links.'
            infoMessage='URL shortening is processed securely through our server. Your links are never stored permanently.'
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
                {/* URL Input */}
                <div className='space-y-2'>
                  <Label htmlFor='url'>Enter Long URL</Label>
                  <Input
                    id='url'
                    type='url'
                    placeholder='https://example.com/very/long/url/path'
                    value={url}
                    onChange={e => handleUrlChange(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className='h-12'
                    aria-invalid={!!error}
                    aria-describedby={error ? 'url-error' : undefined}
                  />
                  {error ? (
                    <p id='url-error' className='text-sm text-destructive'>
                      {error}
                    </p>
                  ) : null}
                </div>

                {/* Auto-delete */}
                <div className='flex items-center gap-3 rounded-lg border bg-muted/30 p-4'>
                  <Checkbox
                    id='auto-delete'
                    checked={autoDelete}
                    onCheckedChange={checked => setAutoDelete(checked === true)}
                  />
                  <div className='space-y-1'>
                    <Label htmlFor='auto-delete'>Auto-delete link</Label>
                    <p className='text-xs text-muted-foreground'>
                      Enable to expire the link after a set number of days.
                    </p>
                  </div>
                </div>

                {autoDelete ? (
                  <div className='space-y-2'>
                    <Label htmlFor='ttl-days'>Expires After (days)</Label>
                    <Input
                      id='ttl-days'
                      type='number'
                      min={1}
                      step={1}
                      placeholder='30'
                      value={ttlDays}
                      onChange={e => setTtlDays(e.target.value)}
                      className='h-12'
                    />
                    <p className='text-xs text-muted-foreground'>
                      Leave blank to use the default 30-day expiration.
                    </p>
                  </div>
                ) : null}

                {/* Shorten Button */}
                <Button
                  onClick={handleShorten}
                  disabled={isLoading}
                  className='w-full'
                  size='lg'
                >
                  <Link2 className='h-4 w-4 mr-2' />
                  {isLoading ? 'Shortening...' : 'Shorten URL'}
                </Button>
              </CardContent>
            </Card>

            {/* Result Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Link2 className='h-5 w-5' />
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {!result?.shortUrl ? (
                  <div className='flex items-center justify-center h-40 text-muted-foreground'>
                    <p>Enter a URL and click "Shorten URL" to get started</p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium'>
                        Shortened URL
                      </Label>
                      <div className='flex items-center gap-2 p-3 bg-muted rounded-lg'>
                        <code className='flex-1 text-sm font-mono break-all select-all'>
                          {result.shortUrl}
                        </code>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={handleCopy}
                          aria-label={
                            copied ? 'Copied to clipboard' : 'Copy to clipboard'
                          }
                        >
                          {copied ? (
                            <Check className='h-4 w-4' aria-hidden='true' />
                          ) : (
                            <Copy className='h-4 w-4' aria-hidden='true' />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className='grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm'>
                      <div className='flex items-center justify-between gap-3'>
                        <span className='text-muted-foreground'>
                          Short code
                        </span>
                        <span className='font-medium'>
                          {result.shortCode ?? '—'}
                        </span>
                      </div>
                      <div className='flex items-center justify-between gap-3'>
                        <span className='text-muted-foreground'>
                          Original URL
                        </span>
                        <span className='font-medium break-all text-right'>
                          {result.originalUrl ?? url.trim()}
                        </span>
                      </div>
                      <div className='flex items-center justify-between gap-3'>
                        <span className='flex items-center gap-2 text-muted-foreground'>
                          <CalendarClock className='h-4 w-4' />
                          Created
                        </span>
                        <span className='font-medium'>
                          {result.createdAt
                            ? new Date(result.createdAt).toLocaleString()
                            : '—'}
                        </span>
                      </div>
                      <div className='flex items-center justify-between gap-3'>
                        <span className='flex items-center gap-2 text-muted-foreground'>
                          <CalendarClock className='h-4 w-4' />
                          Expires
                        </span>
                        <span className='font-medium'>
                          {result.expiresAt
                            ? new Date(result.expiresAt).toLocaleString()
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
