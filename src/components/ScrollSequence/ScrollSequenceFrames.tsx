"use client";

import { FC, useEffect, useState } from "react";
import { useScrollSequence } from "./ScrollSequenceContext";

const IMG_CLASS = "w-full h-full object-cover object-center pointer-events-none";

const ScrollSequenceFrames: FC = () => {
  const { frameIndex, totalFrames, getFrameUrl, getFrameUrlMobile, isMobile } = useScrollSequence();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getUrl = mounted && isMobile ? getFrameUrlMobile : getFrameUrl;
  const src = getUrl(frameIndex);

  useEffect(() => {
    if (!mounted) return;
    [frameIndex - 1, frameIndex, frameIndex + 1].forEach((i) => {
      if (i < 0 || i >= totalFrames) return;
      const img = new Image();
      img.src = getUrl(i);
    });
  }, [mounted, frameIndex, totalFrames, getUrl]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <img
        key={frameIndex}
        src={src}
        alt=""
        className={IMG_CLASS}
        draggable={false}
        fetchPriority="high"
      />
    </div>
  );
};

export default ScrollSequenceFrames;
