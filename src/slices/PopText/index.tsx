"use client"
import { FC, useState, useRef, useEffect } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import { initializeSlideElement } from "@/utils/animations/slideAnimations";
import { animatePopTextOpen, animatePopTextClose } from "@/utils/animations/popTextAnimations";
import { setupFadeInAnimation } from "@/utils/animations/intersectionAnimations";
import { scrollElementToCenter } from "@/utils/animations/scrollAnimations";
import gsap from "gsap";

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
  const [displayX, setDisplayX] = useState(false);
  const textBoxRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const xIconWidthRef = useRef<number>(0);
  const textWidthRef = useRef<number>(0);

  // Calculate and store widths for animation
  const saveWidths = () => {
    // Create temporary elements to measure widths
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    document.body.appendChild(tempDiv);

    // Measure X icon width
    tempDiv.innerHTML = `
      <span class="inline-block w-4 h-4 relative"></span>
    `;
    xIconWidthRef.current = tempDiv.offsetWidth + 48; // Add padding

    // Measure text width
    tempDiv.innerHTML = typeof slice.primary.button_text === 'string' 
      ? slice.primary.button_text 
      : '';
    textWidthRef.current = tempDiv.offsetWidth + 48; // Add padding

    // Clean up
    document.body.removeChild(tempDiv);
  };

  // Initialize the element's hidden state on mount
  useEffect(() => {
    if (textBoxRef.current) {
      initializeSlideElement(textBoxRef.current);
    }
    setIsInitialized(true);

    // Save the widths for animation
    saveWidths();
  }, []);

  // Set up intersection observer for section animation
  useEffect(() => {
    if (!sectionRef.current) return;
    
    const cleanup = setupFadeInAnimation(sectionRef.current);
    
    // Return cleanup function
    return cleanup;
  }, []);

  // Handle content change and button animation when toggling
  useEffect(() => {
    if (!buttonRef.current) return;
    
    if (isTextVisible) {
      // When opening: First change to X, then animate width
      setDisplayX(true);
      
      // Wait a tiny bit for the DOM to update
      setTimeout(() => {
        // Then animate width to X size
        gsap.to(buttonRef.current, {
          width: xIconWidthRef.current,
          duration: 0.1,
          ease: "power2.inOut"
        });
      }, 10);
    } else {
      // When closing: First animate width, then change to text
      gsap.to(buttonRef.current, {
        width: textWidthRef.current,
        duration: 0.1,
        ease: "power2.inOut",
        onComplete: () => {
          // After width animation, switch to text
          setDisplayX(false);
        }
      });
    }
  }, [isTextVisible]);

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
          ref={buttonRef}
          className="bg-white rounded-4xl px-6 py-6 cursor-pointer hover:bg-gray-50 transition-colors border border-[var(--color-border)] whitespace-nowrap"
          onClick={() => setIsTextVisible(!isTextVisible)}
        >
          {displayX ? (
            <span className="inline-block w-4 h-4 relative">
              <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-black rotate-45 -translate-y-1/2"></span>
              <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-black -rotate-45 -translate-y-1/2"></span>
            </span>
          ) : (
            <span className="whitespace-nowrap">{slice.primary.button_text}</span>
          )}
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