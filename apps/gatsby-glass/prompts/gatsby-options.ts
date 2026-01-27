/**
 * Option-Specific Descriptions
 * 
 * Detailed descriptions for each configurable option.
 * These get injected into prompts to give the AI clear visual instructions.
 * 
 * EDIT THESE to change how each option is described to the AI.
 */

export const doorTypeDescriptions = {
  hinged: {
    name: "Hinged Door",
    description: `A HINGED GLASS DOOR that swings open on side-mounted hinges.
CRITICAL VISUAL REQUIREMENTS:
- The door must have visible HINGES on one side (typically 2-3 hinges)
- The door swings outward or inward on the hinges
- It should be a FULL DOOR that closes the shower opening completely
- NOT a fixed glass panel - this is a FUNCTIONAL SWINGING DOOR
- The hinges should match the specified hardware finish
- Include a HANDLE on the opposite side from the hinges
- The door should appear to close flush against any fixed glass panels or walls`,
  },

  pivot: {
    name: "Pivot Door", 
    description: `A PIVOT GLASS DOOR that rotates on top and bottom pivot points.
CRITICAL VISUAL REQUIREMENTS:
- The door pivots/rotates on a CENTER or OFFSET pivot point
- Pivot hardware visible at TOP and BOTTOM of the door
- The door can swing BOTH directions (in and out)
- NOT hinged on the side - the pivot mechanism is different
- Creates a modern, minimalist look
- The pivot hardware should match the specified finish
- Include a HANDLE for opening
- The door should appear balanced on its pivot axis`,
  },

  sliding: {
    name: "Sliding Door",
    description: `A SLIDING GLASS DOOR that moves horizontally on a track system.
CRITICAL VISUAL REQUIREMENTS:
- Visible TRACK/RAIL at the top (and optionally bottom)
- The door SLIDES horizontally, it does NOT swing
- Rollers or glides visible at the top of the door
- May have one or two sliding panels
- Track hardware should match the specified finish
- Include a HANDLE for sliding the door
- The door should appear to glide smoothly on its track
- Often used for wider shower openings`,
  },
};

export const glassStyleDescriptions = {
  clear: {
    name: "Clear Glass",
    description: `Standard CLEAR tempered glass.
- Fully transparent with excellent visibility
- May have a subtle greenish tint (normal for standard glass)
- Shows everything behind it clearly
- Professional, classic look`,
  },

  low_iron: {
    name: "Low Iron / Ultra Clear",
    description: `ULTRA-CLEAR low-iron glass (also called Starphire).
- Crystal clear with NO green tint
- Maximum transparency and clarity
- Premium, high-end appearance
- Colors appear true through the glass
- More expensive, luxury option`,
  },

  p516: {
    name: "P516 Pattern / Frosted",
    description: `P516 PATTERNED/FROSTED glass for privacy.
- Textured or frosted surface
- Obscures visibility while allowing light through
- Provides PRIVACY in the shower
- Still allows natural light to pass
- Modern, spa-like aesthetic`,
  },
};

export const hardwareFinishDescriptions = {
  chrome: {
    name: "Polished Chrome",
    description: `POLISHED CHROME hardware finish.
- Mirror-like, highly reflective silver surface
- Bright, shiny metallic appearance
- Classic, timeless look
- Shows reflections clearly`,
  },

  brushed_nickel: {
    name: "Brushed Nickel",
    description: `BRUSHED NICKEL hardware finish.
- Soft, satin silver appearance
- Subtle brushed texture visible
- Warm silver tone (slightly warmer than chrome)
- Hides fingerprints and water spots
- Contemporary, popular choice`,
  },

  matte_black: {
    name: "Matte Black",
    description: `MATTE BLACK hardware finish.
- Flat, non-reflective black surface
- Bold, modern, dramatic appearance
- Industrial/contemporary aesthetic
- NO shine or reflection
- Strong visual contrast against glass`,
  },

  polished_brass: {
    name: "Polished Brass",
    description: `POLISHED BRASS hardware finish.
- Bright, golden metallic surface
- Warm, luxurious gold tone
- Traditional, elegant appearance
- Reflective, shiny finish
- Classic luxury aesthetic`,
  },

  oil_rubbed_bronze: {
    name: "Oil Rubbed Bronze",
    description: `OIL RUBBED BRONZE hardware finish.
- Dark brown/bronze color
- Subtle copper/bronze undertones
- Slightly textured, aged appearance
- Warm, traditional look
- Often shows intentional "wear" highlights`,
  },
};

export const handleStyleDescriptions = {
  ladder: {
    name: "Ladder Pull Handle",
    description: `LADDER-STYLE pull handle.
- Vertical bar handle with horizontal rungs
- Resembles a small ladder
- Modern, architectural look
- Easy to grip at any height
- Bold, statement piece`,
  },

  square: {
    name: "Square Pull Handle",
    description: `SQUARE profile pull handle.
- Clean, geometric square cross-section
- Modern, minimalist design
- Sharp, defined edges
- Contemporary aesthetic
- Sleek and professional`,
  },

  d_pull: {
    name: "D-Pull / Crescent Handle",
    description: `D-SHAPED or CRESCENT pull handle.
- Curved, D-shaped profile
- Ergonomic grip
- Classic, widely-used design
- Comfortable to grasp
- Timeless appearance`,
  },

  knob: {
    name: "Round Knob",
    description: `ROUND KNOB handle.
- Simple round/circular knob
- Compact, minimal footprint
- Traditional, classic design
- Subtle, understated look
- Clean and simple`,
  },
};

export const framingDescriptions = {
  frameless: {
    name: "Frameless",
    description: `FRAMELESS glass installation.
- NO metal frame around the glass edges
- Glass panels joined with minimal hardware
- Clean, modern, open appearance
- Maximum visibility of tile work
- Premium, high-end look
- Glass appears to "float"`,
  },

  semi_frameless: {
    name: "Semi-Frameless",
    description: `SEMI-FRAMELESS installation.
- Minimal framing, typically just on the header/track
- Frame around fixed panels but not the door
- Balance of support and aesthetics
- More affordable than full frameless
- Clean look with some structure`,
  },

  framed: {
    name: "Framed",
    description: `FULLY FRAMED installation.
- Metal frame surrounds all glass edges
- Frame visible on all panels and door
- Traditional, classic appearance
- Maximum structural support
- Frame finish should match hardware`,
  },
};

/**
 * Get a complete description for a configuration
 */
export function getOptionDescription(
  category: 'doorType' | 'glassStyle' | 'hardwareFinish' | 'handleStyle' | 'framing',
  optionId: string
): { name: string; description: string } | null {
  const catalogs = {
    doorType: doorTypeDescriptions,
    glassStyle: glassStyleDescriptions,
    hardwareFinish: hardwareFinishDescriptions,
    handleStyle: handleStyleDescriptions,
    framing: framingDescriptions,
  };

  const catalog = catalogs[category];
  return catalog?.[optionId as keyof typeof catalog] || null;
}
