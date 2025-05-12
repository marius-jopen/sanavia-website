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
export type AboutUsProps = SliceComponentProps<Content.AboutUsSlice> & {
  enableStagger?: boolean;
  enableAnimation?: boolean;
};

const categories = ["All", "Why", "What", "How", "Who", "The Team"];

/**
 * Component for "AboutUs" Slices.
 */
const AboutUs: FC<AboutUsProps> = ({ slice, enableStagger = true, enableAnimation = true }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // 1. State for selected category
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  // 2. Filter items by selected category
  const filteredItems = selectedCategory === "All"
    ? slice.primary.items
    : slice.primary.items?.filter((item) => item.category === selectedCategory);

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
      {/* 3. Render filter buttons */}
      <div className="flex gap-2 mb-8 justify-left">
        {categories.map((cat, idx) => (
          <button
            key={cat}
            className={`px-8 py-4 hover:bg-neutral-100 transition \
              ${idx < 1 ? 'rounded-l-0 rounded-r-full' : 'rounded-l-full rounded-r-full'} \
              ${selectedCategory === cat
                ? "bg-white text-black"
                : "bg-white text-neutral-500"}
            `}
            onClick={() => setSelectedCategory(cat)}
          >
            <h3>
              {cat}
            </h3>
          </button>
        ))}
      </div>
      <div>
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => {
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

