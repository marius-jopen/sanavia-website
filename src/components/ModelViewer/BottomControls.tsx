import React, { useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface BottomControlsProps {
  controlsRef: React.RefObject<OrbitControls | null>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

const pill =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-gray-200 bg-white/90 px-5 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-white/60 cursor-pointer";

export function BottomControls({
  controlsRef,
  isPlaying,
  setIsPlaying,
}: BottomControlsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="absolute bottom-4 left-4 z-30"
      style={{ display: "flex", alignItems: "center", gap: "8px", width: "max-content" }}
    >
      {/* Circular + button — turns dark when open, click again to close */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close menu" : "Open menu"}
        className={
          open
            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-700"
            : `flex h-10 w-10 shrink-0 items-center justify-center ${pill}`
        }
      >
        {open ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </button>

      {/* Auto Rotate pill — appears next to the button when open */}
      {open && (
        <button
          type="button"
          onClick={() => {
            const controls = controlsRef.current;
            if (!controls) return;
            const next = !controls.autoRotate;
            controls.autoRotate = next;
            setIsPlaying(next);
          }}
          className={pill}
          aria-label={isPlaying ? "Turn off auto rotate" : "Turn on auto rotate"}
        >
          {isPlaying ? "Auto Rotate Off" : "Auto Rotate"}
        </button>
      )}
    </div>
  );
}
