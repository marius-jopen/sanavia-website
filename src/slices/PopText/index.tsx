"use client"
import { useEffect, useRef } from "react";
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
  const isClosed = slice.primary.closed ?? true; // Default to true if not set

  useEffect(() => {
    if (!toggleRef.current) return;
    setupStaggeredAnimation(toggleRef.current, {
      stagger: 0.2,
      duration: 0.6,
      ease: "power2.out"
    });
  }, []);

  // Check if we have a headline
  const hasHeadline = slice.primary.headline && slice.primary.headline.length > 0;

  return (
    <ExpandableSection
      mobileHeadlineClickable={true}
      defaultOpen={!isClosed}
      headerContent={
        hasHeadline ? (
          <>
          
            <div className="bg-white rounded-r-2xl md:rounded-r-full pl-4 pr-6 py-4 text-gray-800 mr-4 md:mr-2">
              <PrismicRichText field={slice.primary.headline} />

              <div className="pt-5 pb-1">
                <ToggleButton buttonText="Learn more" bgColor="bg-gray-100" py="py-1" toggledPy="py-2" />
              </div>
            </div>
            
            <div ref={toggleRef} className="hidden md:block">
              <ToggleButton buttonText="Learn more" bgColor="bg-gray-100" py="py-2" toggledPy="py-3" />
            </div>
          </>
        ) : null
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