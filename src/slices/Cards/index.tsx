"use client"
import { FC, useEffect, useRef, useState } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import Modal from "@/components/Modal";
import { setupStaggeredAnimation } from "@/utils/animations/staggerAnimations";

/**
 * Props for `Cards`.
 */
export type CardsProps = SliceComponentProps<Content.CardsSlice> & {
  enableStagger?: boolean;
  enableAnimation?: boolean;
};

/**
 * Component for "Cards" Slices.
 */
const Cards: FC<CardsProps> = ({ slice, enableStagger = true, enableAnimation = true }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<Content.CardsSlice['primary']['items'][0] | null>(null);

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
      <div className="md:w-11/12">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mr-4 md:mr-0">
          {slice.primary.items?.map((item, index) => {
            const isFirstInRow = index % 4 === 0;
            return (
              <div 
                key={index} 
                className={`flex flex-col bg-white px-4 py-4 cursor-pointer transition-all duration-300 hover:cursor-pointer ${
                  isFirstInRow ? 'pl-6 rounded-l-0 rounded-r-2xl' : 'rounded-2xl '
                }`}
                role="button"
                tabIndex={0}
           
              >

                {item.headline && (
                  <h3 className="pt-2 pb-10 text-xl font-bold mb-2">{item.headline}</h3>
                )}
                {item.text && (
                  <div className="text-sm text-gray-500 text-left pb-4">
                    <PrismicRichText field={item.text} />
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

export default Cards;

