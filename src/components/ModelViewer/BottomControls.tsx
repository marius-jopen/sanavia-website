import React from "react";
import type { MeshAnnotation } from "./types";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface BottomControlsProps {
  annotations: MeshAnnotation[];
  elementsOpen: boolean;
  setElementsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleElementSelect: (annotation: MeshAnnotation) => void;
  activeAnnotation: MeshAnnotation | null;
  controlsRef: React.RefObject<OrbitControls | null>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

export function BottomControls({
  annotations,
  elementsOpen,
  setElementsOpen,
  handleElementSelect,
  activeAnnotation,
  controlsRef,
  isPlaying,
  setIsPlaying,
}: BottomControlsProps) {
  return (
    <div className="absolute bottom-4 left-4 z-30 flex items-end gap-2">
      {/* Elements dropdown */}
      {annotations.length > 0 && (
        <div className="relative">
          {/* Dropdown menu (opens upward) */}
          {elementsOpen && (
            <div className="absolute bottom-full left-0 mb-2 min-w-[200px] bg-white rounded-xl overflow-hidden shadow-xl">
              <div className="max-h-60 overflow-y-auto py-1">
                {annotations.map((a, i) => (
                  <button
                    key={`${a.meshName}-${i}`}
                    type="button"
                    onClick={() => handleElementSelect(a)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer border-none bg-transparent hover:bg-gray-100 ${
                      activeAnnotation?.meshName === a.meshName
                        ? "text-gray-900 font-medium bg-gray-50"
                        : "text-gray-600"
                    }`}
                  >
                    {a.title || a.meshName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Elements toggle button */}
          <button
            type="button"
            onClick={() => setElementsOpen((prev) => !prev)}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 text-sm font-medium px-4 py-2.5 rounded-full cursor-pointer border border-gray-200/50 transition-all shadow-lg"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Elements
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${elementsOpen ? "rotate-180" : ""}`}
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Auto-rotate toggle button */}
      <button
        type="button"
        onClick={() => {
          const controls = controlsRef.current;
          if (!controls) return;
          const next = !controls.autoRotate;
          controls.autoRotate = next;
          setIsPlaying(next);
        }}
        className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 text-sm font-medium px-4 py-2.5 rounded-full cursor-pointer border border-gray-200/50 transition-all shadow-lg"
        aria-label={isPlaying ? "Turn off auto rotate" : "Turn on auto rotate"}
      >
        {isPlaying ? "Auto Rotate Off" : "Auto Rotate On"}
      </button>
    </div>
  );
}
