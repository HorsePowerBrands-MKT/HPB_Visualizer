# HPB Visualizer

A multi-brand AI-powered visualizer platform built with Next.js, TypeScript, and Google Gemini AI.

## Overview

HPB Visualizer is a monorepo that enables multiple Horse Power Brands to offer AI-powered product visualization tools to their customers. Each brand gets its own Next.js app with brand-specific products, prompts, and UI, while sharing common infrastructure (AI integration, template engine, image utilities, database clients).

### Current Brands

- **Gatsby Glass** (`apps/gatsby-glass/`) -- Shower glass visualization

### Planned Brands

- Stand Strong Fencing
- Bumble Bee Blinds
- Groovy Hues Painting

### Key Features

- **AI-Powered Visualization**: Upload a photo and instantly see it with different product configurations
- **Multi-Brand Support**: Shared codebase with brand-specific customization
- **Real-Time Validation**: AI validates uploaded images to ensure quality results
- **Lead Generation**: Built-in contact form for customer inquiries
- **Type-Safe**: Full TypeScript implementation across the stack

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Google Gemini API key
- Supabase account (for lead storage)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/gatsby-glass/.env.example apps/gatsby-glass/.env
# Edit .env with your API keys

# Run development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
HPB_Visualizer/
├── packages/                # Shared code for ALL brands
│   ├── api-handlers/       # Gemini AI + Supabase clients
│   ├── prompt-templates/   # Template engine (processor, cache, registry)
│   ├── types/              # Generic types (ImageData, GenericLead, etc.)
│   └── visualizer-core/    # Image utils, HEIC conversion, base64
│
├── apps/                    # Brand-specific applications
│   └── gatsby-glass/       # Gatsby Glass brand
│       ├── app/            # Next.js routes + API endpoints
│       ├── components/     # UI components + wizard steps
│       ├── hooks/          # Brand-specific React hooks
│       ├── lib/            # Product types, catalog, config
│       ├── prompts/        # AI prompt templates + product descriptions
│       └── public/         # Static assets (logos, fonts)
│
├── supabase/                # Database migrations
├── ARCHITECTURE.md          # Detailed architecture docs
└── CONTRIBUTING.md          # Contribution guidelines
```

## Available Scripts

```bash
# Development
pnpm dev              # Start Gatsby Glass dev server (default)
pnpm dev:gatsby       # Start Gatsby Glass dev server (explicit)

# Building
pnpm build            # Build all packages and apps
pnpm build:gatsby     # Build Gatsby Glass only

# Linting
pnpm lint             # Run ESLint across all packages

# Cleaning
pnpm clean            # Remove build artifacts
```

## Architecture

This project follows a **clean separation** between:

- **Shared packages** (`packages/`) - Reusable code for all brands
- **Brand apps** (`apps/`) - Brand-specific implementations

This architecture allows:
- Easy addition of new brands
- Shared improvements benefit all brands
- Brand-specific customization without affecting others

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed information.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: Google Gemini API
- **Database**: Supabase
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm (workspaces)
- **Validation**: Zod

## Shared Packages

### @repo/api-handlers

Generic API integrations: Gemini AI client, Supabase database client, image storage, validation.

### @repo/prompt-templates

Template engine with variable interpolation, conditional sections, caching. Brands register their templates via `registerBrandTemplates()`.

### @repo/visualizer-core

Image processing utilities: base64 conversion, compression, HEIC-to-JPEG conversion, file validation.

### @repo/types

Generic TypeScript types (`ImageData`, `GenericLead`, `GenericGenerationRecord`, `APIError`, etc.) plus backward-compatible re-exports of Gatsby Glass types.

## Environment Variables

Required environment variables for `apps/gatsby-glass`:

```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Development Workflow

1. Make changes to code
2. Test locally with `pnpm dev`
3. Run type checking: `pnpm typecheck`
4. Run linting: `pnpm lint`
5. Create pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Adding a New Brand

1. **Create the app directory**: `apps/<brand-name>/`
2. **Set up Next.js**: `package.json` with workspace dependencies (`@repo/api-handlers`, `@repo/prompt-templates`, `@repo/visualizer-core`, `@repo/types`)
3. **Define product types**: `lib/<brand>-types.ts` with brand-specific product options
4. **Create product catalog**: `lib/<brand>-constants/` with product names, descriptions, and config
5. **Write prompt templates**: `prompts/<brand>-templates.ts` describing how AI should visualize the brand's products
6. **Build wizard UI**: `hooks/useVisualizerState.ts` and `components/` with brand-specific wizard flow
7. **Add deployment config**: `vercel.json` with `--filter <brand-name>` build command
8. **Add root scripts**: `dev:<brand>` and `build:<brand>` to root `package.json`

See [ARCHITECTURE.md](ARCHITECTURE.md) for a full example with file tree and dependency diagram.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and design decisions
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [packages/prompt-templates/README.md](packages/prompt-templates/README.md) - Prompt system docs

## Support

For questions or issues:
- Review the documentation files
- Check existing GitHub issues
- Create a new issue with details

## License

Proprietary - Horse Power Brands

---

Built with ❤️ by the HPB team
