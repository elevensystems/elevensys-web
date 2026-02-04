# CLAUDE.md - AI Assistant Guide for Elevensys Web

This document provides comprehensive guidance for AI assistants working with the Elevensys Web codebase.

## Project Overview

**Elevensys Web** is a full-stack web application providing AI-powered productivity tools. It's built with Next.js 16 (App Router), React 19, and TypeScript 5, featuring AWS Cognito authentication with role-based access control.

### Quick Start

```bash
# Install dependencies (uses pnpm)
pnpm install

# Start development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Format code
pnpm prettier
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.0.10 (App Router, Turbopack) |
| UI Library | React 19.2.0 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Radix UI primitives |
| Icons | lucide-react |
| Editor | Monaco Editor |
| Auth | AWS Cognito OAuth2 (PKCE) |
| Theming | next-themes |
| Notifications | sonner |
| Package Manager | pnpm |

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API route handlers
│   │   ├── auth/           # OAuth2 endpoints (login, callback, logout, session)
│   │   ├── password-generator/
│   │   ├── song-recommender/
│   │   ├── translate/      # Pro-only feature
│   │   ├── url-shortener/
│   │   ├── templates/
│   │   └── feedback/
│   ├── tools/              # Tool pages (11 tools)
│   │   ├── password-generator/
│   │   ├── json-diffinity/
│   │   ├── json-objectify/
│   │   ├── translate/
│   │   ├── url-shortener/
│   │   ├── npm-converter/
│   │   ├── pr-link-shrinker/
│   │   ├── prompt-templates/
│   │   ├── song-recommender/
│   │   └── summary-smith/
│   ├── (auth)/             # Auth pages (route group)
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Homepage
├── components/
│   ├── ui/                 # shadcn/ui components (27 components)
│   ├── layouts/            # Layout components (direct imports only)
│   │   ├── main-layout.tsx
│   │   ├── auth-layout.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── tool-page-header.tsx
│   │   ├── nav-main.tsx
│   │   ├── nav-tools.tsx
│   │   ├── nav-user.tsx
│   │   ├── pro-access-only.tsx
│   │   ├── feedback-modal.tsx
│   │   └── support-modal.tsx
│   ├── features/           # Feature-specific components
│   │   └── auth/
│   ├── error-boundary.tsx  # React error boundary
│   └── theme-provider.tsx
├── contexts/
│   └── auth-context.tsx    # Auth state via React Context
├── hooks/
│   ├── use-mobile.ts       # Mobile breakpoint detection
│   └── use-copy-to-clipboard.ts  # Clipboard with feedback
├── lib/
│   ├── auth.ts             # JWT decoding, session helpers
│   ├── utils.ts            # cn(), hasRole(), requireEnv()
│   ├── constants.ts        # Shared UI constants (COPY_FEEDBACK_DURATION, etc.)
│   ├── ai-config.ts        # AI model config (DEFAULT_MODEL, MODEL_ALLOWLIST)
│   ├── api-helpers.ts      # Standardized API responses (badRequest, etc.)
│   ├── fetch-with-timeout.ts  # Timeout-aware fetch wrapper
│   ├── json-utils.ts       # JSON parsing and validation
│   ├── editor-config.ts    # Monaco Editor configurations
│   ├── diff.ts             # JSON diff utilities
│   └── shine-palettes.ts
├── types/
│   ├── auth.ts             # AuthUser, UserRole, JwtPayload
│   └── api.ts              # Request/response types for all APIs
└── styles/
    └── globals.css         # Global styles, CSS variables

public/
├── templates/              # Markdown prompt templates (9 files)
└── assets/                 # SVG icons, favicon
```

## Code Conventions

### Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MainLayout`, `ProAccessOnly` |
| Files/Folders | kebab-case | `password-generator`, `auth-context.tsx` |
| Variables/Functions | camelCase | `getUserFromSession`, `handleCopy` |
| Constants | UPPER_SNAKE_CASE | `AUTH_COOKIES`, `COPY_FEEDBACK_DURATION` |
| Types/Interfaces | PascalCase | `AuthUser`, `CharacterOptions` |

### File Organization

- **Feature-based structure**: Colocate related code within tool/feature directories
- **No barrel files**: Import directly from source files, not via `index.ts` re-exports
- **Type definitions**: Place shared types in `/types` folder, not inside components
- **Utilities**: General helpers go in `/lib` folder
- **Constants**: Shared constants in `/lib/constants.ts`, AI config in `/lib/ai-config.ts`

### Component Patterns

```tsx
// Always use 'use client' directive for client components
'use client';

// Import order (enforced by Prettier):
// 1. React imports
// 2. Next.js imports
// 3. Third-party libraries
// 4. @/ aliased imports (direct paths, no barrel files)
// 5. Relative imports

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import type { AuthUser } from '@/types/auth';

// Define interfaces above component
interface MyComponentProps {
  title: string;
  user?: AuthUser;
}

// Functional components with explicit typing
export default function MyComponent({ title, user }: MyComponentProps) {
  const [loading, setLoading] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  const handleAction = useCallback(async () => {
    // Implementation
  }, []);

  return (
    <MainLayout>
      {/* Component JSX */}
    </MainLayout>
  );
}
```

### Tool Page Pattern

Every tool page follows this structure:

```tsx
'use client';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

export default function ToolPage() {
  const [error, setError] = useState('');
  const { copied, copy } = useCopyToClipboard();

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

import { getValidModel } from '@/lib/ai-config';
import {
  badRequest,
  badGateway,
  errorResponse,
  gatewayTimeout,
  getErrorMessage,
} from '@/lib/api-helpers';
import { fetchWithTimeout, TimeoutError } from '@/lib/fetch-with-timeout';
import { requireEnv } from '@/lib/utils';
import type { MyRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body: MyRequest = await request.json();

    // Validate input using helper
    if (!body.field) {
      return badRequest('Field is required');
    }

    // Use fetchWithTimeout for external calls
    try {
      const response = await fetchWithTimeout(apiUrl, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return badGateway('External service error');
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      if (fetchError instanceof TimeoutError) {
        return gatewayTimeout('Request timed out');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('API error:', error);
    return errorResponse(
      'Failed to process request',
      500,
      getErrorMessage(error)
    );
  }
}
```

## Shared Utilities

### Constants (`lib/constants.ts`)

```typescript
import { COPY_FEEDBACK_DURATION, MAX_INPUT_LENGTH } from '@/lib/constants';
```

### AI Configuration (`lib/ai-config.ts`)

```typescript
import { getValidModel, DEFAULT_MODEL, MODEL_ALLOWLIST } from '@/lib/ai-config';

const model = getValidModel(userModel); // Returns valid model or default
```

### API Helpers (`lib/api-helpers.ts`)

```typescript
import {
  badRequest,      // 400
  unauthorized,    // 401
  forbidden,       // 403
  notFound,        // 404
  badGateway,      // 502
  serviceUnavailable, // 503
  gatewayTimeout,  // 504
  errorResponse,   // Custom status
  getErrorMessage, // Extract message from unknown error
} from '@/lib/api-helpers';
```

### Fetch with Timeout (`lib/fetch-with-timeout.ts`)

```typescript
import { fetchWithTimeout, TimeoutError } from '@/lib/fetch-with-timeout';

try {
  const response = await fetchWithTimeout(url, options);
} catch (error) {
  if (error instanceof TimeoutError) {
    // Handle timeout
  }
}
```

### JSON Utilities (`lib/json-utils.ts`)

```typescript
import { parseJsonSafely, formatJson, isValidUrl } from '@/lib/json-utils';

const { value, error, isValid } = parseJsonSafely(jsonString);
const formatted = await formatJson(jsonString);
const valid = isValidUrl(urlString);
```

### Copy to Clipboard Hook (`hooks/use-copy-to-clipboard.ts`)

```typescript
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

const { copied, copy, reset } = useCopyToClipboard({
  feedbackDuration: 2000,
  onCopy: () => toast.success('Copied!'),
});

await copy(text);
```

### Editor Configuration (`lib/editor-config.ts`)

```typescript
import {
  MONACO_DEFAULT_OPTIONS,
  MONACO_JSON_OPTIONS,
  MONACO_READONLY_OPTIONS,
} from '@/lib/editor-config';

<Editor options={MONACO_JSON_OPTIONS} />
```

## Authentication System

### Architecture

- **Provider**: AWS Cognito with OAuth2 + PKCE
- **Token Storage**: HttpOnly cookies (`cognito_id_token`, `cognito_refresh_token`)
- **Session**: Server-side JWT decoding in `src/lib/auth.ts`

### User Roles

```typescript
type UserRole = 'admin' | 'pro' | 'free';
```

- **admin**: Full access to all features
- **pro**: Access to premium features (translate, etc.)
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
import ProAccessOnly from '@/components/layouts/pro-access-only';

function ProFeaturePage() {
  return (
    <ProAccessOnly>
      {/* Pro-only content */}
    </ProAccessOnly>
  );
}
```

## Styling

### Tailwind CSS v4

- Use utility classes directly in JSX
- Use `cn()` helper for conditional classes:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  condition && 'conditional-class',
  variant === 'primary' && 'primary-styles'
)} />
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
OPENAI_URL=           # For song recommender
URL_SHORTENER_API=    # For URL shortener
```

Access pattern:

```typescript
import { requireEnv } from '@/lib/utils';

// Throws if missing
const apiUrl = requireEnv('OPENAI_URL');
```

## Common Tasks

### Adding a New Tool

1. Create directory: `src/app/tools/[tool-name]/page.tsx`
2. Create API route if needed: `src/app/api/[tool-name]/route.ts`
3. Add navigation entry in `src/components/layouts/nav-tools.tsx`
4. Follow the existing tool page pattern with `MainLayout` and `ToolPageHeader`
5. Use shared utilities: `useCopyToClipboard`, `parseJsonSafely`, etc.

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
- Use shared utilities from `/lib` to avoid code duplication
- Import components directly (no barrel files)

### Don't

- Don't use `any` type - use `unknown` and narrow
- Don't create barrel files (`index.ts` re-exports)
- Don't define types inside components
- Don't use array index as React keys for dynamic lists
- Don't mutate state directly - use immutable updates
- Don't use class components (except error boundaries)
- Don't store sensitive data in client-side state
- Don't duplicate constants - use `/lib/constants.ts`

## Testing

**Note**: No testing framework is currently configured. When adding tests:

- Consider Jest or Vitest for unit/integration tests
- Use React Testing Library for component tests
- Follow the existing code patterns for testability

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
