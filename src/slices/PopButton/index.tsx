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

  return (
    <section ref={sectionRef} className="flex gap-2">
      <div className="bg-white rounded-r-full pl-4 pr-6 py-4 w-fit font-bold mb-4 text-gray-800">
        <h3>
          {slice.primary.button?.text}
        </h3>
      </div>

      <div ref={buttonRef} className="flex">
        <div>
          <PrismicNextLink field={slice.primary.button}>
            <SimplePlusButton />
          </PrismicNextLink>
        </div>
      </div>
    </section>
  );
};

export default PopButton;
