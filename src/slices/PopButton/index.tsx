"use client"
import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { setupFadeInAnimation } from "../../utils/animations/intersectionAnimations";
import { setupStaggeredAnimation } from "../../utils/animations/staggerAnimations";
import { PrismicNextLink } from "@prismicio/next";
import SimplePlusButton from "@/components/SimplePlusButton";

/**
 * Props for `PopHeadline`.
 */
export type PopButtonProps = SliceComponentProps<Content.PopButtonSlice>;

/**
 * Component for "PopHeadline" Slices.
 */
const PopButton: FC<PopButtonProps> = ({ slice }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = setupFadeInAnimation(sectionRef.current);
    return cleanup;
  }, []);

  useEffect(() => {
    if (!buttonRef.current) return;
    setupStaggeredAnimation(buttonRef.current, {
      stagger: 0.2,
      duration: 0.6,
      ease: "power2.out"
    });
  }, []);

  // Update container width to match height
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight;
        containerRef.current.style.width = `${height}px`;
      }
    };

    // Initial update
    updateContainerWidth();

    // Create ResizeObserver to watch for height changes
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="flex gap-2">
      <div className="bg-white rounded-r-full pl-8 pr-12 pt-3 md:pt-6 pb-3 md:pb-6 w-fit text-gray-800 ">
        <h2>
          {slice.primary.button?.text}
        </h2>
      </div>

      <div ref={buttonRef} className="flex">
        <div ref={containerRef} className="aspect-square">
          <PrismicNextLink field={slice.primary.button}>
            <SimplePlusButton big={true} />
          </PrismicNextLink>
        </div>
      </div>
    </section>
  );
};

export default PopButton;
