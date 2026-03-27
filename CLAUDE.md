# CLAUDE.md - AI Assistant Guide for Elevensys Web

This document provides comprehensive guidance for AI assistants working with the Elevensys Web
codebase.

## Project Overview

**Elevensys Web** is a full-stack web application providing AI-powered productivity tools. It's
built with Next.js 16 (App Router), React 19, and TypeScript 5, featuring AWS Cognito authentication
with role-based access control.

### Quick Start

```bash
# Install dependencies (uses npm)
npm install

# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Format code
npm run prettier

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## Tech Stack

| Category        | Technology                             |
| --------------- | -------------------------------------- |
| Framework       | Next.js 16.1.6 (App Router, Turbopack) |
| UI Library      | React 19.2.0                           |
| Language        | TypeScript 5 (strict mode)             |
| Styling         | Tailwind CSS v4                        |
| Components      | shadcn/ui + Radix UI primitives        |
| Icons           | lucide-react                           |
| Editor          | Monaco Editor                          |
| Auth            | AWS Cognito OAuth2 (PKCE)              |
| Theming         | next-themes                            |
| Notifications   | sonner                                 |
| Package Manager | npm                                    |

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API route handlers
│   │   ├── admin/urlify/   # Admin URL management (list, delete)
│   │   ├── auth/           # OAuth2 endpoints (login, callback, logout, session, signup)
│   │   ├── beatly/         # Song recommender API
│   │   ├── passly/         # Password generator API
│   │   ├── translately/    # Translation API (Pro-only feature)
│   │   ├── urlify/         # URL shortener create endpoint
│   │   ├── timesheet/      # Timesheet feature (projects, issues, worklogs, logwork, auth)
│   │   ├── templates/
│   │   └── feedback/
│   ├── tools/              # Tool pages (10 tools)
│   │   ├── passly/         # Password generator
│   │   ├── json-diffinity/ # JSON diff tool
│   │   ├── json-lens/      # JSON lens/viewer tool
│   │   ├── json-objectify/ # JSON object converter
│   │   ├── translately/    # Translation tool
│   │   ├── urlify/         # URL shortener
│   │   ├── npm-converter/
│   │   ├── pr-link-shrinker/
│   │   ├── prompt-templates/
│   │   └── beatly/         # Song recommender
│   ├── timesheet/          # Timesheet feature pages
│   │   ├── config/         # Timesheet settings
│   │   ├── logwork/        # Log work page
│   │   ├── project-worklogs/ # Per-project worklog view
│   │   └── worklogs/       # My worklogs page
│   ├── admin/              # Admin pages (protected by admin role)
│   │   ├── layout.tsx      # Server-side admin auth check
│   │   ├── page.tsx        # Admin redirect
│   │   ├── dashboard/      # Admin dashboard
│   │   └── urlify/         # URL management (table, pagination, bulk actions)
│   ├── login/              # Login page
│   ├── signup/             # Sign up page
│   ├── forgot-password/    # Forgot password page
│   ├── profile/            # User profile page
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Homepage
├── components/
│   ├── ui/                 # shadcn/ui components (42 components)
│   ├── layouts/            # Layout components
│   │   ├── main-layout.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── auth-layout.tsx
│   │   ├── tool-page-header.tsx
│   │   ├── nav-main.tsx
│   │   ├── nav-tools.tsx
│   │   ├── nav-user.tsx
│   │   ├── nav-admin.tsx
│   │   ├── nav-projects.tsx
│   │   ├── nav-secondary.tsx
│   │   ├── pro-access-only.tsx  # Pro tier gating
│   │   ├── guest-login-alert.tsx
│   │   ├── feedback-modal.tsx
│   │   └── support-modal.tsx
│   ├── features/           # Feature-specific components
│   │   └── auth/           # login-form, signup-form, forgot-password-form
│   ├── header.tsx
│   └── theme-provider.tsx
├── contexts/
│   └── auth-context.tsx    # Auth state via React Context
├── hooks/
│   ├── use-mobile.ts                # Mobile breakpoint detection
│   ├── use-copy-to-clipboard.ts     # Clipboard copy with feedback
│   ├── use-urlify-admin.ts          # Admin URL management (fetch, paginate, select, delete)
│   ├── use-timesheet-settings.ts    # Timesheet Jira config state
│   ├── use-worklogs.ts              # My worklogs list with filtering/pagination
│   ├── use-project-worklogs.ts      # Per-project worklog view
│   ├── use-missing-worklogs.ts      # Missing worklog detection
│   └── use-log-work-submission.ts   # Log work form submission
├── lib/
│   ├── auth.ts             # JWT decoding, session helpers
│   ├── auth-cookies.ts     # Auth cookie helpers
│   ├── app-sidebar-config.ts # Sidebar nav config
│   ├── constants.ts        # Shared constants, validateModel()
│   ├── domain-config.ts    # Multi-tenant domain/app config
│   ├── fetch-utils.ts      # fetchWithTimeout() for API routes
│   ├── pr-utils.ts         # PRItem, parsePrUrls() shared utility
│   ├── beatly-data.ts      # GENRES, RANDOM_MOODS data
│   ├── timesheet.ts        # Timesheet API helpers
│   ├── tools-config.ts     # ToolConfig type, TOOL_CATEGORIES
│   ├── utils.ts            # cn(), hasRole(), requireEnv()
│   ├── diff.ts             # JSON diff utilities
│   ├── schemas/urlify.ts   # Zod schemas for urlify
│   └── shine-palettes.ts
├── types/
│   ├── auth.ts             # AuthUser, UserRole, JwtPayload types
│   ├── beatly.ts           # MoodRequest, ChatMessage, Song
│   ├── passly.ts           # Password generator types
│   ├── timesheet.ts        # Timesheet/worklog types
│   ├── translate.ts        # TranslateRequestBody
│   └── urlify.ts           # ShortenedUrl, UrlStatus, getUrlStatus()
└── styles/
    └── globals.css         # Global styles, CSS variables

public/
├── templates/              # Markdown prompt templates (9 files)
└── assets/                 # SVG icons, favicon
```

## Code Conventions

### Naming

| Type                | Convention       | Example                                  |
| ------------------- | ---------------- | ---------------------------------------- |
| Components          | PascalCase       | `MainLayout`, `ProAccessOnly`            |
| Files/Folders       | kebab-case       | `passly`, `auth-context.tsx`             |
| Variables/Functions | camelCase        | `getUserFromSession`, `handleCopy`       |
| Constants           | UPPER_SNAKE_CASE | `AUTH_COOKIES`, `COPY_FEEDBACK_DURATION` |
| Types/Interfaces    | PascalCase       | `AuthUser`, `CharacterOptions`           |

### File Organization

- **Feature-based structure**: Colocate related code within tool/feature directories
- **No barrel files**: Import directly from source files, not via `index.ts` re-exports
- **Type definitions**: Place shared types in `/types` folder, not inside components
- **Utilities**: General helpers go in `/lib` folder

### Component Patterns

```tsx
// Always use 'use client' directive for client components
'use client';

// Import order (enforced by Prettier):
// 1. React imports
// 2. Next.js imports
// 3. Third-party libraries
// 4. @/ aliased imports
// 5. Relative imports
import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import { Button } from '@/components/ui/button';
import type { AuthUser } from '@/types/auth';

// Always use 'use client' directive for client components

// Define interfaces above component
interface MyComponentProps {
  title: string;
  user?: AuthUser;
}

// Functional components with explicit typing
export default function MyComponent({ title, user }: MyComponentProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(async () => {
    // Implementation
  }, []);

  return <MainLayout>{/* Component JSX */}</MainLayout>;
}
```

### Tool Page Pattern

Every tool page follows this structure:

```tsx
'use client';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';

export default function ToolPage() {
  const [error, setError] = useState('');

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto'>
          <ToolPageHeader
            title='Tool Name'
            description='Tool description for SEO and users.'
            infoMessage='Optional info message.'
            error={error}
          />

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Settings/Input Card */}
            {/* Result/Output Card */}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
```

### API Route Pattern

```tsx
import { NextRequest, NextResponse } from 'next/server';

// Define request/response interfaces
interface MyRequest {
  field: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MyRequest = await request.json();

    // Validate input
    if (!body.field) {
      return NextResponse.json({ error: 'Field is required' }, { status: 400 });
    }

    // Process request
    const result = await processData(body);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Authentication System

### Architecture

- **Provider**: AWS Cognito with OAuth2 + PKCE
- **Token Storage**: HttpOnly cookies (`cognito_id_token`, `cognito_refresh_token`)
- **Session**: Server-side JWT decoding in `src/lib/auth.ts`
- **Auth pages**: `/login`, `/signup`, `/forgot-password` (self-contained pages)

### User Roles

```typescript
type UserRole = 'admin' | 'pro' | 'free';
```

- **admin**: Full access to all features
- **pro**: Access to premium features (translately, etc.)
- **free**: Basic features only

### Auth Context Usage

```tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { hasRole } from '@/lib/utils';

function MyComponent() {
  const { user } = useAuth();

  // Check if user has pro access
  if (hasRole(user, ['pro'])) {
    // Show pro features
  }
}
```

### Pro-Only Feature Gating

```tsx
import { ProAccessOnly } from '@/components/layouts/pro-access-only';

function ProFeaturePage() {
  return <ProAccessOnly>{/* Pro-only content */}</ProAccessOnly>;
}
```

## Styling

### Tailwind CSS v4

- Use utility classes directly in JSX
- Use `cn()` helper for conditional classes:

```tsx
import { cn } from '@/lib/utils';

<div
  className={cn(
    'base-classes',
    condition && 'conditional-class',
    variant === 'primary' && 'primary-styles'
  )}
/>;
```

### CSS Variables (Theme)

Key variables defined in `globals.css`:

```css
--background, --foreground
--primary, --primary-foreground
--secondary, --muted, --accent, --destructive
--border, --ring
--sidebar-*  /* Sidebar-specific colors */
```

### Dark Mode

- Handled by `next-themes` via class-based switching
- Use Tailwind's `dark:` prefix for dark mode styles

## Environment Variables

Required variables:

```bash
# AWS Cognito
COGNITO_DOMAIN=
COGNITO_CLIENT_ID=
COGNITO_SCOPES=

# Application
NEXT_PUBLIC_APP_URL=

# External APIs
API_BASE_URL=         # Base URL for backend API (e.g. https://api.elevensys.dev)
```

Access pattern:

```typescript
import { requireEnv } from '@/lib/utils';

// Throws if missing
const baseUrl = requireEnv('API_BASE_URL');
```

## Common Tasks

### Adding a New Tool

1. Create directory: `src/app/tools/[tool-name]/page.tsx`
2. Create API route if needed: `src/app/api/[tool-name]/route.ts`
3. Add navigation entry in `src/components/layouts/nav-tools.tsx`
4. Follow the existing tool page pattern with `MainLayout` and `ToolPageHeader`

### Adding a UI Component

```bash
# shadcn/ui component
npx shadcn@latest add [component-name]
```

Components are installed to `src/components/ui/`.

### Creating Types

1. Add type definitions to `src/types/[domain].ts`
2. Export from the type file directly (no barrel files)
3. Import with: `import type { MyType } from '@/types/domain';`

### Adding a Custom Hook

1. Create file: `src/hooks/use-[hook-name].ts`
2. Follow React hooks naming convention
3. Export the hook function directly

## Best Practices

### Do

- Use TypeScript strict mode (already enabled)
- Prefer interfaces over types for object shapes
- Use `'use client'` only when necessary (hooks, browser APIs)
- Destructure props in function signature
- Use `useCallback` and `useMemo` for expensive operations
- Handle loading and error states in UI
- Use `toast` from sonner for user notifications
- Keep components small and focused (single responsibility)

### Don't

- Don't use `any` type - use `unknown` and narrow
- Don't create barrel files (`index.ts` re-exports)
- Don't define types inside components
- Don't use array index as React keys for dynamic lists
- Don't mutate state directly - use immutable updates
- Don't use class components (except error boundaries)
- Don't store sensitive data in client-side state

## Testing

| Category          | Technology                                       |
| ----------------- | ------------------------------------------------ |
| Test Runner       | Jest 30 (via `next/jest`)                        |
| Component Testing | React Testing Library (`@testing-library/react`) |
| User Interactions | `@testing-library/user-event`                    |
| Assertions        | `@testing-library/jest-dom`                      |
| Environment       | jsdom (`jest-environment-jsdom`)                 |

### Commands

```bash
npm test                   # Run all tests
npm run test:coverage      # Run tests with coverage report
npx jest path/to/file      # Run a specific test file
```

### Configuration

- **Jest config**: `jest.config.ts` - uses `next/jest.js` with jsdom environment
- **Setup file**: `jest.setup.ts` - imports `@testing-library/jest-dom`
- **Path alias**: `@/` mapped to `<rootDir>/src/` via `moduleNameMapper`

### Test File Conventions

- Place test files next to the source file: `page.tsx` → `page.test.tsx`
- Test descriptions start with a verb: `renders`, `calls`, `displays`, `hides`, `passes`,
  `disables`, `checks`
- Mock hooks to control component state, mock complex UI components (Radix, layouts) as simple HTML
  elements
- Use `data-testid` on mocked components for reliable selection
- Group related tests with comments: `// --- Loading state ---`, `// --- Search card ---`

### Mocking Strategy

- **Hooks** (`useTimesheetSettings`, `useWorklogs`): Mock at module level with `jest.fn()` to
  control all state
- **Layout components** (`MainLayout`, `ToolPageHeader`): Mock as simple div wrappers rendering
  children/props
- **Child components** (`WorklogRow`, `BulkDeleteAction`): Mock with simplified HTML exposing key
  props via `data-testid`
- **UI components** (`Button`, `Card`, `Table`, `Checkbox`): Mock as native HTML equivalents
- **next/link**: Mock as `<a>` tag
- **lucide-react icons**: Mock as `<span>` with `data-testid`

## Performance Considerations

- **Turbopack**: Enabled for faster dev/build (Next.js 16 feature)
- **Server Components**: Root layout fetches auth server-side
- **Image Optimization**: Use `next/image` for images
- **Font Optimization**: Using `next/font` with Ubuntu font
- **Code Splitting**: Tool pages are naturally code-split by route

## Path Aliases

Configured in `tsconfig.json`:

```typescript
@/*           → ./src/*
@/components/* → ./src/components/*
@/styles/*    → ./src/styles/*
```

## Related Documentation

- `.github/repo-instructions.md` - Detailed development guidelines
- `.github/copilot-instructions.md` - Copilot-specific guidelines
- `.github/nextjs-instructions.md` - Extended Next.js patterns

## Code Review Sub-Agent Routing

**Parallel dispatch** (all conditions met):

- Reviewing independent modules/files with no shared state
- Tasks are read-only (no file modification risk)

**Sequential dispatch** (any condition triggers):

- One review feeds the next (readability → then optimize refactored code)
- Shared files between agents

**Agent Selection**:

- "review", "readability", "naming" → code-reviewer
- "optimize", "slow", "performance", "render" → performance-optimizer
- "security", "best practice", "hardening", "AWS" → best-practices-enforcer

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
