import type { GlassStyle, HardwareFinish, EnclosureType, HandleStyle, TrackPreference, ShowerShape } from '@repo/types';

// Glass styles catalog (user-facing descriptions)
export const glassStyles: Record<GlassStyle, { name: string; description: string }> = {
  clear: {
    name: 'Clear Glass',
    description: 'Classic tempered glass, our most popular option'
  },
  low_iron: {
    name: 'Low Iron',
    description: 'Premium ultra-clear glass for maximum transparency'
  },
  p516: {
    name: 'P516 Pattern',
    description: 'Elegant rain texture for added privacy'
  }
};

// Hardware finishes catalog (user-facing descriptions)
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
    description: 'Classic swing-out door design'
  },
  pivot: {
    name: 'Pivot Door',
    description: 'Sleek floating appearance with top and bottom pivots'
  },
  sliding: {
    name: 'Sliding Door',
    description: 'Space-saving bypass or barn-style operation'
  }
};

// Handle styles catalog (user-facing descriptions)
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
    description: 'Ergonomic curved D-shaped handle'
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
    description: 'Clean, modern look with minimal hardware'
  },
  semi_frameless: {
    name: 'Semi-Frameless',
    description: 'Streamlined door with structured fixed panels'
  },
  framed: {
    name: 'Framed',
    description: 'Traditional style with full metal detailing'
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
