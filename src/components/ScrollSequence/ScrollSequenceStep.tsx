"use client";

import { FC, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useScrollSequence } from "./ScrollSequenceContext";
import type { ScrollSequenceStepProps } from "./types";

const ScrollSequenceStep: FC<ScrollSequenceStepProps> = ({
  start,
  end,
  children,
  fade = true,
}) => {
  const { progress } = useScrollSequence();
  const boxRef = useRef<HTMLDivElement>(null);

  const inRange = progress >= start && progress <= end;
  const range = end - start;
  const pos = range > 0 ? (progress - start) / range : 1;
  let targetOpacity = 0;
  if (inRange) {
    if (fade && range > 0) {
      const fadeIn = 0.15;
      const fadeOut = 0.15;
      if (pos < fadeIn) targetOpacity = pos / fadeIn;
      else if (pos > 1 - fadeOut) targetOpacity = (1 - pos) / fadeOut;
      else targetOpacity = 1;
    } else {
      targetOpacity = 1;
    }
  }

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    gsap.to(el, {
      opacity: targetOpacity,
      duration: 0.25,
      overwrite: true,
    });
  }, [targetOpacity]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div ref={boxRef} style={{ opacity: 0 }}>
        {children}
      </div>
    </div>
  );
};

export default ScrollSequenceStep;
