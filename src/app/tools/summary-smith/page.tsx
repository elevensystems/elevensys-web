'use client';

import { useCallback, useState } from 'react';

import { Check, Copy, FileText } from 'lucide-react';

import { MainLayout } from '@/components/layouts';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
 */
function parsePrUrls(input: string): {
  plainText: string;
  items: PRItem[];
} {
  const items: PRItem[] = [];

  if (!input.trim()) {
    return { plainText: '', items: [] };
  }

  // Split by both newlines and commas, then clean up
  const tokens = input
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  tokens.forEach(token => {
    try {
      const url = new URL(token);
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

  const plainText = items
    .map(item => `${item.repo} #${item.number}`)
    .join(', ');

  return { plainText, items };
}

/**
 * Build plain text version of summary with URLs in parentheses
 */
function buildSummaryPlainText(
  idName: string,
  rallyUrl: string,
  status: string,
  reason: string,
  prItems: PRItem[],
  message: string
): string {
  const lines: string[] = [];

  // Line 1: Title with URL
  lines.push(`${idName} (${rallyUrl})`);

  // Line 2: Status
  if (status) {
    if (status === 'Blocked' && reason) {
      lines.push(`Status: Blocked - ${reason}`);
    } else if (status !== 'Blocked') {
      lines.push(`Status: ${status}`);
    }
  }

  // Line 3: PRs with URLs
  if (prItems.length > 0) {
    const prLabel = prItems.length === 1 ? 'PR:' : 'PRs:';
    const prText = prItems
      .map(item => `${item.repo} #${item.number} (${item.url})`)
      .join(', ');
    lines.push(`${prLabel} ${prText}`);
  }

  // Line 4: Message
  if (message) {
    lines.push(message);
  }

  return lines.join('\n');
}

const STATUS_OPTIONS = [
  { value: '', label: '-- Select Status --' },
  { value: 'In-progress', label: 'In-progress' },
  { value: 'Waiting for UAT', label: 'Waiting for UAT' },
  { value: 'UAT Accepted', label: 'UAT Accepted' },
  { value: 'PR Approved', label: 'PR Approved' },
  { value: 'Blocked', label: 'Blocked' },
];

export default function SummarySmithPage() {
  const [rallyId, setRallyId] = useState('');
  const [rallyLink, setRallyLink] = useState('');
  const [prLinks, setPrLinks] = useState('');
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const [result, setResult] = useState<{
    html: string;
    plainText: string;
  } | null>(null);
  const [errors, setErrors] = useState<{
    rallyId?: string;
    rallyLink?: string;
    reason?: string;
  }>({});
  const [copied, setCopied] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!rallyId.trim()) {
      newErrors.rallyId = 'This field is required';
      isValid = false;
    }

    if (!rallyLink.trim()) {
      newErrors.rallyLink = 'This field is required';
      isValid = false;
    }

    if (status === 'Blocked' && !reason.trim()) {
      newErrors.reason = 'Reason is required when Blocked';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [rallyId, rallyLink, status, reason]);

  const handleGenerate = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    // Parse PRs
    const { items } = parsePrUrls(prLinks);

    // Build HTML result
    const lines: string[] = [];

    // Line 1: Title as hyperlink
    lines.push(
      `<div class="summary-line"><a href="${rallyLink}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-semibold">${rallyId}</a></div>`
    );

    // Line 2: Status (if selected)
    if (status) {
      if (status === 'Blocked' && reason) {
        lines.push(
          `<div class="summary-line">Status: <span class="font-medium">Blocked - ${reason}</span></div>`
        );
      } else if (status !== 'Blocked') {
        lines.push(
          `<div class="summary-line">Status: <span class="font-medium">${status}</span></div>`
        );
      }
    }

    // Line 3: PRs (if any valid)
    if (items.length > 0) {
      const prLabel = items.length === 1 ? 'PR:' : 'PRs:';
      const anchorsHtml = items
        .map(
          item =>
            `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${item.repo} #${item.number}</a>`
        )
        .join(', ');
      lines.push(`<div class="summary-line">${prLabel} ${anchorsHtml}</div>`);
    }

    // Line 4: Message (if provided)
    if (message.trim()) {
      lines.push(
        `<div class="summary-line text-muted-foreground italic">${message}</div>`
      );
    }

    const htmlResult = lines.join('');
    const plainTextResult = buildSummaryPlainText(
      rallyId,
      rallyLink,
      status,
      reason,
      items,
      message
    );

    setResult({ html: htmlResult, plainText: plainTextResult });
    setCopied(false);
  }, [rallyId, rallyLink, prLinks, status, reason, message, validateForm]);

  const handleCopy = useCallback(async () => {
    if (!result?.plainText) return;

    try {
      await navigator.clipboard.writeText(result.plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [result]);

  const handleClear = useCallback(() => {
    setRallyId('');
    setRallyLink('');
    setPrLinks('');
    setStatus('');
    setReason('');
    setMessage('');
    setResult(null);
    setErrors({});
    setCopied(false);
  }, []);

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto'>
          <ToolPageHeader
            title='Summary Smith'
            description='Generate formatted status summaries for Rally stories. Perfect for standup updates and team communication.'
            infoMessage='Create professional status summaries with Rally links, PR references, and custom messages. All processing is done locally in your browser.'
          />

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Summary Details
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='rally-id'>
                    Rally ID & Title <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='rally-id'
                    value={rallyId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRallyId(e.target.value)
                    }
                    placeholder='US123456: Migrate jobs to GitHub Actions'
                    className={errors.rallyId ? 'border-red-500' : ''}
                  />
                  {errors.rallyId && (
                    <p className='text-xs text-red-500'>{errors.rallyId}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='rally-link'>
                    Rally Link <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='rally-link'
                    value={rallyLink}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRallyLink(e.target.value)
                    }
                    placeholder='https://rally1.rallydev.com/#/123456789a/iterationstatus...'
                    className={errors.rallyLink ? 'border-red-500' : ''}
                  />
                  {errors.rallyLink && (
                    <p className='text-xs text-red-500'>{errors.rallyLink}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='pr-links'>
                    GitHub PR Links (optional, comma or line-separated)
                  </Label>
                  <Textarea
                    id='pr-links'
                    rows={3}
                    value={prLinks}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setPrLinks(e.target.value)
                    }
                    placeholder='https://github.com/Organization/some-repo/pull/10061&#10;or separate with commas...'
                    className='font-mono text-sm'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='status'>Current Status (optional)</Label>
                  <select
                    id='status'
                    value={status}
                    onChange={e => {
                      setStatus(e.target.value);
                      if (e.target.value !== 'Blocked') {
                        setReason('');
                        setErrors(prev => ({ ...prev, reason: undefined }));
                      }
                    }}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {status === 'Blocked' && (
                  <div className='space-y-2'>
                    <Label htmlFor='reason'>
                      Reason <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='reason'
                      value={reason}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setReason(e.target.value)
                      }
                      placeholder='Waiting for API changes...'
                      className={errors.reason ? 'border-red-500' : ''}
                    />
                    {errors.reason && (
                      <p className='text-xs text-red-500'>{errors.reason}</p>
                    )}
                  </div>
                )}

                <div className='space-y-2'>
                  <Label htmlFor='message'>
                    Message to onshore team (optional)
                  </Label>
                  <Textarea
                    id='message'
                    rows={3}
                    value={message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setMessage(e.target.value)
                    }
                    placeholder='Additional notes or message...'
                  />
                </div>

                <div className='flex gap-2'>
                  <Button onClick={handleGenerate} className='flex-1' size='lg'>
                    <FileText className='h-4 w-4 mr-2' />
                    Generate Summary
                  </Button>
                  {(rallyId || rallyLink || prLinks || status || message) && (
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
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Generated Summary
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {!result ? (
                  <div className='flex items-center justify-center h-64 text-muted-foreground'>
                    <p className='text-center'>
                      Fill in the required fields and click "Generate Summary"
                      to create your formatted status update
                    </p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label>Formatted Output</Label>
                      <div className='relative'>
                        <div
                          className='p-4 bg-muted rounded-lg min-h-[12rem] space-y-2'
                          dangerouslySetInnerHTML={{ __html: result.html }}
                        />
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
                        Plain text format with URLs has been copied
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <Label>Plain Text Preview</Label>
                      <div className='p-3 bg-muted rounded-lg'>
                        <pre className='text-sm whitespace-pre-wrap break-all'>
                          {result.plainText}
                        </pre>
                      </div>
                    </div>

                    <div className='p-3 bg-muted rounded-lg'>
                      <p className='text-sm text-muted-foreground'>
                        💡 Tip: Use this summary in your standup updates, Slack
                        messages, or team communications. Links are preserved
                        for easy access.
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
