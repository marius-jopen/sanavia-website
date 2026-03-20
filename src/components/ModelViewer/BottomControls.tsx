import React, { useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface BottomControlsProps {
  controlsRef: React.RefObject<OrbitControls | null>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  onShake: () => void;
  isShaken: boolean;
}

const pillDefault =
  "whitespace-nowrap rounded-full px-5 py-2.5 text-base font-medium border border-transparent bg-white text-gray-800 transition-all hover:bg-white/30 hover:backdrop-blur-sm hover:border-white cursor-pointer";

export function BottomControls({
  controlsRef,
  isPlaying,
  setIsPlaying,
  onShake,
  isShaken,
}: BottomControlsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-30 flex flex-col items-start gap-2">
      {/* Pills stacked vertically above the button */}
      {open && (
        <>
          <button
            type="button"
            onClick={() => {
              const controls = controlsRef.current;
              if (!controls) return;
              const next = !controls.autoRotate;
              controls.autoRotate = next;
              setIsPlaying(next);
            }}
            className={pillDefault}
            aria-label={isPlaying ? "Turn off auto rotate" : "Turn on auto rotate"}
          >
            {isPlaying ? "Auto Rotate Off" : "Auto Rotate"}
          </button>

          <button
            type="button"
            onClick={onShake}
            className={pillDefault}
            aria-label={isShaken ? "Reassemble molecule" : "Shake molecule apart"}
          >
            {isShaken ? "Reassemble" : "Shake"}
          </button>
        </>
      )}

      {/* Circular +/× button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close menu" : "Open menu"}
        className={
          open
            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white transition-all hover:bg-gray-700 cursor-pointer"
            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent bg-white text-gray-900 transition-all hover:bg-white/30 hover:backdrop-blur-sm hover:border-white cursor-pointer"
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
    </div>
  );
}
