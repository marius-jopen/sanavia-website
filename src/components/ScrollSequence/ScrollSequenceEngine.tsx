"use client";

import {
  type FC,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { ScrollSequenceContext } from "./ScrollSequenceContext";
import type { ScrollSequenceConfig } from "./types";

export interface ScrollSequenceEngineProps {
  config: ScrollSequenceConfig;
  children: ReactNode;
  className?: string;
  /** Pass-through props for the outer section (e.g. data-slice-type). */
  sectionProps?: React.ComponentPropsWithoutRef<"section"> & Record<string, unknown>;
}

function buildGetFrameUrl(config: ScrollSequenceConfig): (index: number) => string {
  const pad = config.framePadding ?? 5;
  const ext = config.fileExtension ?? "webp";
  return (index: number) => {
    const i = Math.max(0, Math.min(Math.floor(index), config.totalFrames - 1));
    return `${config.basePath}${String(i).padStart(pad, "0")}.${ext}`;
  };
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

  const getFrameUrl = useMemo(
    () => buildGetFrameUrl(config),
    [config.basePath, config.totalFrames, config.framePadding, config.fileExtension]
  );

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
      setProgress(p);
      setFrameIndex(Math.floor(p * (config.totalFrames - 1)));
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
    }),
    [progress, frameIndex, config.totalFrames, getFrameUrl]
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
        <div className="sticky top-0 left-0 w-full h-screen">{children}</div>
      </section>
    </ScrollSequenceContext.Provider>
  );
};

export default ScrollSequenceEngine;
