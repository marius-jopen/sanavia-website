"use client";

import {
  type FC,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { gsap } from "gsap";
import { ScrollSequenceContext } from "./ScrollSequenceContext";
import type { ScrollSequenceConfig, ScrollSequenceContextValue } from "./types";

const MOBILE_BREAKPOINT = 768;
const DEFAULT_PRELOAD_COUNT = 200;

function buildGetFrameUrl(
  basePath: string,
  totalFrames: number,
  framePadding: number,
  fileExtension: string
): (index: number) => string {
  return (index: number) => {
    const i = Math.max(0, Math.min(Math.floor(index), totalFrames - 1));
    return `${basePath}${String(i).padStart(framePadding, "0")}.${fileExtension}`;
  };
}

export interface ScrollSequenceEngineProps {
  config: ScrollSequenceConfig;
  children: ReactNode;
  className?: string;
  /** Pass-through props for the outer section (e.g. data-slice-type). */
  sectionProps?: React.ComponentPropsWithoutRef<"section"> & Record<string, unknown>;
}

const ScrollSequenceEngine: FC<ScrollSequenceEngineProps> = ({
  config,
  children,
  className,
  sectionProps = {},
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [preloadReady, setPreloadReady] = useState(false);
  const [overlayFading, setOverlayFading] = useState(false);
  const preloadRunRef = useRef(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const preloadReadyRef = useRef(false);
  preloadReadyRef.current = preloadReady;

  const pad = config.framePadding ?? 5;
  const ext = config.fileExtension ?? "webp";

  const getFrameUrl = useMemo(
    () =>
      buildGetFrameUrl(
        config.basePath,
        config.totalFrames,
        pad,
        ext
      ),
    [config.basePath, config.totalFrames, pad, ext]
  );

  const getFrameUrlMobile = useMemo(
    () =>
      buildGetFrameUrl(
        config.basePathMobile ?? config.basePath,
        config.totalFrames,
        pad,
        ext
      ),
    [config.basePathMobile, config.basePath, config.totalFrames, pad, ext]
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isProduction =
    typeof process !== "undefined" && process.env.NODE_ENV === "production";
  const preloadCount = Math.min(
    config.preloadCount ??
      (isProduction ? config.totalFrames : DEFAULT_PRELOAD_COUNT),
    config.totalFrames
  );

  useEffect(() => {
    setPreloadReady(false);
    const run = ++preloadRunRef.current;
    const getUrl = isMobile ? getFrameUrlMobile : getFrameUrl;
    let settled = 0;

    const onSettled = () => {
      settled++;
      if (settled >= preloadCount && run === preloadRunRef.current) {
        setPreloadReady(true);
        setOverlayFading(true);
      }
    };

    for (let i = 0; i < preloadCount; i++) {
      const img = new Image();
      img.onload = onSettled;
      img.onerror = onSettled;
      img.src = getUrl(i);
    }
  }, [isMobile, getFrameUrl, getFrameUrlMobile, preloadCount]);

  useEffect(() => {
    const url = isMobile ? getFrameUrlMobile(0) : getFrameUrl(0);
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    document.head.appendChild(link);
    return () => link.remove();
  }, [isMobile, getFrameUrl, getFrameUrlMobile]);

  useEffect(() => {
    if (!overlayFading || !preloadReady || !overlayRef.current) return;
    const el = overlayRef.current;
    gsap.to(el, {
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => setOverlayFading(false),
    });
  }, [overlayFading, preloadReady]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const scrollHeight = section.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollable = scrollHeight - viewportHeight;

      if (scrollable <= 0) {
        setProgress(0);
        setFrameIndex(0);
        return;
      }

      const scrollTop = -rect.top;
      const p = Math.max(0, Math.min(1, scrollTop / scrollable));
      const newIndex = Math.floor(p * (config.totalFrames - 1));
      setProgress(p);
      setFrameIndex(preloadReadyRef.current ? newIndex : 0);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [config.totalFrames]);

  const contextValue: ScrollSequenceContextValue = useMemo(
    () => ({
      progress,
      frameIndex,
      totalFrames: config.totalFrames,
      getFrameUrl,
      getFrameUrlMobile,
      isMobile,
    }),
    [progress, frameIndex, config.totalFrames, getFrameUrl, getFrameUrlMobile, isMobile]
  );

  const sectionHeight = `calc(100vh + ${(config.totalFrames - 1) * config.pixelsPerFrame}px)`;

  return (
    <ScrollSequenceContext.Provider value={contextValue}>
      <section
        ref={sectionRef}
        className={className}
        style={{ height: sectionHeight }}
        {...sectionProps}
      >
        <div className="sticky top-0 left-0 w-full h-screen bg-neutral-900">
          {children}
          {(!preloadReady || overlayFading) && (
            <div
              ref={overlayRef}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 backdrop-blur-xl"
              style={overlayFading ? { pointerEvents: "none" } : undefined}
              aria-hidden="true"
            >
              <div
                className="h-10 w-10 border-2 border-white/30 border-t-white rounded-full animate-spin"
                role="img"
                aria-label="Loading"
              />
              <span className="text-sm text-white">Loading…</span>
            </div>
          )}
        </div>
      </section>
    </ScrollSequenceContext.Provider>
  );
};

export default ScrollSequenceEngine;
