import React from "react";

export function LoadingOverlay({ loadProgress }: { loadProgress: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="text-white text-center">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm opacity-75">
          {loadProgress > 0 ? `Loading ${loadProgress}%` : "Loading model…"}
        </p>
      </div>
    </div>
  );
}

export function ErrorOverlay({ error }: { error: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <p className="text-white/80 text-sm">{error}</p>
    </div>
  );
}
