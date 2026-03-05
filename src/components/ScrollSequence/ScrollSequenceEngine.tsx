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
  fileExtension: string,
  frameStep: number
): (frameIndex: number) => string {
  return (frameIndex: number) => {
    const imageIndex =
      frameStep <= 1
        ? Math.max(0, Math.min(Math.floor(frameIndex), totalFrames - 1))
        : Math.min(
            Math.floor(frameIndex / frameStep) * frameStep,
            totalFrames - 1
          );
    return `${basePath}${String(imageIndex).padStart(framePadding, "0")}.${fileExtension}`;
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
  const frameStep = Math.max(1, config.frameStep ?? 1);

  const fullBasePath = useMemo(() => {
    const base = config.basePath.startsWith("/") ? config.basePath : `/${config.basePath}`;
    return config.cdnBaseUrl
      ? `${config.cdnBaseUrl.replace(/\/$/, "")}${base}`
      : config.basePath;
  }, [config.cdnBaseUrl, config.basePath]);

  const fullBasePathMobile = useMemo(() => {
    const path = config.basePathMobile ?? config.basePath;
    const base = path.startsWith("/") ? path : `/${path}`;
    return config.cdnBaseUrl
      ? `${config.cdnBaseUrl.replace(/\/$/, "")}${base}`
      : path;
  }, [config.cdnBaseUrl, config.basePathMobile, config.basePath]);

  const getFrameUrl = useMemo(
    () =>
      buildGetFrameUrl(
        fullBasePath,
        config.totalFrames,
        pad,
        ext,
        frameStep
      ),
    [fullBasePath, config.totalFrames, pad, ext, frameStep]
  );

  const getFrameUrlMobile = useMemo(
    () =>
      buildGetFrameUrl(
        fullBasePathMobile,
        config.totalFrames,
        pad,
        ext,
        frameStep
      ),
    [fullBasePathMobile, config.totalFrames, pad, ext, frameStep]
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

    let rafId = 0;
    let lastFrameIndex = -1;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const scrollHeight = section.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollable = scrollHeight - viewportHeight;

      if (scrollable <= 0) {
        setProgress(0);
        setFrameIndex(0);
        lastFrameIndex = 0;
        return;
      }

      const scrollTop = -rect.top;
      const p = Math.max(0, Math.min(1, scrollTop / scrollable));
      const newIndex = Math.floor(p * (config.totalFrames - 1));
      setProgress(p);

      if (preloadReadyRef.current && newIndex !== lastFrameIndex) {
        lastFrameIndex = newIndex;
        setFrameIndex(newIndex);
      } else if (!preloadReadyRef.current) {
        setFrameIndex(0);
      }
    };

    const onScrollOrResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
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
