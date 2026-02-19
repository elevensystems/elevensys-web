import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { WorklogEntry } from '@/types/timesheet';

import MyWorklogsPage from './page';

// --- Mock hooks ---

const mockUseTimesheetSettings = jest.fn();
jest.mock('@/hooks/use-timesheet-settings', () => ({
  useTimesheetSettings: () => mockUseTimesheetSettings(),
}));

const mockHandleSearch = jest.fn();
const mockToggleSelectAll = jest.fn();
const mockToggleSelect = jest.fn();
const mockClearSelection = jest.fn();
const mockHandleDelete = jest.fn();
const mockHandleBulkDelete = jest.fn();
const mockSetFromDate = jest.fn();
const mockSetToDate = jest.fn();

const mockUseWorklogs = jest.fn();
jest.mock('@/hooks/use-worklogs', () => ({
  useWorklogs: () => mockUseWorklogs(),
  getWorklogKey: (w: WorklogEntry) => `${w.id}_${w.issueId}`,
}));

// --- Mock layouts ---

jest.mock('@/components/layouts/main-layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='main-layout'>{children}</div>
  ),
}));

jest.mock('@/components/layouts/tool-page-header', () => ({
  ToolPageHeader: ({
    title,
    description,
    error,
  }: {
    title: string;
    description: string;
    error?: string;
  }) => (
    <div data-testid='tool-page-header'>
      <h1>{title}</h1>
      <p>{description}</p>
      {error && <div data-testid='header-error'>{error}</div>}
    </div>
  ),
}));

// --- Mock child components ---

jest.mock('./_components/worklog-row', () => ({
  WorklogRow: ({ worklog }: { worklog: WorklogEntry }) => (
    <tr data-testid={`worklog-row-${worklog.id}`}>
      <td>{worklog.issueKey}</td>
    </tr>
  ),
}));

jest.mock('./_components/bulk-delete-action', () => ({
  BulkDeleteAction: ({
    selectedCount,
    onBulkDelete,
    onClearSelection,
  }: {
    selectedCount: number;
    onBulkDelete: () => void;
    onClearSelection: () => void;
  }) => (
    <div data-testid='bulk-delete-action'>
      <span>{selectedCount} selected</span>
      <button onClick={onBulkDelete}>Bulk Delete</button>
      <button onClick={onClearSelection}>Clear Selection</button>
    </div>
  ),
}));

// --- Mock UI components ---

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid='icon-alert-circle' />,
  ClipboardList: () => <span data-testid='icon-clipboard-list' />,
  Loader2: () => <span data-testid='icon-loader' />,
  Search: () => <span data-testid='icon-search' />,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div role='alert' {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid='card-description'>{children}</p>
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
    checked,
    onCheckedChange,
    ...props
  }: {
    checked: boolean | 'indeterminate';
    onCheckedChange: (val: boolean) => void;
    'aria-label'?: string;
  }) => (
    <input
      type='checkbox'
      checked={checked === true}
      onChange={() => onCheckedChange?.(!checked)}
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/date-range-picker', () => ({
  DateRangePicker: ({
    onRangeChange,
  }: {
    onRangeChange?: (from: string, to: string) => void;
  }) => (
    <div data-testid='date-range-picker'>
      <button
        data-testid='change-date-range'
        onClick={() => onRangeChange?.('2025-02-01', '2025-02-28')}
      />
    </div>
  ),
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => (
    <table>{children}</table>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  TableHead: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
  } & React.HTMLAttributes<HTMLTableCellElement>) => (
    <th {...props}>{children}</th>
  ),
  TableHeader: ({
    children,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
  ),
}));

// --- Test data ---

const configuredSettings = {
  settings: {
    username: 'testuser',
    token: 'test-token',
    jiraInstance: 'jiradc',
  },
  isConfigured: true,
  isLoaded: true,
};

const defaultWorklogsReturn = {
  fromDate: '2025-01-01',
  setFromDate: mockSetFromDate,
  toDate: '2025-01-31',
  setToDate: mockSetToDate,
  worklogs: [] as WorklogEntry[],
  isLoading: false,
  deletingId: null,
  error: '',
  hasSearched: false,
  totalHours: 0,
  selectedIds: new Set<string>(),
  allSelected: false,
  someSelected: false,
  isBulkDeleting: false,
  bulkDeleteProgress: 0,
  toggleSelectAll: mockToggleSelectAll,
  toggleSelect: mockToggleSelect,
  clearSelection: mockClearSelection,
  handleSearch: mockHandleSearch,
  handleDelete: mockHandleDelete,
  handleBulkDelete: mockHandleBulkDelete,
};

const sampleWorklogs: WorklogEntry[] = [
  {
    id: 1,
    issueKey: 'PROJ-101',
    issueId: 100,
    worked: 2.5,
    remaining: 5,
    estimated: 8,
    startDate: '2025-01-15',
    startDateEdit: '2025-01-15',
    description: 'Fixed a bug',
    author: 'testuser',
    typeOfWork: 'Create',
    statusWorklog: 'Open',
  },
  {
    id: 2,
    issueKey: 'PROJ-102',
    issueId: 200,
    worked: 4.0,
    remaining: 3,
    estimated: 8,
    startDate: '2025-01-16',
    startDateEdit: '2025-01-16',
    description: 'Added feature',
    author: 'testuser',
    typeOfWork: 'Review',
    statusWorklog: 'Approved',
  },
];

// --- Tests ---

describe('MyWorklogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimesheetSettings.mockReturnValue(configuredSettings);
    mockUseWorklogs.mockReturnValue(defaultWorklogsReturn);
  });

  // --- Loading state ---

  it('renders loading spinner when settings are not loaded', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isLoaded: false,
    });
    render(<MyWorklogsPage />);
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
  });

  it('hides page content when settings are not loaded', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isLoaded: false,
    });
    render(<MyWorklogsPage />);
    expect(screen.queryByText('My Worklogs')).not.toBeInTheDocument();
  });

  // --- Page header ---

  it('renders page header with title and description', () => {
    render(<MyWorklogsPage />);
    expect(screen.getByText('My Worklogs')).toBeInTheDocument();
    expect(
      screen.getByText(/View your logged timesheets from Jira/)
    ).toBeInTheDocument();
  });

  it('passes error to ToolPageHeader', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      error: 'Something went wrong',
    });
    render(<MyWorklogsPage />);
    expect(screen.getByTestId('header-error')).toHaveTextContent(
      'Something went wrong'
    );
  });

  // --- Configuration warning ---

  it('renders configuration warning when Jira is not configured', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isConfigured: false,
    });
    render(<MyWorklogsPage />);
    expect(
      screen.getByText(/Jira settings not configured/)
    ).toBeInTheDocument();
  });

  it('renders link to config page in configuration warning', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isConfigured: false,
    });
    render(<MyWorklogsPage />);
    const link = screen.getByText('Go to Configs');
    expect(link.closest('a')).toHaveAttribute('href', '/timesheet/config');
  });

  it('hides configuration warning when Jira is configured', () => {
    render(<MyWorklogsPage />);
    expect(
      screen.queryByText(/Jira settings not configured/)
    ).not.toBeInTheDocument();
  });

  // --- Search card ---

  it('renders search card with title and date range picker', () => {
    render(<MyWorklogsPage />);
    expect(screen.getByText('Search Worklogs')).toBeInTheDocument();
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<MyWorklogsPage />);
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
  });

  it('disables search button when not configured', () => {
    mockUseTimesheetSettings.mockReturnValue({
      ...configuredSettings,
      isConfigured: false,
    });
    render(<MyWorklogsPage />);
    expect(screen.getByRole('button', { name: /Search/i })).toBeDisabled();
  });

  it('disables search button while loading', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      isLoading: true,
    });
    render(<MyWorklogsPage />);
    expect(screen.getByRole('button', { name: /Searching/i })).toBeDisabled();
  });

  it('renders "Searching..." text while loading', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      isLoading: true,
    });
    render(<MyWorklogsPage />);
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('renders loader icon instead of search icon while loading', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      isLoading: true,
    });
    render(<MyWorklogsPage />);
    const button = screen.getByRole('button', { name: /Searching/i });
    expect(button.querySelector('[data-testid="icon-loader"]')).toBeTruthy();
  });

  it('calls handleSearch when search button is clicked', async () => {
    render(<MyWorklogsPage />);
    await userEvent.click(screen.getByRole('button', { name: /Search/i }));
    expect(mockHandleSearch).toHaveBeenCalledTimes(1);
  });

  it('calls setFromDate and setToDate when date range changes', async () => {
    render(<MyWorklogsPage />);
    await userEvent.click(screen.getByTestId('change-date-range'));
    expect(mockSetFromDate).toHaveBeenCalledWith('2025-02-01');
    expect(mockSetToDate).toHaveBeenCalledWith('2025-02-28');
  });

  // --- Empty states ---

  it('renders initial prompt before search', () => {
    render(<MyWorklogsPage />);
    expect(
      screen.getByText(/Select a date range and click/)
    ).toBeInTheDocument();
  });

  it('renders "no worklogs found" message after empty search', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      hasSearched: true,
    });
    render(<MyWorklogsPage />);
    expect(
      screen.getByText(/No worklogs found for the selected date range/)
    ).toBeInTheDocument();
  });

  it('hides worklogs table when no entries exist', () => {
    render(<MyWorklogsPage />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('hides entry count when worklogs are empty', () => {
    render(<MyWorklogsPage />);
    expect(screen.queryByTestId('card-description')).not.toBeInTheDocument();
  });

  it('hides BulkDeleteAction when worklogs are empty', () => {
    render(<MyWorklogsPage />);
    expect(screen.queryByTestId('bulk-delete-action')).not.toBeInTheDocument();
  });

  // --- Worklogs table ---

  it('renders worklogs table when entries exist', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
    });
    render(<MyWorklogsPage />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays entry count and total hours', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
    });
    render(<MyWorklogsPage />);
    expect(screen.getByTestId('card-description')).toHaveTextContent(
      '2 entries'
    );
    expect(screen.getByTestId('card-description')).toHaveTextContent(
      '6.5 total hours'
    );
  });

  it('renders a WorklogRow for each worklog entry', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
    });
    render(<MyWorklogsPage />);
    expect(screen.getByTestId('worklog-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('worklog-row-2')).toBeInTheDocument();
  });

  it('renders table column headers', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
    });
    render(<MyWorklogsPage />);
    expect(screen.getByText('Ticket ID')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  // --- Select all checkbox ---

  it('renders select-all checkbox in table header', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
    });
    render(<MyWorklogsPage />);
    expect(
      screen.getByRole('checkbox', { name: 'Select all' })
    ).toBeInTheDocument();
  });

  it('checks select-all checkbox when all are selected', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      allSelected: true,
    });
    render(<MyWorklogsPage />);
    expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeChecked();
  });

  it('unchecks select-all checkbox when none are selected', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      allSelected: false,
      someSelected: false,
    });
    render(<MyWorklogsPage />);
    expect(
      screen.getByRole('checkbox', { name: 'Select all' })
    ).not.toBeChecked();
  });

  it('calls toggleSelectAll when select-all checkbox is clicked', async () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
    });
    render(<MyWorklogsPage />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(mockToggleSelectAll).toHaveBeenCalledTimes(1);
  });

  // --- Bulk delete ---

  it('renders BulkDeleteAction when worklogs exist', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
    });
    render(<MyWorklogsPage />);
    expect(screen.getByTestId('bulk-delete-action')).toBeInTheDocument();
  });

  it('passes selected count to BulkDeleteAction', () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      selectedIds: new Set(['1_100', '2_200']),
    });
    render(<MyWorklogsPage />);
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('calls handleBulkDelete from BulkDeleteAction', async () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      selectedIds: new Set(['1_100']),
    });
    render(<MyWorklogsPage />);
    await userEvent.click(screen.getByText('Bulk Delete'));
    expect(mockHandleBulkDelete).toHaveBeenCalledTimes(1);
  });

  it('calls clearSelection from BulkDeleteAction', async () => {
    mockUseWorklogs.mockReturnValue({
      ...defaultWorklogsReturn,
      worklogs: sampleWorklogs,
      totalHours: 6.5,
      selectedIds: new Set(['1_100']),
    });
    render(<MyWorklogsPage />);
    await userEvent.click(screen.getByText('Clear Selection'));
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
  });
});
