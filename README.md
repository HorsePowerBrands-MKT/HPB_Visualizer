# HPB Visualizer

A multi-brand AI-powered shower visualizer platform built with Next.js, TypeScript, and Google Gemini AI.

## Overview

HPB Visualizer is a monorepo that enables multiple brands to offer AI-powered bathroom visualization tools to their customers. The platform uses Google's Gemini AI to generate photorealistic visualizations of custom shower configurations.

### Key Features

- **AI-Powered Visualization**: Upload a bathroom photo and instantly see it with different shower configurations
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
├── packages/              # Shared code for all brands
│   ├── api-handlers/     # AI/API integrations
│   ├── prompt-templates/ # Template engine
│   ├── types/            # Shared TypeScript types
│   └── visualizer-core/  # Core utilities
│
├── apps/                  # Brand-specific applications
│   └── gatsby-glass/     # Gatsby Glass brand
│       ├── lib/          # Brand code & constants
│       ├── prompts/      # Brand prompts
│       ├── app/          # Next.js routes
│       └── components/   # UI components
│
├── ARCHITECTURE.md        # Detailed architecture docs
└── CONTRIBUTING.md        # Contribution guidelines
```

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server

# Building
pnpm build            # Build all packages and apps

# Type checking
pnpm typecheck        # Run TypeScript compiler

# Linting
pnpm lint             # Run ESLint

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

## Key Packages

### @repo/api-handlers
Generic API integrations for AI and database operations.

### @repo/prompt-templates
JSON-based prompt template system for easy customization.

### @repo/visualizer-core
Core React hooks and utilities for visualizer functionality.

### @repo/types
Shared TypeScript types across the monorepo.

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

To add a new brand:

1. Create folder: `apps/new-brand/`
2. Copy structure from `apps/gatsby-glass/`
3. Customize brand-specific code in `lib/` and `prompts/`
4. Update configuration and deploy

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed instructions.

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
