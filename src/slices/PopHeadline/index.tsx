"use client"
import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { setupFadeInAnimation } from "../../utils/animations/intersectionAnimations";

/**
 * Props for `PopHeadline`.
 */
export type PopHeadlineProps = SliceComponentProps<Content.PopHeadlineSlice>;

/**
 * Component for "PopHeadline" Slices.
 */
const PopHeadline: FC<PopHeadlineProps> = ({ slice }) => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const cleanup = setupFadeInAnimation(sectionRef.current);
    return cleanup;
  }, []);

  // Early return if not visible
  if (!slice.primary.visible) return null;

  return (
    <section ref={sectionRef}>
      <div className="bg-white rounded-r-full pl-8 pr-12 py-2 md:py-6 w-fit mb-4 text-gray-800">
        <h2>
          {slice.primary.headline}
        </h2>
      </div>
    </section>
  );
};

export default PopHeadline;
