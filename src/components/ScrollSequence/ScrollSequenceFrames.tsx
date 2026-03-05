"use client";

import { FC, useEffect } from "react";
import { useScrollSequence } from "./ScrollSequenceContext";

const ScrollSequenceFrames: FC = () => {
  const { frameIndex, totalFrames, getFrameUrl } = useScrollSequence();

  useEffect(() => {
    [frameIndex - 1, frameIndex, frameIndex + 1].forEach((i) => {
      if (i < 0 || i >= totalFrames) return;
      const img = new Image();
      img.src = getFrameUrl(i);
    });
  }, [frameIndex, totalFrames, getFrameUrl]);

  return (
    <img
      key={frameIndex}
      src={getFrameUrl(frameIndex)}
      alt=""
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      draggable={false}
      fetchPriority="high"
    />
  );
};

export default ScrollSequenceFrames;
