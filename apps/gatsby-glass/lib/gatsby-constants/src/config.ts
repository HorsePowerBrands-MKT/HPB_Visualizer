import type { ShowerShape, EnclosureType, Payload, OptionalConfig } from '@repo/types';

// Door availability matrix based on shower shape
export const getDoorOptions = (showerShape: ShowerShape): EnclosureType[] => {
  switch (showerShape) {
    case 'neo_angle':
      // Neo-angle showers only support hinged doors
      return ['hinged'];
    case 'tub':
      // Tub configurations support hinged and pivot
      return ['hinged', 'pivot'];
    case 'standard':
    default:
      // Standard showers support all door types
      return ['hinged', 'pivot', 'sliding'];
  }
};

// Check if a door type is compatible with shower shape
export const isDoorTypeCompatible = (
  showerShape: ShowerShape,
  enclosureType: EnclosureType
): boolean => {
  const availableOptions = getDoorOptions(showerShape);
  return availableOptions.includes(enclosureType);
};

// Get default configuration for a shower shape
export const getDefaultConfigForShape = (showerShape: ShowerShape): Partial<Payload> => {
  const availableDoors = getDoorOptions(showerShape);
  
  return {
    shower_shape: showerShape,
    enclosure_type: availableDoors[0], // Default to first available option
    hinged_config: showerShape === 'neo_angle' ? {
      to_ceiling: false,
      direction: 'swing_left'
    } : undefined
  };
};

// Default optional configuration
export const DEFAULT_OPTIONAL_CONFIG: OptionalConfig = {
  glass_height: 'standard',
  custom_height_in: 0,
  towel_bar: {
    enabled: false,
    style: null
  }
};

// Catalog version
export const CATALOG_VERSION = '2025.10';

// Brand-specific configurations (can be overridden per brand)
export interface BrandConfig {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  supportEmail?: string;
  supportPhone?: string;
}

// Gatsby Glass default configuration
export const GATSBY_GLASS_CONFIG: BrandConfig = {
  name: 'Gatsby Glass',
  primaryColor: '#a37529',
  secondaryColor: '#e4bf6e',
  supportEmail: 'CustomerJourney@horsepowerbrands.com',
  supportPhone: '1-800-GATSBY'
};

/**
 * Synthetic "test" franchise location used to QA the Request-a-Quote (RAQ)
 * email pipeline end-to-end without sending to a real brand or franchise
 * inbox.
 *
 * The override is gated on a signed-in Supabase session: only authenticated
 * team members can trigger it. When such a user submits the RAQ form with
 * a zip code that exactly matches `TEST_LOCATION.zipCode`, the submit-lead
 * route delivers the franchise notification to `TEST_LOCATION.email`
 * instead of the brand shared inbox fallback. Anonymous visitors who
 * happen to type the same zip get the normal "no territory → brand inbox"
 * behavior, so the test inbox never receives stray public traffic.
 *
 * The zip is intentionally non-real (`00000` is not assigned by USPS) so it
 * will never collide with a live territory in `territory_zipcodes`.
 */
export const TEST_LOCATION = {
  zipCode: '00000',
  email: 'CustomerJourney@horsepowerbrands.com',
  locationName: 'Customer Journey (Test)',
} as const;
