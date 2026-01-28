import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gatsby Glass Visualizer | Design Your Custom Shower',
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
      <body className={inter.className}>
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-white text-black p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          Skip to main content
        </a>
        <main id="main-content" className="min-h-screen bg-brand-black">
          <div className="container mx-auto px-4 py-8">
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-center text-brand-secondary mb-2">
                Gatsby Glass Visualizer
              </h1>
              <p className="text-center text-gray-400">
                Design your dream shower with AI-powered visualization
              </p>
            </header>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
