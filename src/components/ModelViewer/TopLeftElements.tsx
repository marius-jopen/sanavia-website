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

const pill =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-gray-200 bg-white/90 px-5 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-white/60 cursor-pointer";

const darkCircle =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-700";

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
  if (!moleculeTitle && !hasEpitopes) return null;

  const label = moleculeTitle || "Elements";

  return (
    <div className="absolute top-4 left-4 z-30" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "max-content" }}>

      {/* Row 1: title pill + (+ or ×) button */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "max-content" }}>
        <span className={pill}>{label}</span>

        {hasEpitopes && (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label={open ? "Close epitopes" : "Open epitopes"}
            className={open ? darkCircle : `${pill} !px-0 w-9 justify-center`}
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
        )}
      </div>

      {/* Rows 2+: shown only when open */}
      {open && hasEpitopes && (
        <>
          {/* If one is selected: its pill + dark × to deselect */}
          {activeAnnotation && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "max-content" }}>
              <span className={pill}>{activeAnnotation.title}</span>
              <button
                type="button"
                onClick={onCloseAnnotation}
                className={darkCircle}
                aria-label="Deselect"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* All remaining epitopes in one horizontal row */}
          <div style={{ display: "flex", flexDirection: "row", gap: "8px", flexWrap: "nowrap", width: "max-content" }}>
            {annotations.map((a, i) => {
              if (activeAnnotation?.meshName === a.meshName) return null;
              return (
                <button
                  key={`${a.meshName}-${i}`}
                  type="button"
                  onClick={() => onSelect(a)}
                  className={pill}
                >
                  {a.title || a.meshName}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
