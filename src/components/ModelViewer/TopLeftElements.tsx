import React from "react";
import type { MeshAnnotation } from "./types";

export interface TopLeftElementsProps {
  title?: string;
  annotations: MeshAnnotation[];
  activeAnnotation: MeshAnnotation | null;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSelect: (annotation: MeshAnnotation) => void;
  onCloseAnnotation: () => void;
}

export function TopLeftElements({
  title: moleculeTitle,
  annotations,
  activeAnnotation,
  open,
  setOpen,
  onSelect,
  onCloseAnnotation,
}: TopLeftElementsProps) {
  const hasEpitopes = annotations.length > 0;
  const showTopLeft = moleculeTitle || hasEpitopes;
  if (!showTopLeft) return null;

  const label = moleculeTitle || "Elements";

  return (
    <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
      {/* Top row: title pill + circular + button */}
      <div className="flex items-center gap-2">
        {/* Title pill (molecule name) */}
        <span className="rounded-full border border-gray-200/60 bg-white/95 px-4 py-2.5 text-sm font-medium text-gray-800 shadow-lg backdrop-blur-sm">
          {label}
        </span>

        {/* Circular + button — toggles epitope list (only when there are epitopes) */}
        {hasEpitopes && (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200/50 bg-white shadow-lg transition-all hover:bg-gray-50"
            aria-expanded={open}
            aria-label={open ? "Close epitopes" : "Open epitopes"}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>

      {/* Epitope pills (when + is clicked) */}
      {open && hasEpitopes && (
        <div className="flex flex-col gap-2">
          {/* Active epitope with close (X) — on top when one is selected */}
          {activeAnnotation && (
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-gray-200/80 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm">
                {activeAnnotation.title}
              </span>
              <button
                type="button"
                onClick={onCloseAnnotation}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-gray-700"
                aria-label="Deselect"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {/* Other epitopes as pills in a row */}
          <div className="flex flex-wrap gap-2">
            {annotations.map((a, i) => {
              const isActive = activeAnnotation?.meshName === a.meshName;
              if (isActive) return null;
              return (
                <button
                  key={`${a.meshName}-${i}`}
                  type="button"
                  onClick={() => onSelect(a)}
                  className="rounded-full border border-gray-200/80 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
                >
                  {a.title || a.meshName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
