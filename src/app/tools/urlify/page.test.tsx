import '@testing-library/jest-dom';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

import UrlifyPage from './page';

// --- Mock toast ---

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// --- Mock fetch ---

const mockFetch = jest.fn();
beforeAll(() => {
  global.fetch = mockFetch;
});

// --- Mock clipboard ---

const mockCopy = jest.fn();
const mockUseCopyToClipboard = jest.fn();
jest.mock('@/hooks/use-copy-to-clipboard', () => ({
  useCopyToClipboard: () => mockUseCopyToClipboard(),
}));

// --- Mock layouts ---

jest.mock('@/components/layouts/main-layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

jest.mock('@/components/layouts/tool-page-header', () => ({
  ToolPageHeader: ({
    title,
    description,
    infoMessage,
    error,
  }: {
    title: string;
    description: string;
    infoMessage?: string;
    error?: string;
  }) => (
    <div data-testid="tool-page-header">
      <h1>{title}</h1>
      <p>{description}</p>
      {infoMessage && <p data-testid="info-message">{infoMessage}</p>}
      {error && <p data-testid="error-message">{error}</p>}
    </div>
  ),
}));

// --- Mock icons ---

jest.mock('lucide-react', () => ({
  CalendarClock: () => <span data-testid="icon-calendar-clock" />,
  Check: () => <span data-testid="icon-check" />,
  Copy: () => <span data-testid="icon-copy" />,
  Link2: () => <span data-testid="icon-link2" />,
  Settings: () => <span data-testid="icon-settings" />,
}));

// --- Mock UI components ---

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    variant?: string;
    size?: string;
  }) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    id,
    checked,
    onCheckedChange,
  }: {
    id?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={e => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({
    children,
    ...props
  }: React.LabelHTMLAttributes<HTMLLabelElement> & {
    children: React.ReactNode;
  }) => <label {...props}>{children}</label>,
}));

// --- Tests ---

describe('UrlifyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCopy.mockResolvedValue(undefined);
    mockUseCopyToClipboard.mockReturnValue({
      copiedId: null,
      copy: mockCopy,
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          shortUrl: 'https://short.url/abc123',
          shortCode: 'abc123',
          originalUrl: 'https://example.com/very/long/url',
          createdAt: '2026-01-01T00:00:00Z',
          expiresAt: '2026-02-01T00:00:00Z',
        }),
    });
  });

  // --- Page header ---

  it('renders page header with title and description', () => {
    render(<UrlifyPage />);
    expect(screen.getByText('Urlify')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Make your URLs shorter and easier to share. Free tool for creating short links.'
      )
    ).toBeInTheDocument();
  });

  it('renders info message', () => {
    render(<UrlifyPage />);
    expect(screen.getByTestId('info-message')).toHaveTextContent(
      /never stored permanently/
    );
  });

  // --- Settings card ---

  it('renders Settings card title', () => {
    render(<UrlifyPage />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders URL input with placeholder', () => {
    render(<UrlifyPage />);
    const input = screen.getByLabelText('Enter Long URL');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute(
      'placeholder',
      'https://example.com/very/long/url/path'
    );
  });

  it('renders auto-delete checkbox unchecked by default', () => {
    render(<UrlifyPage />);
    const checkbox = screen.getByLabelText('Auto-delete link');
    expect(checkbox).not.toBeChecked();
  });

  it('renders Shorten URL button', () => {
    render(<UrlifyPage />);
    expect(
      screen.getByRole('button', { name: /Shorten URL/i })
    ).toBeInTheDocument();
  });

  // --- Result card ---

  it('renders Result card with empty state message', () => {
    render(<UrlifyPage />);
    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(
      screen.getByText(/Enter a URL and click "Shorten URL" to get started/)
    ).toBeInTheDocument();
  });

  // --- Auto-delete toggle ---

  it('shows TTL input when auto-delete is checked', async () => {
    render(<UrlifyPage />);
    await userEvent.click(screen.getByLabelText('Auto-delete link'));
    expect(screen.getByLabelText('Expires After (days)')).toBeInTheDocument();
  });

  it('hides TTL input when auto-delete is unchecked', () => {
    render(<UrlifyPage />);
    expect(
      screen.queryByLabelText('Expires After (days)')
    ).not.toBeInTheDocument();
  });

  // --- Validation ---

  it('displays error when submitting empty URL', async () => {
    render(<UrlifyPage />);
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Please enter a URL'
    );
  });

  it('displays error for invalid URL', async () => {
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'not-a-url'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      /must start with http:\/\/ or https:\/\//
    );
  });

  it('displays error for invalid TTL value', async () => {
    render(<UrlifyPage />);
    await userEvent.click(screen.getByLabelText('Auto-delete link'));
    await userEvent.type(
      screen.getByLabelText('Expires After (days)'),
      '-5'
    );
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'TTL must be a positive number of days'
    );
  });

  // --- Successful shorten ---

  it('calls fetch with correct parameters on shorten', async () => {
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/urlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: 'https://example.com/long',
          autoDelete: false,
          ttlDays: undefined,
        }),
      });
    });
  });

  it('sends ttlDays when auto-delete is enabled', async () => {
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(screen.getByLabelText('Auto-delete link'));
    await userEvent.type(
      screen.getByLabelText('Expires After (days)'),
      '7'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/urlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: 'https://example.com/long',
          autoDelete: true,
          ttlDays: 7,
        }),
      });
    });
  });

  it('displays shortened URL result on success', async () => {
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText('https://short.url/abc123')
      ).toBeInTheDocument();
    });
  });

  it('displays result metadata on success', async () => {
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    await waitFor(() => {
      expect(screen.getByText('abc123')).toBeInTheDocument();
      expect(
        screen.getByText('https://example.com/very/long/url')
      ).toBeInTheDocument();
    });
  });

  it('shows success toast on successful shorten', async () => {
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'URL shortened successfully',
        expect.objectContaining({ description: 'Your short URL is ready to use.' })
      );
    });
  });

  // --- Error handling ---

  it('displays error when API returns non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Failed to shorten URL. Please try again.'
      );
    });
  });

  it('shows error toast when API fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to shorten URL. Please try again.',
        expect.objectContaining({ duration: 5000 })
      );
    });
  });

  it('displays error when API returns response without shortUrl', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: 'something went wrong' }),
    });
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Failed to shorten URL. Please try again.'
      );
    });
  });

  // --- Loading state ---

  it('shows loading text while shortening', async () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    expect(screen.getByText('Shortening...')).toBeInTheDocument();
  });

  it('disables button while loading', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    expect(screen.getByText('Shortening...').closest('button')).toBeDisabled();
  });

  // --- Copy functionality ---

  it('calls copy when copy button is clicked', async () => {
    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText('https://short.url/abc123')
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Copy to clipboard' })
    );
    expect(mockCopy).toHaveBeenCalledWith('https://short.url/abc123');
  });

  it('shows copied state when copiedId is truthy', async () => {
    mockUseCopyToClipboard.mockReturnValue({
      copiedId: true,
      copy: mockCopy,
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          shortUrl: 'https://short.url/abc123',
        }),
    });

    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com/long'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Copied to clipboard' })
      ).toBeInTheDocument();
    });
  });

  // --- Keyboard interaction ---

  it('triggers shorten on Enter key press', async () => {
    render(<UrlifyPage />);
    const input = screen.getByLabelText('Enter Long URL');
    await userEvent.type(input, 'https://example.com/long{Enter}');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  // --- URL change clears state ---

  it('clears result and error when URL input changes', async () => {
    render(<UrlifyPage />);

    // Trigger an error first
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );
    expect(screen.getByTestId('error-message')).toBeInTheDocument();

    // Type in URL input to clear
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'h'
    );
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  // --- Result displays "Never" for no expiresAt ---

  it('displays "Never" when expiresAt is not set', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          shortUrl: 'https://short.url/xyz',
          shortCode: 'xyz',
        }),
    });

    render(<UrlifyPage />);
    await userEvent.type(
      screen.getByLabelText('Enter Long URL'),
      'https://example.com'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Shorten URL/i })
    );

    await waitFor(() => {
      expect(screen.getByText('Never')).toBeInTheDocument();
    });
  });
});
