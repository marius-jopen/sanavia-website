"use client"
import { FC, useState, useRef, useEffect } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import { initializeSlideElement, slideIn, slideOut } from "@/utils/animations/slideAnimations";

/**
 * Props for `PopText`.
 */
export type PopTextProps = SliceComponentProps<Content.PopTextSlice>;

/**
 * Component for "PopText" Slices.
 */
const PopText: FC<PopTextProps> = ({ slice }) => {
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const textBoxRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Initialize the element's hidden state on mount
  useEffect(() => {
    if (textBoxRef.current) {
      initializeSlideElement(textBoxRef.current);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!textBoxRef.current) return;
    
    if (isTextVisible) {
      slideIn(textBoxRef.current);
    } else {
      slideOut(textBoxRef.current);
    }
  }, [isTextVisible]);

  return (
    <section className="mb-12" ref={sectionRef}>
      <div className="flex">
        <div className="bg-white rounded-r-4xl px-8 py-6">
          {slice.primary.headline}
        </div>

        <div 
          className="bg-white rounded-4xl px-8 py-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsTextVisible(!isTextVisible)}
        >
          {slice.primary.button_text}
        </div>
      </div>

      <div 
        ref={textBoxRef}
        className="bg-white rounded-r-4xl -ml-[100px] pl-[100px] w-10/12"
        style={{ 
          display: isInitialized ? 'block' : 'none', 
          height: 0,
          overflow: 'hidden'
        }}
      >
        <div className="py-6 px-6">
          <PrismicRichText field={slice.primary.rich_text} />
        </div>
      </div>
    </section>
  );
};

export default PopText;