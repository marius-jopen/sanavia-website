"use client"
import { FC, useState, useRef, useEffect } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
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
  const textBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textBoxRef.current) return;
    
    if (isTextVisible) {
      // Reset visibility before animation starts
      gsap.set(textBoxRef.current, { 
        autoAlpha: 1, 
        height: "auto",
        overflow: "visible",
      });
      
      // Simple slide in from left animation
      gsap.fromTo(textBoxRef.current, 
        { x: -300, opacity: 0 },
        { 
          duration: 0.5, 
          x: 0, 
          opacity: 1,
          ease: "power2.out" 
        }
      );
    } else {
      // Simple slide out to left animation
      gsap.to(textBoxRef.current, {
        duration: 0.3,
        x: -300,
        opacity: 0,
        ease: "power2.in",
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
    <section className="mb-12">
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
        className="bg-white rounded-r-4xl px-8 py-6 w-10/12 invisible"
      >
        <PrismicRichText field={slice.primary.rich_text} />
      </div>
    </section>
  );
};

export default PopText;