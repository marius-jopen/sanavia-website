"use client"
import { FC, useState, useRef, useEffect } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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
      gsap.set(textBoxRef.current, { 
        autoAlpha: 0,
        height: 0,
        overflow: "hidden",
        x: -300
      });
    }
    setIsInitialized(true);
  }, []);

  // Setup scroll trigger animation
  useEffect(() => {
    if (!sectionRef.current || typeof window === 'undefined') return;
    
    // Create the timeline but don't link ScrollTrigger yet
    const tl = gsap.timeline({ paused: true });
    
    // Build animation sequence
    tl.fromTo(sectionRef.current,
      { y: 50, autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.3 }
    )
    .to(sectionRef.current, {
      y: 0,
      duration: 0.8,
      ease: "elastic.out(1.2, 0.5)",
    }, "-=0.1");
    
    // Create ScrollTrigger
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top bottom",
      onEnter: () => {
        // Reset and play animation
        tl.restart();
      },
      onEnterBack: () => {
        // Also play when scrolling up
        tl.restart();
      },
      onLeave: () => {
        // Reset section to initial state when it leaves viewport
        gsap.set(sectionRef.current, { y: 50, autoAlpha: 0 });
      },
      onLeaveBack: () => {
        // Reset section to initial state when it leaves viewport while scrolling up
        gsap.set(sectionRef.current, { y: 50, autoAlpha: 0 });
      },
      markers: process.env.NODE_ENV === 'development'
    });
    
    // Cleanup
    return () => {
      trigger.kill();
      tl.kill();
    };
  }, []);

  useEffect(() => {
    if (!textBoxRef.current) return;
    
    if (isTextVisible) {
      // Reset visibility before animation starts
      gsap.set(textBoxRef.current, { 
        autoAlpha: 1, 
        height: "auto",
        overflow: "visible",
      });
      
      // Slide in from left with bounce effect
      gsap.fromTo(textBoxRef.current, 
        { x: -300, opacity: 0 },
        { 
          duration: 0.3, 
          x: 0, 
          opacity: 1,
          ease: "back.out(1.7)", // This creates the bounce effect
          clearProps: "x" // Clear transform after animation
        }
      );
    } else {
      // Simple slide out to left animation
      gsap.to(textBoxRef.current, {
        duration: 0.3,
        x: -300,
        opacity: 0,
        ease: "back.in(1.7)",
        onComplete: () => {
          gsap.set(textBoxRef.current, { 
            autoAlpha: 0,
            height: 0,
            overflow: "hidden"
          });
        }
      });
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