"use client";

import { FC } from "react";
import { useScrollSequence } from "./ScrollSequenceContext";
import type { ScrollSequenceStepProps } from "./types";

const ScrollSequenceStep: FC<ScrollSequenceStepProps> = ({
  start,
  end,
  children,
  fade = true,
}) => {
  const { progress } = useScrollSequence();

  const visible = progress >= start && progress <= end;
  if (!visible) return null;

  let opacity = 1;
  if (fade && end > start) {
    const range = end - start;
    const fadeIn = range * 0.15;
    const fadeOut = range * 0.15;
    const pos = (progress - start) / range;
    if (pos < fadeIn / range) {
      opacity = pos / (fadeIn / range);
    } else if (pos > 1 - fadeOut / range) {
      opacity = (1 - pos) / (fadeOut / range);
    }
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity }}
    >
      {children}
    </div>
  );
};

export default ScrollSequenceStep;
