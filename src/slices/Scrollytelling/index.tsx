"use client";

import { type FC, type ComponentPropsWithoutRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import {
  ScrollSequenceEngine,
  ScrollSequenceFrames,
  ScrollSequenceStep,
  ScrollSequenceFrameCounter,
} from "../../components/ScrollSequence";
import type { ScrollSequenceConfig } from "../../components/ScrollSequence";

type SectionProps = ComponentPropsWithoutRef<"section"> & Record<string, unknown>;

const CONFIG: ScrollSequenceConfig = {
  basePath: "/scrollytelling/v1/81010_Sanavia_Explainer_251124_",
  basePathMobile: "/scrollytelling/v1-mobile/81010_Sanavia_Explainer_251124_",
  /** Bunny CDN only in production (locally: same-origin = no latency). */
  cdnBaseUrl:
    typeof process !== "undefined" && process.env.NODE_ENV === "production"
      ? "https://sanavia.b-cdn.net"
      : undefined,
  totalFrames: 975,
  pixelsPerFrame: 16,
  /** 1 = all frames (smooth). 2 = every 2nd frame (less data, can feel choppy). */
  frameStep: 2,
};

const EXAMPLE_STEPS: Array<{ start: number; end: number; title: string; text: string }> = [
  { start: 0.1, end: 0.25, title: "Example title", text: "Example text for this step." },
  { start: 0.4, end: 0.55, title: "Another step", text: "More example text. Content can go here." },
];

export type ScrollytellingProps =
  SliceComponentProps<Content.ScrollytellingSlice>;

const Scrollytelling: FC<ScrollytellingProps> = ({ slice }) => {
  return (
    <ScrollSequenceEngine
      config={CONFIG}
      sectionProps={
        {
          "data-slice-type": slice.slice_type,
          "data-slice-variation": slice.variation,
        } as SectionProps
      }
    >
      <ScrollSequenceFrames />
      <ScrollSequenceStep start={300 / CONFIG.totalFrames} end={355 / CONFIG.totalFrames} fade>
        <div className="max-w-sm mx-auto px-8 py-6 bg-white/95 rounded-xl shadow-xl text-gray-900 text-center">
          <ScrollSequenceFrameCounter
            startFrame={300}
            endFrame={350}
            fromValue={0}
            toValue={1000}
            className="text-4xl font-bold tabular-nums"
          />
        </div>
      </ScrollSequenceStep>
      {EXAMPLE_STEPS.map((step, i) => (
        <ScrollSequenceStep key={i} start={step.start} end={step.end} fade>
          <div className="max-w-md mx-auto px-6 py-4 bg-white/90 rounded-lg shadow-lg text-gray-900">
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-sm">{step.text}</p>
          </div>
        </ScrollSequenceStep>
      ))}
    </ScrollSequenceEngine>
  );
};

export default Scrollytelling;
