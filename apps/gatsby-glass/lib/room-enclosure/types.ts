/**
 * Gatsby Glass Room Enclosure Module types
 *
 * Consumer-facing selections for the glass room enclosure visualizer (wine
 * rooms, under-stair wine displays, home offices, cigar lounges and other
 * interior glass rooms). The wizard collects a design mode, the room type
 * (auto-detected from the photo and correctable), the enclosure style
 * (framed or frameless) and the hardware finish. Door hardware, glass
 * thickness, channel sizing and other installation details are NOT part of
 * this payload; they belong to the hidden backend prompt logic.
 */

import type { MetalFinish } from '../metal-finishes';

/** Which design path the consumer chose (mirrors the shower and railing flows). */
export type RoomEnclosureMode = 'configure' | 'inspiration';

/**
 * What the enclosed space is used for. Detected from the photo during
 * validation; drives the placement wording and what must be preserved
 * behind the glass (racks, shelving, a desk, ...).
 */
export type RoomEnclosureApplication =
  | 'wine_room'
  | 'under_stair'
  | 'home_office'
  | 'other_room';

/**
 * The two enclosure families Gatsby Glass offers: a classic framed system
 * or a frameless glass wall and door.
 */
export type RoomEnclosureStyle = 'framed' | 'frameless';

/**
 * Metal finish for the frame (framed) or the channels, clamps and hinges
 * (frameless), plus the door handle. Shared with the Glass Railing module
 * (see `lib/metal-finishes.ts`).
 */
export type RoomEnclosureFinish = MetalFinish;

/**
 * What the uploaded photo already shows at the enclosure location. Detected
 * automatically during image validation and never shown to the consumer.
 * Drives the backend placement rules.
 */
export type RoomEnclosureExistingCondition =
  | 'open_opening'
  | 'existing_partition'
  | 'existing_glass'
  | 'open_floor'
  | 'none';

/**
 * Where the consumer drew the glass wall on their photo: a floor line from
 * (x1, y1) to (x2, y2), each coordinate normalized to 0..1 of the uploaded
 * image's width / height so it is independent of display size. Burned onto
 * a reference copy of the photo at generate time; never stored with leads.
 */
export interface RoomEnclosurePlacementLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** How the enclosure location reaches the model. */
export type RoomEnclosurePlacement = 'drawn' | 'inferred';

/** In-progress wizard form. Every selection starts null until the user picks it. */
export interface RoomEnclosureForm {
  mode: RoomEnclosureMode;
  application: RoomEnclosureApplication | null;
  /** Required in configure mode; optional override in inspiration mode. */
  style: RoomEnclosureStyle | null;
  /** Required in configure mode; optional override in inspiration mode. */
  finish: RoomEnclosureFinish | null;
  /** From image validation. Hidden from the consumer. */
  existing_condition: RoomEnclosureExistingCondition | null;
  /** True when the validator identified the room type (vs. the generic fallback). */
  application_detected: boolean;
  /**
   * Floor line the consumer drew on the photo. Required when the validator
   * found no opening to anchor to (`open_floor` / `none`); optional otherwise.
   */
  placement_line: RoomEnclosurePlacementLine | null;
}

/** A fully completed set of consumer selections. */
export interface RoomEnclosurePayload {
  product: 'room_enclosure';
  mode: RoomEnclosureMode;
  application: RoomEnclosureApplication;
  /** null only in inspiration mode when the consumer did not override it. */
  style: RoomEnclosureStyle | null;
  finish: RoomEnclosureFinish | null;
  existing_condition: RoomEnclosureExistingCondition;
  /** 'drawn' when a placement line travels with the request as a reference image. */
  placement: RoomEnclosurePlacement;
  session_id: string;
  catalog_version: string;
}

/** A single resolved selection handed to backend prompt assembly. */
export interface RoomEnclosurePromptSelection<T extends string> {
  id: T;
  name: string;
  /** Backend-facing descriptor. Never rendered to the consumer. */
  prompt_descriptor: string;
}

/**
 * Structured input for backend prompt assembly. The UI resolves ids to
 * catalog entries so the backend never has to know about UI copy.
 */
export interface RoomEnclosurePromptInput {
  product: 'room_enclosure';
  catalog_version: string;
  session_id: string;
  mode: RoomEnclosureMode;
  existing_condition: RoomEnclosureExistingCondition;
  placement: RoomEnclosurePlacement;
  application: RoomEnclosurePromptSelection<RoomEnclosureApplication>;
  style: RoomEnclosurePromptSelection<RoomEnclosureStyle> | null;
  finish: RoomEnclosurePromptSelection<RoomEnclosureFinish> | null;
}

/** History entry for the room enclosure result gallery. */
export interface RoomEnclosureHistoryItem {
  id: string;
  timestamp: number;
  /** Data URL shown on screen. */
  imageUrl: string;
  /** Public (watermarked) Supabase Storage URL for the same image, when the
   *  upload succeeded. Posted with leads so the server can match the hero
   *  against the stored visualization history. */
  storageUrl?: string | null;
  label: string;
  payload: RoomEnclosurePayload;
}
