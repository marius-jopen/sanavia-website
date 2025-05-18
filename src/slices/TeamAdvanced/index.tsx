"use client"
import { FC, useEffect, useRef, useState } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import VideoBasic from "@/components/VideoBasic";
import { setupStaggeredAnimation } from "@/utils/animations/staggerAnimations";

/**
 * Props for `Team`.
 */
export type TeamAdvancedProps = SliceComponentProps<Content.TeamAdvancedSlice> & {
  enableStagger?: boolean;
  enableAnimation?: boolean;
};

/**
 * Component for "Team" Slices.
 */
const TeamAdvanced: FC<TeamAdvancedProps> = ({ slice, enableStagger = true, enableAnimation = true }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

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
      className="py-6"
    >
      <div className="mb-6 flex flex-wrap gap-3">
        {slice.primary.items?.map((item, index) => {
          return (
            <button
              key={index}
              onClick={() => {
                setSelectedIndices((prev) =>
                  prev.includes(index)
                    ? prev.filter((i) => i !== index)
                    : [...prev, index]
                );
              }}
              className={`py-2 bg-white hover:bg-black hover:text-white duration-200 px-6 ${index < 1 ? ' rounded-l-0 rounded-r-full' : 'rounded-l-full rounded-r-full'}`}
            >
              {item.headline}
            </button>
          );
        })}
      </div>
      <div className="">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedIndices.map((selectedIdx) => {
            const item = slice.primary.items[selectedIdx];
            const isFirstInRow = selectedIndices.indexOf(selectedIdx) % 4 === 0;
            return (
              <div 
                key={selectedIdx} 
                className={`flex flex-col bg-white px-4 py-4 text-center fade-in-card ${isFirstInRow ? 'pl-6 rounded-l-0 rounded-r-2xl' : 'rounded-2xl '}`}
                style={{ animation: 'fadeIn 0.6s' }}
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
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-card {
          animation: fadeIn 0.6s;
        }
      `}</style>
    </section>
  );
};

export default TeamAdvanced;

