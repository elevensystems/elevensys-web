'use client';

import { useCallback, useState } from 'react';

import { Check, Copy, Link2 } from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PRItem {
  org: string;
  repo: string;
  number: string;
  url: string;
}

/**
 * Parse PR URLs from input (supports comma-separated, line-separated, or both)
 * @param {string} input - Raw input string with URLs separated by commas, newlines, or both
 * @returns {Object} - { plainText, items }
 */
function parsePrUrls(input: string): {
  plainText: string;
  items: PRItem[];
} {
  const items: PRItem[] = [];

  // Split by both newlines and commas, then clean up
  const tokens = input
    .split(/[\n,]+/) // Split by newlines OR commas (one or more)
    .map(s => s.trim()) // Trim whitespace
    .filter(s => s.length > 0); // Remove empty strings

  tokens.forEach(token => {
    try {
      const url = new URL(token);
      // Match pattern: /<org>/<repo>/pull/<number>
      const pathMatch = url.pathname.match(
        /^\/([^\/]+)\/([^\/]+)\/pull\/(\d+)$/
      );

      if (pathMatch) {
        const [, org, repo, number] = pathMatch;
        items.push({
          org,
          repo,
          number,
          url: token,
        });
      }
    } catch (err) {
      // Invalid URL, skip silently
    }
  });

  // Build plain text
  const plainText = items.map(item => `${item.repo}#${item.number}`).join(', ');

  return { plainText, items };
}

export default function PRLinkShrinkerPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{
    plainText: string;
    items: PRItem[];
  } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShrink = useCallback(() => {
    const trimmedInput = input.trim();

    // Clear previous results
    setResult(null);
    setError('');
    setCopied(false);

    if (!trimmedInput) {
      setError('Please paste PR links to shorten');
      return;
    }

    const { plainText, items } = parsePrUrls(trimmedInput);

    if (items.length === 0) {
      setError(
        'No valid PR links detected. Please paste valid GitHub PR URLs.'
      );
      return;
    }

    setResult({ plainText, items });
  }, [input]);

  const handleCopy = useCallback(async () => {
    if (!result?.plainText) return;

    try {
      await navigator.clipboard.writeText(result.plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy to clipboard');
    }
  }, [result]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult(null);
    setError('');
    setCopied(false);
  }, []);

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto'>
          <ToolPageHeader
            title='PR Link Shrinker'
            description='Shorten long GitHub PR URLs to a compact, readable format. Perfect for status updates and documentation.'
            infoMessage='Convert GitHub pull request URLs to a shortened format like "repo-name#123". All processing is done locally in your browser.'
            error={error}
          />

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Link2 className='h-5 w-5' />
                  GitHub PR Links
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='pr-input'>
                    Paste GitHub PR URLs (comma or line-separated)
                  </Label>
                  <Textarea
                    id='pr-input'
                    rows={12}
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setInput(e.target.value)
                    }
                    placeholder='https://github.com/Organization/some-repo/pull/10061&#10;https://github.com/AnotherOrg/some-other-repo/pull/6789&#10;or separate with commas...'
                    className='font-mono text-sm'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Paste GitHub PR URLs separated by commas, line breaks, or
                    both
                  </p>
                </div>

                <div className='flex gap-2'>
                  <Button
                    onClick={handleShrink}
                    disabled={!input.trim()}
                    className='flex-1'
                    size='lg'
                  >
                    <Link2 className='h-4 w-4 mr-2' />
                    Shorten Links
                  </Button>
                  {(input || result) && (
                    <Button onClick={handleClear} variant='outline' size='lg'>
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Result Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 justify-between'>
                  <span className='flex items-center gap-2'>
                    <Link2 className='h-5 w-5' />
                    Shortened Links
                  </span>
                  {result && result.items.length > 0 && (
                    <span className='text-sm font-normal text-muted-foreground'>
                      {result.items.length} PR
                      {result.items.length !== 1 ? 's' : ''} found
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {!result ? (
                  <div className='flex items-center justify-center h-64 text-muted-foreground'>
                    <p className='text-center'>
                      Paste GitHub PR URLs and click "Shorten Links" to generate
                      the shortened format
                    </p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='shortened-result'>Shortened Format</Label>
                      <div className='relative'>
                        <div className='p-3 bg-muted rounded-lg font-mono text-sm min-h-[12rem] max-h-[18rem] overflow-y-auto'>
                          {result.items.map((item, index) => (
                            <span key={index}>
                              <a
                                href={item.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-primary hover:underline'
                              >
                                {item.repo}#{item.number}
                              </a>
                              {index < result.items.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={handleCopy}
                          className='absolute top-2 right-2'
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
                      <p className='text-xs text-muted-foreground'>
                        Plain text format (without links) has been copied
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <Label>Plain Text Preview</Label>
                      <div className='p-3 bg-muted rounded-lg'>
                        <code className='text-sm break-all'>
                          {result.plainText}
                        </code>
                      </div>
                    </div>

                    <div className='p-3 bg-muted rounded-lg'>
                      <p className='text-sm text-muted-foreground'>
                        💡 Tip: The shortened format is perfect for status
                        updates, commit messages, and documentation. Click the
                        links to open the original PRs.
                      </p>
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
