# Eleven Systems Web

A collection of productivity tools built with Next.js, React, and Tailwind CSS.

## Tools

| Tool | Description |
| --- | --- |
| **Urlify** | Shorten long URLs to make them easier to share and manage |
| **JSON Diffinity** | Compare two JSON payloads with editor-style highlighting |
| **JSON Objectify** | Transform JSON into clean JavaScript object notation |
| **Translately** | Translate between Vietnamese and English with tone control |
| **Passly** | Generate secure, random passwords with customizable options |
| **NPM Converter** | Convert Lerna publish output to npm install commands |
| **PR Link Shrinker** | Shorten GitHub PR URLs to a compact, readable format |
| **Summary Smith** | Generate formatted status summaries for Rally stories |
| **Prompt Templates** | Browse and copy prompt templates for AI agents and workflows |
| **Beatly** | Get song recommendations based on your favorite artists |

## Prerequisites

- Node.js 20+
- npm

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd elevensys-web
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

```
COGNITO_DOMAIN=         # Cognito Hosted UI domain
COGNITO_CLIENT_ID=      # Cognito OAuth client ID
COGNITO_REGION=us-east-1
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Create a production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run prettier` | Format code with Prettier |

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI, shadcn/ui
- **Auth:** AWS Cognito (OAuth 2.0 + PKCE)
