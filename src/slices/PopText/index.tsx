"use client"
import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps, PrismicRichText } from "@prismicio/react";
import ExpandableSection from "@/components/ExpandableSection";
import ToggleButton from "@/components/ToggleButton";
import Item1Column from "./item-1-column";
import Item2Columns from "./item-2-columns";
import Item2ColumnsReversed from "./item-2-columns-reversed";
import ItemImage2Columns from "./item-image-2-columns";
import { setupStaggeredAnimation } from "@/utils/animations/staggerAnimations";

/**
 * Props for `PopText`.
 */
export type PopTextProps = SliceComponentProps<Content.PopTextSlice>;

/**
 * Component for "PopText" Slices.
 */
const PopText = ({ slice }: PopTextProps) => {
  // Convert KeyTextField to string
  const toggleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toggleRef.current) return;
    setupStaggeredAnimation(toggleRef.current, {
      stagger: 0.2,
      duration: 0.6,
      ease: "power2.out"
    });
  }, []);

  return (
    <ExpandableSection
      mobileHeadlineClickable={true}
      headerContent={
        <>
          <div className="bg-white rounded-r-full pl-4 pr-6 py-4 text-gray-800 mr-2">
            <PrismicRichText field={slice.primary.headline} />
          </div>
          
          <div ref={toggleRef} className="md:block hidden">
            <ToggleButton buttonText="Read more" />
          </div>
        </>
      }
    >
      <div className="text-gray-800">
        {slice.primary.items.map((item, index) => (
          <div key={index}>
            {/* Mobile view - always use Item1Column */}
            <div className="md:hidden">
              <Item1Column {...item} />
            </div>
            
            {/* Desktop view - use specified layout */}
            <div className="hidden md:block">
              {(() => {
                switch (item.styling) {
                  case '1-column':
                    return <Item1Column {...item} />;
                  case '2-columns':
                    return <Item2Columns {...item} />;
                  case '2-columns-reversed':
                    return <Item2ColumnsReversed {...item} />;
                  case 'image-2-columns':
                    return <ItemImage2Columns {...item} />;
                  default:
                    return <Item1Column {...item} />;
                }
              })()}
            </div>
          </div>
        ))}
      </div>
    </ExpandableSection>
  );
};

export default PopText;