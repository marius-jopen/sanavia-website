import React, { useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface BottomControlsProps {
  controlsRef: React.RefObject<OrbitControls | null>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

const pillDefault =
  "whitespace-nowrap rounded-full px-5 py-2.5 text-base font-medium border border-transparent bg-white text-gray-800 transition-all hover:bg-white/30 hover:backdrop-blur-sm hover:border-white";

export function BottomControls({
  controlsRef,
  isPlaying,
  setIsPlaying,
}: BottomControlsProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-30 flex items-end gap-2">
      <div className="relative">
        {/* Dropdown pills (opens upward) */}
        {panelOpen && (
          <div className="absolute bottom-full left-0 mb-2 flex flex-col items-start gap-2">
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
          </div>
        )}

        {/* Circular +/× button */}
        <button
          type="button"
          onClick={() => setPanelOpen((prev) => !prev)}
          className={`flex h-12 w-12 items-center justify-center rounded-full border border-transparent transition-all ${
            panelOpen
              ? "bg-gray-800 text-white hover:bg-gray-700"
              : "bg-white text-gray-900 hover:bg-white/30 hover:backdrop-blur-sm hover:border-white"
          }`}
          aria-label={panelOpen ? "Close menu" : "Open menu"}
        >
          {panelOpen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
