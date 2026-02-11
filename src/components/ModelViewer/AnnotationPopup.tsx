import React from "react";
import type { MeshAnnotation } from "./types";

export interface AnnotationPopupProps {
  showAnnotation: boolean;
  activeAnnotation: MeshAnnotation | null;
  annotationRef: React.RefObject<HTMLDivElement | null>;
  closeAnnotation: () => void;
}

export function AnnotationPopup({
  showAnnotation,
  activeAnnotation,
  annotationRef,
  closeAnnotation,
}: AnnotationPopupProps) {
  if (!showAnnotation && !activeAnnotation) return null;

  return (
    <div
      ref={annotationRef}
      className="absolute top-4 left-4 z-30 max-w-sm"
      style={{ opacity: 0 }}
    >
      <div className="bg-white rounded-2xl  overflow-hidden">
        {/* Header with close button */}
        <div className="flex items-start justify-between gap-3 pt-5 pb-2 px-5 md:px-7">
          <h3 className="text-gray-800">
            {activeAnnotation?.title}
          </h3>
          <button
            type="button"
            onClick={closeAnnotation}
            className="shrink-0 mt-1 text-neutral-400 hover:text-neutral-700 cursor-pointer bg-transparent border-none p-0 transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="px-5 md:px-7 pb-5 text-neutral-500 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0">
          {activeAnnotation?.content}
        </div>
      </div>
    </div>
  );
}
