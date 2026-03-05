"use client";

import { type FC, type ComponentPropsWithoutRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import {
  ScrollSequenceEngine,
  ScrollSequenceFrames,
  ScrollSequenceStep,
} from "../../components/ScrollSequence";
import type { ScrollSequenceConfig } from "../../components/ScrollSequence";

type SectionProps = ComponentPropsWithoutRef<"section"> & Record<string, unknown>;

const CONFIG: ScrollSequenceConfig = {
  basePath: "/scrollytelling/v1/81010_Sanavia_Explainer_251124_",
  totalFrames: 975,
  pixelsPerFrame: 16,
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
