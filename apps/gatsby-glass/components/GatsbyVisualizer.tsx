'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GatsbyGlassVisualizer } from './GatsbyGlassVisualizer';
import { GatsbyRailingVisualizer } from './GatsbyRailingVisualizer';
import { ProductModuleStep, type VisualizerProductModule } from './wizard/ProductModuleStep';
import { Card, CardContent } from './ui/Card';

const MODULE_PARAM = 'module';

const isProductModule = (value: string | null): value is VisualizerProductModule =>
  value === 'shower' || value === 'railing';

/**
 * Top-level visualizer: routes to the Shower Glass or Glass Railing module.
 * The choice is mirrored in `?module=` so links can deep-link to a module
 * and a reload keeps the user where they were.
 */
export const GatsbyVisualizer: React.FC = () => {
  const [productModule, setProductModule] = useState<VisualizerProductModule | null>(null);

  // Read the module from the URL once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromUrl = new URLSearchParams(window.location.search).get(MODULE_PARAM);
    if (isProductModule(fromUrl)) setProductModule(fromUrl);
  }, []);

  const selectModule = useCallback((next: VisualizerProductModule | null) => {
    setProductModule(next);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (next) {
      url.searchParams.set(MODULE_PARAM, next);
    } else {
      url.searchParams.delete(MODULE_PARAM);
    }
    window.history.replaceState(window.history.state, '', url.toString());
  }, []);

  const changeProduct = useCallback(() => selectModule(null), [selectModule]);

  if (productModule === 'shower') {
    return <GatsbyGlassVisualizer onChangeProduct={changeProduct} />;
  }

  if (productModule === 'railing') {
    return <GatsbyRailingVisualizer onChangeProduct={changeProduct} />;
  }

  return (
    <div className="mx-auto">
      <Card className="shadow-none bg-brand-brown border-0">
        <CardContent className="p-0">
          <ProductModuleStep value={productModule} onSelect={selectModule} />
        </CardContent>
      </Card>
    </div>
  );
};
