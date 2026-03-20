import React, { useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface BottomControlsProps {
  controlsRef: React.RefObject<OrbitControls | null>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  onShake: () => void;
  isShaken: boolean;
}

export function BottomControls({
  controlsRef,
  isPlaying,
  setIsPlaying,
  onShake,
  isShaken,
}: BottomControlsProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-30 flex items-end gap-2">
      <div className="relative">
        {/* Dropdown panel (opens upward) */}
        {panelOpen && (
          <div className="absolute bottom-full left-0 mb-2 min-w-[180px] rounded-2xl border border-gray-200/60 bg-white/95 p-3 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const controls = controlsRef.current;
                  if (!controls) return;
                  const next = !controls.autoRotate;
                  controls.autoRotate = next;
                  setIsPlaying(next);
                }}
                className="rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
                aria-label={isPlaying ? "Turn off auto rotate" : "Turn on auto rotate"}
              >
                {isPlaying ? "Auto Rotate Off" : "Auto Rotate"}
              </button>
              <button
                type="button"
                onClick={onShake}
                className="rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
                aria-label={isShaken ? "Reassemble molecule" : "Shake molecule apart"}
              >
                {isShaken ? "Reassemble" : "Shake"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-gray-700"
              aria-label="Close menu"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Circular + button */}
        <button
          type="button"
          onClick={() => setPanelOpen((prev) => !prev)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg transition-all hover:bg-gray-50 border border-gray-200/50"
          aria-label={panelOpen ? "Close menu" : "Open menu"}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
