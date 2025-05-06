"use client"
import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { setupFadeInAnimation } from "../../utils/animations/intersectionAnimations";
import { PrismicNextLink } from "@prismicio/next";
import gsap from "gsap";

/**
 * Props for `PopHeadline`.
 */
export type PopButtonProps = SliceComponentProps<Content.PopButtonSlice>;

/**
 * Component for "PopHeadline" Slices.
 */
const PopButton: FC<PopButtonProps> = ({ slice }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = setupFadeInAnimation(sectionRef.current);
    return cleanup;
  }, []);

  const handleMouseEnter = () => {
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        rotation: 45,
        duration: 0.3,
        ease: "power2.inOut"
      });
    }
  };

  const handleMouseLeave = () => {
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.inOut"
      });
    }
  };

  return (
    <section ref={sectionRef} className="flex gap-2">
      <div className="bg-white rounded-r-full pl-4 pr-6 py-4 w-fit font-bold mb-4 text-gray-800">
        <h3>
          {slice.primary.button?.text}
        </h3>
      </div>

      <PrismicNextLink field={slice.primary.button}>
        <div 
          className="bg-white rounded-full px-6 py-4 cursor-pointer text-gray-800 hover:bg-black hover:text-white transition-all duration-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            ref={iconRef} 
            className="inline-block w-4 h-[22px] relative translate-y-[3px]"
          >
            <h4>
              {/* Horizontal line (always visible) */}
              <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-current transform -translate-y-1/2"></span>
              {/* Vertical line (stays vertical in + mode, rotates to diagonal in X mode) */}
              <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-current transform -translate-y-1/2 rotate-90"></span>
            </h4>
          </div>
        </div>
      </PrismicNextLink>
    </section>
  );
};

export default PopButton;
