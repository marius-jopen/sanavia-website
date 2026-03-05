export interface ScrollSequenceConfig {
  /** Total number of frames (e.g. 975 for 00000–00974). */
  totalFrames: number;
  /** Pixels of scroll per frame. Higher = slower. */
  pixelsPerFrame: number;
  /** URL prefix including trailing separator (e.g. "/scrollytelling/v1/81010_Sanavia_Explainer_251124_"). */
  basePath: string;
  /** Optional mobile image path (e.g. "/scrollytelling/v1-mobile/81010_Sanavia_Explainer_251124_"). Used when viewport is narrow. */
  basePathMobile?: string;
  /** Zero-pad frame number to this many digits (default 5). */
  framePadding?: number;
  /** File extension (default "webp"). */
  fileExtension?: string;
  /** Number of frames to preload before allowing scroll (default 200). */
  preloadCount?: number;
}

export interface ScrollSequenceContextValue {
  /** Scroll progress 0–1. */
  progress: number;
  /** Current frame index 0 … totalFrames-1. */
  frameIndex: number;
  totalFrames: number;
  /** Build frame URL for a given index (desktop). */
  getFrameUrl: (index: number) => string;
  /** Build frame URL for mobile, or same as getFrameUrl if no mobile path. */
  getFrameUrlMobile: (index: number) => string;
  /** True when viewport is considered mobile (narrow). */
  isMobile: boolean;
}

import type { ReactNode } from "react";

export interface ScrollSequenceStepProps {
  /** Start of range (0–1). Step is visible when progress >= start. */
  start: number;
  /** End of range (0–1). Step is visible when progress <= end. */
  end: number;
  children: ReactNode;
  /** Optional: fade in/out at edges (default true). */
  fade?: boolean;
}
