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

const pillBase =
  "whitespace-nowrap rounded-full px-5 py-2.5 text-base font-medium transition-all border border-transparent";
const pillDefault = `${pillBase} bg-white text-gray-800 hover:bg-white/30 hover:backdrop-blur-sm hover:border-white cursor-pointer`;
const pillActive = `${pillBase} bg-gray-800 text-white hover:bg-gray-700 cursor-pointer`;
const darkCircle =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white transition-all hover:bg-gray-700 cursor-pointer";

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
    <div className="flex flex-col gap-2">
      {/* Row 1: Title pill + ×/+ button */}
      <div className="flex items-center gap-2">
        <span className={`${pillBase} bg-white text-gray-800`}>
          {label}
        </span>

        {hasEpitopes && (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label={open ? "Close epitopes" : "Open epitopes"}
            className={
              open
                ? darkCircle
                : `flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent bg-white text-gray-900 transition-all hover:bg-white/30 hover:backdrop-blur-sm hover:border-white cursor-pointer`
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
        )}
      </div>

      {/* Rows 2+: shown only when open */}
      {open && hasEpitopes && (
        <>
          {/* If one is selected: its pill + dark × to deselect */}
          {activeAnnotation && (
            <div className="flex items-center gap-2">
              <span className={pillActive}>{activeAnnotation.title}</span>
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
          <div className="flex flex-wrap items-center gap-2">
            {annotations.map((a, i) => {
              if (activeAnnotation?.meshName === a.meshName) return null;
              return (
                <button
                  key={`${a.meshName}-${i}`}
                  type="button"
                  onClick={() => onSelect(a)}
                  className={pillDefault}
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
