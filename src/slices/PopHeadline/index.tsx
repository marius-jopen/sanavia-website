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

  return (
    <section ref={sectionRef}>
      <div className="bg-white rounded-r-2xl px-4 py-4 w-fit font-bold mb-2 text-gray-800">
          {slice.primary.headline}
        </div>
    </section>
  );
};

export default PopHeadline;
