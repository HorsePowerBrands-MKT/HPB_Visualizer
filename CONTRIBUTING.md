# Contributing to HPB Visualizer

Thank you for your interest in contributing to the HPB Visualizer project!

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd HPB_Visualizer
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   - Copy `apps/gatsby-glass/.env.example` to `apps/gatsby-glass/.env`
   - Add your API keys (Gemini, Supabase)

4. **Run development server**

   ```bash
   pnpm dev
   ```

## Project Structure

This is a **monorepo** with shared packages and brand-specific apps:

- `packages/` - Shared code used by all brands
  - `api-handlers` - AI/API integrations (Gemini, Supabase)
  - `prompt-templates` - Generic prompt template system
  - `types` - Shared TypeScript types
  - `visualizer-core` - Generic visualizer utilities

- `apps/` - Brand-specific applications
  - `gatsby-glass/` - Gatsby Glass brand application
    - `lib/` - Brand-specific code and constants
    - `prompts/` - Brand-specific prompt configurations
    - `app/` - Next.js routes
    - `components/` - UI components

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing or `unknown`
- Use interfaces for object shapes, types for unions
- Export types from appropriate packages

### React Components

- Use functional components with hooks
- Memoize expensive computations with `useMemo`
- Clean up side effects in `useEffect` return functions
- Add proper TypeScript types for props

### File Organization

- Keep brand-specific code in `apps/<brand>/`
- Keep shared/reusable code in `packages/`
- One component per file
- Co-locate related files (component + styles + tests)

## Branch Naming Conventions

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks

Examples:

- `feature/add-rate-limiting`
- `fix/image-validation-error`
- `refactor/extract-icon-component`

## Pull Request Requirements

1. **Code Quality**
   - No TypeScript errors (`pnpm typecheck`)
   - No ESLint warnings (`pnpm lint`)
   - Code follows project style guidelines

2. **Testing**
   - Test your changes manually
   - Verify core functionality still works
   - Check responsive design on mobile

3. **Documentation**
   - Update relevant documentation
   - Add code comments for complex logic
   - Update ARCHITECTURE.md if changing structure

4. **PR Description**
   - Clear title describing the change
   - Summary of what changed and why
   - Screenshots for UI changes
   - Link to related issues

## Adding a New Brand

To add a new brand to the visualizer:

1. Create brand folder: `apps/new-brand/`
2. Copy structure from `apps/gatsby-glass/`
3. Update brand-specific constants and types in `apps/new-brand/lib/`
4. Create brand-specific prompts in `apps/new-brand/prompts/`
5. Customize UI components as needed

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture information.

## Commit Message Format

Use clear, descriptive commit messages:

```
<type>: <short description>

<detailed description if needed>
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

- `feat: add input validation to API routes`
- `fix: resolve memory leak in image preview`
- `refactor: extract icon components for reusability`

## Getting Help

- Read the [ARCHITECTURE.md](ARCHITECTURE.md) for project structure
- Check existing issues and PRs for similar work
- Ask questions in pull request comments
- Review the prompt-templates README for template system details

## Code of Conduct

- Be respectful and professional
- Provide constructive feedback
- Help others learn and grow
- Focus on the code, not the person

Thank you for contributing!
