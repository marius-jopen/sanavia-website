"use client"
import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import VideoBasic from "@/components/VideoBasic";
import { setupStaggeredAnimation } from "@/utils/animations/staggerAnimations";

/**
 * Props for `Team`.
 */
export type AboutUsProps = SliceComponentProps<Content.AboutUsSlice> & {
  enableStagger?: boolean;
  enableAnimation?: boolean;
};

/**
 * Component for "AboutUs" Slices.
 */
const AboutUs: FC<AboutUsProps> = ({ slice, enableStagger = true, enableAnimation = true }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current || !enableAnimation) return;
    setupStaggeredAnimation(gridRef.current, {
      stagger: enableStagger ? 0.2 : 0,
      duration: 0.6,
      ease: "power2.out"
    });
  }, [enableStagger, enableAnimation]);

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-6 w-10/12"
    >
      <div className="">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slice.primary.items?.map((item, index) => {
            const isFirstInRow = index % 3 === 0;
            return (
              <div 
                key={index} 
                className={`flex flex-col bg-white px-4 py-4 text-center ${
                  isFirstInRow ? 'pl-6 rounded-l-0 rounded-r-2xl' : 'rounded-2xl '
                }`}
              >
                <div className="overflow-hidden rounded-2xl aspect-[4/3] mb-4">
                  <VideoBasic
                    url={item.video_url || undefined}
                    poster={item.image}
                  />
                </div>
                {item.headline && (
                  <h3 className="pt-2 pb-2 text-xl font-bold mb-2">{item.headline}</h3>
                )}
                {item.richtext && (
                  <div className="px-12 text-sm text-gray-500">
                    <PrismicRichText field={item.richtext} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutUs;

