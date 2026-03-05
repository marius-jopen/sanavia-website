"use client";

import { FC, useEffect, useRef, useState } from "react";
import { useScrollSequence } from "./ScrollSequenceContext";

const IMG_CLASS = "w-full h-full object-cover object-center pointer-events-none";

const ScrollSequenceFrames: FC = () => {
  const { frameIndex, totalFrames, getFrameUrl, getFrameUrlMobile, isMobile } = useScrollSequence();
  const [mounted, setMounted] = useState(false);
  const [visibleWhich, setVisibleWhich] = useState(0);
  const displayedFrameRef = useRef<number>(-1);
  const img0Ref = useRef<HTMLImageElement>(null);
  const img1Ref = useRef<HTMLImageElement>(null);
  const loadingFrameRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const getUrl = mounted && isMobile ? getFrameUrlMobile : getFrameUrl;

  const PRELOAD_RADIUS = 10;
  useEffect(() => {
    if (!mounted) return;
    for (let i = frameIndex - PRELOAD_RADIUS; i <= frameIndex + PRELOAD_RADIUS; i++) {
      if (i < 0 || i >= totalFrames) continue;
      const img = new Image();
      img.src = getUrl(i);
    }
  }, [mounted, frameIndex, totalFrames, getUrl]);

  useEffect(() => {
    if (!mounted) return;

    const alreadyShowing = displayedFrameRef.current === frameIndex;
    if (alreadyShowing) return;

    const hidden = 1 - visibleWhich;
    const hiddenImg = hidden === 0 ? img0Ref.current : img1Ref.current;
    if (!hiddenImg) return;

    const url = getUrl(frameIndex);
    const targetFrame = frameIndex;

    const onLoad = () => {
      if (loadingFrameRef.current !== targetFrame) return;
      displayedFrameRef.current = targetFrame;
      setVisibleWhich(hidden);
    };

    if (hiddenImg.complete && hiddenImg.src === url) {
      onLoad();
      return;
    }

    loadingFrameRef.current = targetFrame;
    hiddenImg.onload = onLoad;
    hiddenImg.onerror = onLoad;
    hiddenImg.src = url;
  }, [mounted, frameIndex, getUrl, visibleWhich]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
      <img
        ref={img0Ref}
        alt=""
        className={IMG_CLASS}
        draggable={false}
        decoding="async"
        fetchPriority="high"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: visibleWhich === 0 ? 1 : 0,
        }}
      />
      <img
        ref={img1Ref}
        alt=""
        className={IMG_CLASS}
        draggable={false}
        decoding="async"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: visibleWhich === 1 ? 1 : 0,
        }}
      />
    </div>
  );
};

export default ScrollSequenceFrames;
