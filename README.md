# HPB Visualizer Monorepo

A Next.js monorepo for Horse Power Brands visualizer applications. Built with TypeScript, Tailwind CSS, and pnpm workspaces.

## Architecture

This is a monorepo containing:
- **Shared packages** (`packages/`) - Reusable code across all brand apps
- **Brand apps** (`apps/`) - Individual Next.js applications for each brand

### Packages

- **`@repo/types`** - Shared TypeScript type definitions
- **`@repo/constants`** - Product catalogs and configuration utilities
- **`@repo/api-handlers`** - API integration logic (Gemini AI, Supabase)
- **`@repo/visualizer-core`** - React hooks and core visualizer logic

### Apps

- **`gatsby-glass`** - Gatsby Glass shower visualizer application

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **AI**: Google Gemini 2.5 Flash
- **Database**: Supabase
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` in `apps/gatsby-glass/`:

```bash
cd apps/gatsby-glass
cp .env.example .env
```

Then configure the following variables:

- `GEMINI_API_KEY` - Your Google Gemini API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key

### Development

```bash
# Run Gatsby Glass app in development mode
pnpm dev

# Or run a specific app
pnpm --filter gatsby-glass dev
```

The app will be available at `http://localhost:3000`.

### Building

```bash
# Build all packages
pnpm build

# Build specific app
pnpm --filter gatsby-glass build
```

### Linting

```bash
# Lint all packages
pnpm lint

# Lint specific app
pnpm --filter gatsby-glass lint
```

## Project Structure

```
HPB_Visualizer/
├── apps/
│   └── gatsby-glass/          # Gatsby Glass Next.js app
│       ├── app/                # Next.js App Router
│       │   ├── api/           # API routes
│       │   ├── layout.tsx     # Root layout
│       │   ├── page.tsx       # Home page
│       │   └── globals.css    # Global styles
│       ├── components/        # React components
│       │   ├── ui/            # UI components
│       │   ├── GatsbyGlassVisualizer.tsx
│       │   └── ContactFormModal.tsx
│       ├── public/            # Static assets
│       └── package.json
├── packages/
│   ├── types/                 # TypeScript types
│   ├── constants/             # Catalogs and config
│   ├── api-handlers/          # API integrations
│   └── visualizer-core/       # Core hooks and utilities
├── temp/                      # Original reference app
├── package.json               # Root package.json
├── pnpm-workspace.yaml        # Workspace configuration
└── tsconfig.json              # Root TypeScript config
```

## Deployment

### Vercel Deployment

Each brand app deploys separately to Vercel:

1. **Create a new Vercel project** for the brand (e.g., "gatsby-glass")

2. **Configure project settings:**
   - Framework Preset: Next.js
   - Root Directory: `apps/gatsby-glass`
   - Build Command: (uses vercel.json)
   - Output Directory: `.next`

3. **Set environment variables** in Vercel dashboard:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

4. **Deploy:**
   ```bash
   # Push to main branch or deploy via Vercel CLI
   vercel --prod
   ```

### Database Setup (Supabase)

Create a `leads` table in Supabase:

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  zip_code TEXT NOT NULL,
  visualization_image_url TEXT,
  original_image_url TEXT,
  door_type TEXT,
  finish TEXT,
  hardware TEXT,
  shower_shape TEXT,
  status TEXT DEFAULT 'new',
  source TEXT DEFAULT 'Visualizer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for common queries
CREATE INDEX idx_leads_zip_code ON leads(zip_code);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
```

## Adding a New Brand

To add a new brand visualizer:

1. **Copy the Gatsby Glass app:**
   ```bash
   cp -r apps/gatsby-glass apps/brand-name
   ```

2. **Update `package.json`:**
   ```json
   {
     "name": "brand-name",
     ...
   }
   ```

3. **Customize branding:**
   - Update `tailwind.config.ts` with brand colors
   - Update `app/layout.tsx` metadata
   - Replace brand-specific assets and icons

4. **Deploy to Vercel:**
   - Create new Vercel project
   - Set Root Directory to `apps/brand-name`
   - Configure environment variables

## Features

### Gatsby Glass Visualizer

- **AI-Powered Visualization**: Generate photorealistic shower glass installations using Google Gemini
- **Image Validation**: Automatic bathroom photo validation and shower shape detection
- **Two Design Modes**:
  - **Configure**: Choose door type, glass style, hardware finish, and handle style
  - **Inspiration**: Upload inspiration photo to match style
- **Smart Configuration**: Auto-detects neo-angle showers and adjusts door options
- **Design History**: Save and compare multiple generated designs
- **Lead Capture**: Save designs and request quotes with Supabase integration

### Shared Capabilities

All shared packages are available to new brand apps:
- Type-safe API handlers
- Product catalog system
- Validation utilities
- Image processing
- Visualizer state management

## Contributing

1. Create a feature branch
2. Make changes in appropriate package or app
3. Test locally with `pnpm dev`
4. Build to verify: `pnpm build`
5. Submit pull request

## Troubleshooting

### Build Errors

If you encounter build errors, try:

```bash
# Clean node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# Clean build artifacts
rm -rf apps/*/.next packages/*/dist
pnpm build
```

### TypeScript Errors

Ensure all workspace dependencies are properly linked:

```bash
pnpm install --force
```

### pnpm Installation Issues

Make sure you're using pnpm >= 8:

```bash
pnpm --version
# If needed: npm install -g pnpm@latest
```

## License

Proprietary - Horse Power Brands
