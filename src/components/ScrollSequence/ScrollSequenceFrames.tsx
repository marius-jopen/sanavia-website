"use client";

import { FC, useEffect } from "react";
import { useScrollSequence } from "./ScrollSequenceContext";

const ScrollSequenceFrames: FC = () => {
  const { frameIndex, totalFrames, getFrameUrl, getFrameUrlMobile, isMobile } = useScrollSequence();
  const getUrl = isMobile ? getFrameUrlMobile : getFrameUrl;

  useEffect(() => {
    [frameIndex - 1, frameIndex, frameIndex + 1].forEach((i) => {
      if (i < 0 || i >= totalFrames) return;
      const img = new Image();
      img.src = getUrl(i);
    });
  }, [frameIndex, totalFrames, getUrl]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <img
        key={`${frameIndex}-${isMobile ? "m" : "d"}`}
        src={getUrl(frameIndex)}
        alt=""
        className="w-full h-full object-cover object-center pointer-events-none"
        draggable={false}
        fetchPriority="high"
      />
    </div>
  );
};

export default ScrollSequenceFrames;
