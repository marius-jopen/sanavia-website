"use client";

import { FC, useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { useScrollSequence } from "./ScrollSequenceContext";

export interface ScrollSequenceFrameCounterProps {
  /** First frame when counter is visible (e.g. 300). */
  startFrame: number;
  /** Last frame of the count range (e.g. 350). Value reaches toValue at this frame. */
  endFrame: number;
  /** Value at startFrame (e.g. 0). */
  fromValue: number;
  /** Value at endFrame (e.g. 1000). */
  toValue: number;
  /** Optional formatter (default: Math.round). */
  format?: (n: number) => string | number;
  /** Optional className for the wrapper. */
  className?: string;
  children?: never;
}

const ScrollSequenceFrameCounter: FC<ScrollSequenceFrameCounterProps> = ({
  startFrame,
  endFrame,
  fromValue,
  toValue,
  format = (n) => Math.round(n),
  className,
}) => {
  const { frameIndex } = useScrollSequence();
  const objRef = useRef({ value: fromValue });
  const [displayValue, setDisplayValue] = useState<string | number>(format(fromValue));

  const inRange = frameIndex >= startFrame && frameIndex <= endFrame;
  const frameRange = endFrame - startFrame;
  const t = frameRange > 0 ? (frameIndex - startFrame) / frameRange : 0;
  const targetValue = inRange
    ? fromValue + (toValue - fromValue) * Math.max(0, Math.min(1, t))
    : fromValue;

  useEffect(() => {
    gsap.to(objRef.current, {
      value: targetValue,
      duration: 0.15,
      overwrite: true,
      onUpdate: () => {
        setDisplayValue(format(objRef.current.value));
      },
    });
  }, [targetValue, format]);

  if (!inRange) return null;

  return (
    <div className={className}>
      {displayValue}
    </div>
  );
};

export default ScrollSequenceFrameCounter;
