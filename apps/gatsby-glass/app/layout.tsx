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
          <main id="main-content" className="flex-grow bg-brand-brown">
            <div className="w-full p-2">
              {/* App Header */}
              <header className="text-center py-6">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-brand-gold tracking-wider">
                  GATSBYVIEW
                </h1>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <span className="text-sm md:text-base text-white/80 tracking-widest uppercase font-sans">Visualize</span>
                  <span className="text-brand-gold text-lg">&#x2022;</span>
                  <span className="text-sm md:text-base text-white/80 tracking-widest uppercase font-sans">Personalize</span>
                  <span className="text-brand-gold text-lg">&#x2022;</span>
                  <span className="text-sm md:text-base text-white/80 tracking-widest uppercase font-sans">Realize</span>
                </div>
                <div className="mt-5">
                  <img src="/GG-Deco-Element.svg" alt="" className="w-full h-auto" />
                </div>
              </header>

              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
