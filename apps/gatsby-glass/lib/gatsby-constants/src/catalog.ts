import type { GlassStyle, HardwareFinish, EnclosureType, HandleStyle, TrackPreference, ShowerShape } from '@repo/types';

// Glass styles catalog
export const glassStyles: Record<GlassStyle, { name: string; description: string }> = {
  clear: {
    name: 'Clear Glass',
    description: 'Standard clear tempered glass with subtle greenish tint'
  },
  low_iron: {
    name: 'Low Iron',
    description: 'Ultra-clear glass with minimal color tint for maximum clarity'
  },
  p516: {
    name: 'P516 Pattern',
    description: 'Textured glass with P516 pattern for privacy'
  }
};

// Hardware finishes catalog
export const hardwareFinishes: Record<HardwareFinish, { name: string; description: string }> = {
  chrome: {
    name: 'Polished Chrome',
    description: 'Mirror-like chrome finish with high reflectivity'
  },
  brushed_nickel: {
    name: 'Brushed Nickel',
    description: 'Soft satin nickel with brushed texture'
  },
  matte_black: {
    name: 'Matte Black',
    description: 'Modern flat black finish'
  },
  polished_brass: {
    name: 'Polished Brass',
    description: 'Luxurious gold-toned brass finish'
  },
  oil_rubbed_bronze: {
    name: 'Oil Rubbed Bronze',
    description: 'Rich bronze with oil-rubbed patina'
  }
};

// Enclosure types catalog
export const enclosureTypes: Record<EnclosureType, { name: string; description: string }> = {
  hinged: {
    name: 'Hinged Door',
    description: 'Traditional hinged door that swings open'
  },
  pivot: {
    name: 'Pivot Door',
    description: 'Center-pivot door with modern aesthetic'
  },
  sliding: {
    name: 'Sliding Door',
    description: 'Space-saving sliding door system'
  }
};

// Handle styles catalog
export const handleStyles: Record<HandleStyle, { name: string; description: string }> = {
  ladder: {
    name: 'Ladder Pull',
    description: 'Vertical ladder-style pull handle'
  },
  square: {
    name: 'Square Pull',
    description: 'Modern square profile pull'
  },
  d_pull: {
    name: 'Crescent (D) Pull',
    description: 'D-shaped crescent pull handle'
  },
  knob: {
    name: 'Knob',
    description: 'Classic round knob handle'
  }
};

// Framing/track preferences catalog
export const trackPreferences: Record<TrackPreference, { name: string; description: string }> = {
  frameless: {
    name: 'Frameless',
    description: 'Clean frameless design with minimal hardware'
  },
  semi_frameless: {
    name: 'Semi-Frameless',
    description: 'Partial framing for added stability'
  },
  framed: {
    name: 'Framed',
    description: 'Full frame around glass panels'
  }
};

// Complete catalog export
export const CATALOG = {
  glassStyles,
  hardwareFinishes,
  enclosureTypes,
  handleStyles,
  trackPreferences
};
