"use client"
import { useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps, PrismicRichText } from "@prismicio/react";
import ExpandableSection, { useToggle } from "@/components/ExpandableSection";
import Item1Column from "./item-1-column";
import Item2Columns from "./item-2-columns";
import Item2ColumnsReversed from "./item-2-columns-reversed";
import Item2ColumnsBigImage from "./item-2-columns-big-image";
import Item2ColumnsBigImageReversed from "./item-2-columns-big-image-reversed";
import ItemImage2Columns from "./item-image-2-columns";
import { setupStaggeredAnimation } from "@/utils/animations/staggerAnimations";
import SimplePlusButton from "@/components/SimplePlusButton";

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

  // Simple header component that can use the toggle hook
  const HeaderContent = () => {
    const { toggle, isToggled } = useToggle();

    if (!hasHeadline) return null;

    return (
      <>
      <div className="flex flex-row">
        <div className="bg-white rounded-r-2xl md:rounded-r-full pl-8 pr-8 text-gray-800 mr-3 min-h-20 flex items-center pt-4 md:pt-2 pb-4 md:pb-2">
          <PrismicRichText field={slice.primary.headline} />
        </div>
        
        <div className="flex items-center">
          <div ref={toggleRef} className="h-20 mr-4">
            <SimplePlusButton onClick={toggle} isActive={isToggled} />
          </div>
        </div>
      </div>
      </>
    );
  };

  return (
    <ExpandableSection
      mobileHeadlineClickable={true}
      defaultOpen={!isClosed}
      headerContent={<HeaderContent />}
    >
      <div className="text-gray-800 flex flex-col gap-2 md:gap-20">
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
                  case '2-columns-big-image':
                    return <Item2ColumnsBigImage {...item} />;
                  case '2-columns-big-image-reversed':
                    return <Item2ColumnsBigImageReversed {...item} />;
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