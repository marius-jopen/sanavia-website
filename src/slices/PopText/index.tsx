"use client"
import { FC, useState, useRef, useEffect } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import { initializeSlideElement } from "@/utils/animations/slideAnimations";
import { animatePopTextOpen, animatePopTextClose } from "@/utils/animations/popTextAnimations";
import { setupFadeInAnimation } from "@/utils/animations/intersectionAnimations";
import { scrollElementToCenter } from "@/utils/animations/scrollAnimations";

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
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize the element's hidden state on mount
  useEffect(() => {
    if (textBoxRef.current) {
      initializeSlideElement(textBoxRef.current);
    }
    setIsInitialized(true);
  }, []);

  // Set up intersection observer for section animation
  useEffect(() => {
    if (!sectionRef.current) return;
    
    const cleanup = setupFadeInAnimation(sectionRef.current);
    
    // Return cleanup function
    return cleanup;
  }, []);

  useEffect(() => {
    if (!textBoxRef.current || !contentRef.current) return;
    
    if (isTextVisible) {
      // Get the height of the content
      const contentHeight = contentRef.current.offsetHeight;
      // Use the external animation function for opening
      animatePopTextOpen(textBoxRef.current, contentHeight);
      
      // Scroll the section to the center of the viewport
      scrollElementToCenter(sectionRef.current);
    } else {
      // Use the external animation function for closing
      animatePopTextClose(textBoxRef.current);
    }
  }, [isTextVisible]);

  return (
    <section className="mb-12" ref={sectionRef}>
      <div className="flex">
        <div className="bg-white rounded-r-4xl px-8 py-6 border-y border-r border-[var(--color-border)]">
          {slice.primary.headline}
        </div>

        <div 
          className="bg-white rounded-4xl px-8 py-6 cursor-pointer hover:bg-gray-50 transition-colors border border-[var(--color-border)]"
          onClick={() => setIsTextVisible(!isTextVisible)}
        >
          {slice.primary.button_text}
        </div>
      </div>

      <div 
        ref={textBoxRef}
        className="bg-white rounded-r-4xl -ml-[100px] pl-[100px] w-10/12 border border-[var(--color-border)]"
        style={{ 
          display: isInitialized ? 'block' : 'none', 
          height: 0,
          overflow: "hidden"
        }}
      >
        <div className="py-6 px-6" ref={contentRef}>
          <PrismicRichText field={slice.primary.rich_text} />
        </div>
      </div>
    </section>
  );
};

export default PopText;