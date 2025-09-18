"use client"
import { FC, useEffect, useRef, useState } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import VideoMinimal from "@/components/VideoMinimal";
import Modal from "@/components/Modal";
import { setupStaggeredAnimation } from "@/utils/animations/staggerAnimations";

// Helper type to add visible field to slice primary
type WithVisible<T> = T & { visible?: boolean };

/**
 * Props for `Team`.
 */
export type TeamProps = SliceComponentProps<Content.TeamSlice> & {
  enableStagger?: boolean;
  enableAnimation?: boolean;
};

/**
 * Component for "Team" Slices.
 */
const Team: FC<TeamProps> = ({ slice, enableStagger = true, enableAnimation = true }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<Content.TeamSlice['primary']['items'][0] | null>(null);

  useEffect(() => {
    if (!gridRef.current || !enableAnimation) return;
    setupStaggeredAnimation(gridRef.current, {
      stagger: enableStagger ? 0.2 : 0,
      duration: 0.6,
      ease: "power2.out"
    });
  }, [enableStagger, enableAnimation]);

  const handleItemClick = (item: Content.TeamSlice['primary']['items'][0]) => {
    setSelectedItem(item);
  };

  // Early return if not visible
  if (!((slice.primary as WithVisible<typeof slice.primary>).visible ?? true)) return null;


  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-6"
    >
      <div className="">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mr-4 md:mr-0">
          {slice.primary.items?.map((item, index) => {
            const isFirstInRow = index % 4 === 0;
            return (
              <div 
                key={index} 
                className={` flex flex-col bg-white px-4 py-4 text-center cursor-pointer transition-all duration-300 hover:cursor-pointer ${
                  isFirstInRow ? 'pl-8 rounded-l-0 rounded-r-2xl' : 'rounded-2xl '
                }`}
                onClick={() => handleItemClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleItemClick(item);
                  }
                }}
              >
                <div className={`overflow-hidden rounded-2xl aspect-[5/3] mb-4 ${isFirstInRow ? 'w-[calc(100%+1rem)] -ml-4' : ''}`}>
                  <VideoMinimal
                    url={item.video_url || undefined}
                    poster={item.image}
                  />
                </div>
                {item.headline && (
                  <div className={`pt-2 pb-2 text-2xl ${item.teaser ? 'mb-0' : 'mb-2'}`}>{item.headline}</div>
                )}
                {item.teaser && (
                  <div className="px-6  text-base text-gray-500 mb-2">
                    {item.teaser}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <div className="p-5">
            <div className="overflow-hidden md:w-1/2 rounded-2xl aspect-[5/3] mb-6">
              <VideoMinimal
                url={selectedItem.video_url || undefined}
                poster={selectedItem.image}
              />
            </div>
            {selectedItem.headline && (
              <div className="md:text-3xl  mb-4">{selectedItem.headline}</div>
            )}
            {selectedItem.richtext && (
              <div className="text-gray-600 text-base">
                <PrismicRichText field={selectedItem.richtext} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
};

export default Team;
