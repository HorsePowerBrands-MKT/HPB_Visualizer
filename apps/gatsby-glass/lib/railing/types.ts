/**
 * Gatsby Glass Railing Module types
 *
 * Consumer-facing selections for the glass railing visualizer. The wizard
 * collects exactly four choices (application, railing system, handrail,
 * finish) plus a design mode. Technical installation details (glass spacing,
 * code requirements, gate placement) are intentionally NOT part of this
 * payload; those belong to the hidden backend prompt logic.
 */

/** Which design path the consumer chose (mirrors the shower flow). */
export type RailingMode = 'configure' | 'inspiration';

/** Where the railing will be installed. */
export type RailingApplication =
  | 'interior_staircase'
  | 'interior_balcony'
  | 'exterior_deck'
  | 'pool_balustrade';

/** Derived from the application; lets the backend branch on indoor/outdoor context. */
export type RailingSetting = 'interior' | 'exterior';

/** How the glass panels are mounted. */
export type RailingSystem = 'base_shoe' | 'spigot';

/**
 * Handrail treatment. The two rail styles are deliberately explicit because
 * the model otherwise drifts between a cap rail on the glass edge and a
 * rail mounted on the glass face.
 */
export type RailingHandrail = 'top_mount' | 'side_mount' | 'no_handrail';

/** Metal finish for base shoe, spigots, handrail, clamps and gate hardware. */
export type RailingFinish =
  | 'matte_black'
  | 'brushed_stainless'
  | 'polished_stainless'
  | 'polished_brass'
  | 'satin_brass';

/**
 * What the uploaded photo already shows at the railing location. Detected
 * automatically during image validation and never shown to the consumer.
 * Drives the backend placement rules (B09–B15).
 */
export type RailingExistingCondition =
  | 'existing_railing'
  | 'open_edge'
  | 'half_wall'
  | 'existing_fence'
  | 'none';

/** In-progress wizard form. Every selection starts null until the user picks it. */
export interface RailingForm {
  mode: RailingMode;
  application: RailingApplication | null;
  /** Required in configure mode; optional override in inspiration mode. */
  railing_system: RailingSystem | null;
  /** Required in configure mode; optional override in inspiration mode. */
  handrail: RailingHandrail | null;
  /** Required in configure mode; optional override in inspiration mode. */
  finish: RailingFinish | null;
  /** From image validation. Hidden from the consumer. */
  existing_condition: RailingExistingCondition | null;
  /** From image validation. Advisory only; the Application selection wins. */
  detected_setting: RailingSetting | null;
  /** True when the validator identified the application (vs. a setting-based fallback). */
  application_detected: boolean;
}

/** A fully completed set of consumer selections. */
export interface RailingPayload {
  product: 'railing';
  mode: RailingMode;
  application: RailingApplication;
  /** null only in inspiration mode when the consumer did not override it. */
  railing_system: RailingSystem | null;
  handrail: RailingHandrail | null;
  finish: RailingFinish | null;
  existing_condition: RailingExistingCondition;
  session_id: string;
  catalog_version: string;
}

/** A single resolved selection handed to backend prompt assembly. */
export interface RailingPromptSelection<T extends string> {
  id: T;
  name: string;
  /** Backend-facing descriptor. Never rendered to the consumer. */
  prompt_descriptor: string;
}

/**
 * Structured input for backend prompt assembly. This is the contract between
 * the railing UI and the prompt layer: the UI resolves ids to catalog entries
 * so the backend never has to know about UI copy.
 */
export interface RailingPromptInput {
  product: 'railing';
  catalog_version: string;
  session_id: string;
  mode: RailingMode;
  setting: RailingSetting;
  existing_condition: RailingExistingCondition;
  application: RailingPromptSelection<RailingApplication>;
  railing_system: RailingPromptSelection<RailingSystem> | null;
  handrail: RailingPromptSelection<RailingHandrail> | null;
  finish: RailingPromptSelection<RailingFinish> | null;
}

/** History entry for the railing result gallery. */
export interface RailingHistoryItem {
  id: string;
  timestamp: number;
  /** Data URL shown on screen. */
  imageUrl: string;
  /** Public (watermarked) Supabase Storage URL for the same image, when the
   *  upload succeeded. Posted with leads so the server can match the hero
   *  against the stored visualization history. */
  storageUrl?: string | null;
  label: string;
  payload: RailingPayload;
}
