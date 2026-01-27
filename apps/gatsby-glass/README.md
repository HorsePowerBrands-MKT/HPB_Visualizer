# Gatsby Glass Visualizer

AI-powered shower glass visualization tool for Gatsby Glass franchisees and customers.

## Features

- **AI Visualization**: Generate photorealistic shower glass installations using Google Gemini 2.5 Flash
- **Image Validation**: Automatic bathroom photo validation and shower shape detection (standard, neo-angle, tub)
- **Two Design Modes**:
  - **Configure Your Own**: Choose specific door types, glass styles, hardware finishes, and handle styles
  - **Match Inspiration**: Upload an inspiration photo to replicate the style in your bathroom
- **Smart Configuration**:
  - Auto-detects shower shapes and adjusts door options
  - Neo-angle showers automatically restricted to hinged doors
  - Dynamic configuration UI based on selected door type
- **Design History**: Generate and compare multiple design options
- **Lead Capture**: Integrated form for saving designs and requesting quotes
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide icons
- **AI**: Google Gemini 2.5 Flash (image generation and validation)
- **Database**: Supabase (lead storage)
- **State Management**: Custom React hooks from `@repo/visualizer-core`
- **Shared Packages**:
  - `@repo/types` - Type definitions
  - `@repo/constants` - Product catalogs
  - `@repo/api-handlers` - API integrations
  - `@repo/visualizer-core` - Core logic

## Local Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Setup

1. **Install dependencies** (from root):
   ```bash
   pnpm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your credentials:
   - `GEMINI_API_KEY` - Get from Google AI Studio
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anon key
   - `SUPABASE_SERVICE_KEY` - Supabase service role key

3. **Run development server**:
   ```bash
   # From root
   pnpm dev
   
   # Or from this directory
   cd apps/gatsby-glass
   pnpm dev
   ```

4. **Open** `http://localhost:3000`

### Build

```bash
# From root
pnpm --filter gatsby-glass build

# Or from this directory
pnpm build
```

## Project Structure

```
apps/gatsby-glass/
├── app/
│   ├── api/                     # Next.js API routes
│   │   ├── validate-image/      # Image validation endpoint
│   │   ├── generate-visualization/  # AI generation endpoint
│   │   └── submit-lead/         # Lead submission endpoint
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/
│   ├── GatsbyGlassVisualizer.tsx   # Main visualizer component
│   ├── ContactFormModal.tsx        # Lead capture modal
│   └── ui/                         # UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Label.tsx
│       ├── RadioGroup.tsx
│       └── Select.tsx
├── public/                      # Static assets
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

## API Routes

### POST `/api/validate-image`

Validates bathroom photos and detects shower shape.

**Request:**
```json
{
  "imageData": "base64_encoded_image",
  "mimeType": "image/jpeg"
}
```

**Response:**
```json
{
  "valid": true,
  "shape": "neo_angle",
  "reason": null
}
```

### POST `/api/generate-visualization`

Generates AI visualization of shower glass installation.

**Request:**
```json
{
  "bathroomImage": {
    "data": "base64_encoded_image",
    "mimeType": "image/jpeg"
  },
  "inspirationImage": {
    "data": "base64_encoded_image",
    "mimeType": "image/jpeg"
  },
  "prompt": "Detailed prompt describing the installation..."
}
```

**Response:**
```json
{
  "image": "data:image/png;base64,..."
}
```

### POST `/api/submit-lead`

Submits lead information to Supabase.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "zipCode": "12345",
  "visualizationImage": "data:image/png;base64,...",
  "originalImage": "data:image/jpeg;base64,...",
  "doorType": "hinged",
  "finish": "clear",
  "hardware": "matte_black",
  "showerShape": "standard",
  "source": "Gatsby Glass Visualizer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your information has been submitted successfully",
  "leadId": "uuid"
}
```

## Configuration Options

### Door Types

- **Hinged**: Traditional hinged door with options for ceiling height and swing direction
- **Pivot**: Center-pivot door with swing direction options
- **Sliding**: Space-saving sliding door with single or double configurations

### Glass Styles

- **Clear Glass**: Standard clear tempered glass
- **Low Iron**: Ultra-clear glass with minimal tint
- **P516 Pattern**: Textured glass for privacy

### Hardware Finishes

- **Polished Chrome**: Mirror-like chrome
- **Brushed Nickel**: Soft satin nickel
- **Matte Black**: Modern flat black
- **Polished Brass**: Luxurious gold-toned brass
- **Oil Rubbed Bronze**: Rich bronze with patina

### Handle Styles

- **Ladder Pull**: Vertical ladder-style pull
- **Square Pull**: Modern square profile
- **Crescent (D) Pull**: D-shaped crescent pull
- **Knob**: Classic round knob

## Customization

### Brand Colors

Edit `tailwind.config.ts`:

```typescript
colors: {
  'brand-primary': '#a37529',      // Gold
  'brand-secondary': '#e4bf6e',    // Light gold
  'brand-black': '#0a0a0a',        // Background
  'brand-black-secondary': '#171717', // Secondary background
}
```

### Product Catalog

Modify `packages/constants/src/catalog.ts` to update product options.

### Custom Icons

Replace HubSpot CDN URLs in `components/GatsbyGlassVisualizer.tsx` with your own icon assets.

## Deployment

### Vercel

1. **Connect repository** to Vercel
2. **Configure project**:
   - Framework: Next.js
   - Root Directory: `apps/gatsby-glass`
3. **Set environment variables** in Vercel dashboard
4. **Deploy**

### Other Platforms

This app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Self-hosted with Node.js

## Testing

### Manual Testing Checklist

- [ ] Upload bathroom photo
- [ ] Verify shape detection (standard, neo-angle, tub)
- [ ] Test "Design Your Own" mode
  - [ ] Select hinged door with all configurations
  - [ ] Select pivot door with all configurations
  - [ ] Select sliding door (single and double)
  - [ ] Test all glass styles
  - [ ] Test all hardware finishes
  - [ ] Test all handle styles
- [ ] Test "Match Inspiration" mode
  - [ ] Upload inspiration photo
  - [ ] Generate visualization
- [ ] Test design history
  - [ ] Generate multiple designs
  - [ ] Select previous designs
  - [ ] Compare before/after toggle
- [ ] Test lead capture
  - [ ] "Save & Send to Me" form
  - [ ] "Request Quote" form
  - [ ] Form validation
  - [ ] Successful submission
- [ ] Test responsive design on mobile

## Support

For issues or questions:
- Technical: Contact development team
- Product: Contact Gatsby Glass support

## License

Proprietary - Gatsby Glass
