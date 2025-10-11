'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Check, Copy } from 'lucide-react';

import { MainLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const COPY_FEEDBACK_DURATION = 2000;

/**
 * Regex pattern for validating HTTP/HTTPS URLs
 * Matches: protocol, domain (with optional subdomains), optional port, optional path/query/hash
 */
const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

/**
 * Validates if a string is a valid HTTP/HTTPS URL using regex
 */
const isValidUrl = (urlString: string): boolean => {
  return URL_REGEX.test(urlString.trim());
};

/**
 * Generates a random short URL identifier
 */
const generateShortUrl = (): string => {
  const randomId = Math.random().toString(36).substring(2, 9);
  return `short.link/${randomId}`;
};

export default function Snip() {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleUrlChange = useCallback(
    (value: string) => {
      setUrl(value);
      if (error) {
        setError('');
      }
    },
    [error]
  );

  const handleShorten = useCallback(() => {
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

    setError('');
    setShortUrl(generateShortUrl());
  }, [url]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
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
  }, [shortUrl]);

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
      <section className='container mx-auto px-4 py-32 md:py-40'>
        <div className='max-w-2xl mx-auto'>
          <h1 className='text-4xl md:text-5xl font-semibold mb-4 text-balance text-center'>
            Shorten your links
          </h1>

          <p className='text-muted-foreground mb-12 text-center text-balance'>
            Make your URLs shorter and easier to share
          </p>

          <div className='space-y-4'>
            <div>
              <Input
                type='url'
                placeholder='Paste your long URL (e.g., https://example.com)'
                value={url}
                onChange={e => handleUrlChange(e.target.value)}
                onKeyDown={handleKeyPress}
                className={`h-12 text-base ${error ? 'border-red-500' : ''}`}
                aria-invalid={!!error}
                aria-describedby={error ? 'url-error' : undefined}
              />
              {error && (
                <p
                  id='url-error'
                  className='text-red-500 text-sm mt-2'
                  role='alert'
                >
                  {error}
                </p>
              )}
            </div>

            <Button onClick={handleShorten} size='lg' className='w-full h-12'>
              Shorten
            </Button>

            {shortUrl && (
              <div className='flex items-center gap-2 p-4 bg-muted rounded-lg'>
                <code className='flex-1 text-sm font-mono break-all'>
                  {shortUrl}
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
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
