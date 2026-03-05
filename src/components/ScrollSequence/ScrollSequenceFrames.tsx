"use client";

import { FC, useEffect, useRef, useState, useLayoutEffect } from "react";
import { useScrollSequence } from "./ScrollSequenceContext";

const PRELOAD_COUNT = 200;

/** Draw image to canvas preserving aspect ratio (cover: fill canvas, no stretch). */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (iw <= 0 || ih <= 0) return;
  const scale = Math.max(canvasWidth / iw, canvasHeight / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (canvasWidth - dw) / 2;
  const dy = (canvasHeight - dh) / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
}

const ScrollSequenceFrames: FC = () => {
  const {
    frameIndex,
    totalFrames,
    getFrameUrl,
    getFrameUrlMobile,
    isMobile,
  } = useScrollSequence();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const lastDrawnRef = useRef<number>(-1);
  const currentFrameRef = useRef<number>(frameIndex);
  currentFrameRef.current = frameIndex;

  const getUrl = isMobile ? getFrameUrlMobile : getFrameUrl;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      if (el) {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        setCanvasSize({ width: w, height: h });
      }
    };
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    updateSize();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const end = Math.min(PRELOAD_COUNT, totalFrames);
    for (let i = 0; i < end; i++) {
      if (imagesRef.current.has(i)) continue;
      const src = getUrl(i);
      const img = new Image();
      img.src = src;
      imagesRef.current.set(i, img);
    }
  }, [totalFrames, getUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || canvas.width !== canvasSize.width || canvas.height !== canvasSize.height) return;

    const w = canvasSize.width;
    const h = canvasSize.height;

    let img = imagesRef.current.get(frameIndex);
    if (img?.complete && img.naturalWidth > 0) {
      lastDrawnRef.current = frameIndex;
      drawImageCover(ctx, img, w, h);
      return;
    }

    if (!img) {
      img = new Image();
      imagesRef.current.set(frameIndex, img);
    }

    const targetFrame = frameIndex;
    const onLoad = () => {
      if (currentFrameRef.current !== targetFrame) return;
      const canvas2 = canvasRef.current;
      const ctx2 = canvas2?.getContext("2d");
      if (!canvas2 || !ctx2) return;
      lastDrawnRef.current = targetFrame;
      drawImageCover(ctx2, img!, canvas2.width, canvas2.height);
    };

    if (img.src !== getUrl(targetFrame)) {
      img.onload = onLoad;
      img.onerror = onLoad;
      img.src = getUrl(targetFrame);
    }
  }, [frameIndex, canvasSize, getUrl]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center bg-neutral-900"
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full h-full object-cover object-center pointer-events-none block"
        style={{ display: "block" }}
        aria-hidden
      />
    </div>
  );
};

export default ScrollSequenceFrames;
