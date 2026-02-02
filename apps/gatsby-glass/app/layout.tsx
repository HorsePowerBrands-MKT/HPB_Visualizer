import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GatsbyView | Design Your Custom Shower',
  description: 'Visualize your dream shower with AI-powered design tools. Choose from hinged, pivot, or sliding doors with custom finishes and hardware.',
  keywords: 'shower glass, custom shower, bathroom design, glass doors, shower enclosure',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-white text-black p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          Skip to main content
        </a>
        <div className="flex flex-col min-h-screen">
          <main id="main-content" className="flex-grow bg-brand-black">
            <div className="container mx-auto px-4 py-8">
              <header className="mb-8">
                <h1 className="text-4xl md:text-5xl font-display text-center text-brand-secondary mb-2">
                  GATSBYVIEW
                </h1>
                <p className="text-center text-gray-400 font-sans">
                  Design your dream shower with AI-powered visualization
                </p>
              </header>
              {children}
            </div>
          </main>
          <footer className="bg-brand-black py-8 mt-8">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center space-y-4">
                <p className="text-sm text-gray-400 leading-relaxed">
                  GatsbyView visualizations are AI-generated simulations intended for design inspiration only. 
                  Actual material appearance, hardware scaling, and structural feasibility may vary based on 
                  your specific bathroom conditions. Final technical specifications and pricing will be confirmed 
                  during your professional in-home consultation.
                </p>
                <p className="text-xs text-gray-500">
                  © 2026 Gatsby Glass. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
