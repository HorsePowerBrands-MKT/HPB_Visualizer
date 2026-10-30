import type { RailingHandrail, RailingSystem } from './types';

/** Isometric line-art icons for wizard selection cards (public/railing-icons/). */
export const RAILING_SYSTEM_OPTION_ICONS: Record<RailingSystem, string> = {
  base_shoe: '/railing-icons/base-shoe.png',
  spigot: '/railing-icons/spigot.png',
};

export const RAILING_HANDRAIL_OPTION_ICONS: Record<RailingHandrail, string> = {
  top_mount: '/railing-icons/top-mount.png',
  side_mount: '/railing-icons/side-mount.png',
  no_handrail: '/railing-icons/no-handrail.png',
};
