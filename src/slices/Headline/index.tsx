"use client"
import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps, PrismicRichText } from "@prismicio/react";
import { setupFadeInAnimation } from "../../utils/animations/intersectionAnimations";

// Helper type to add visible field to slice primary
type WithVisible<T> = T & { visible?: boolean };

/**
 * Props for `Headline`.
 */
export type HeadlineProps = SliceComponentProps<Content.HeadlineSlice>;

/**
 * Component for "Headline" Slices.
 */
const Headline: FC<HeadlineProps> = ({ slice }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const keep_layout = slice.primary.keep_layout === true ? 'w-full' : 'w-full sm:w-8/12 md:w-7/12 2xl:w-4/12';
  const alignment = slice.primary.alignment === 'left' ? 'text-left' : 'text-center';
  const headlineWidth = alignment === 'text-left' ? keep_layout : 'md:w-8/12 mx-auto';
  const subHeadlineWidth = alignment === 'text-left' ? 'w-full md:w-7/12' : 'md:w-8/12 md:w-4/12 mx-auto ';
  
  useEffect(() => {
    const cleanup = setupFadeInAnimation(sectionRef.current);
    return cleanup;
  }, []);

  // Early return if not visible
  if (!((slice.primary as WithVisible<typeof slice.primary>).visible ?? true)) return null;
  
  return (
    <section ref={sectionRef} className={`${alignment} pt-4 pb-4 px-8 headline`}>
      <div className={`md:mb-8 ${headlineWidth} text-gray-800`}>
        <PrismicRichText field={slice.primary.headline} />
      </div>

      <div className={`${subHeadlineWidth} text-gray-500 pt-6 md:pt-0`}>
        <PrismicRichText field={slice.primary.sub_headline} />
      </div>
    </section>
  );
};

export default Headline;
