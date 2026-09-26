import type { CSSProperties } from "react";

export const ZUZU_CHARACTER_STATES = [
  "idle",
  "walking",
  "flying",
  "landing",
  "listening",
  "thinking",
  "speaking",
] as const;

export type ZuzuCharacterState = (typeof ZUZU_CHARACTER_STATES)[number];

export interface ZuzuSceneProps {
  /** Animation state controlled by the parent assistant shell. */
  characterState?: ZuzuCharacterState;
  /** Optional callback for the parent chat/interaction shell. */
  onCharacterClick?: () => void;
  /** Optional class and inline sizing hooks for the eventual panel/launcher. */
  className?: string;
  style?: CSSProperties;
  /** Defaults to a compact 260px character viewport. */
  height?: number | string;
}
