"use client"
import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { setupFadeInAnimation } from "../../utils/animations/intersectionAnimations";
import { setupStaggeredAnimation } from "../../utils/animations/staggerAnimations";
import { PrismicNextLink } from "@prismicio/next";
import SimplePlusButton from "@/components/SimplePlusButton";

// Helper type to add visible field to slice primary
type WithVisible<T> = T & { visible?: boolean };

/**
 * Props for `PopHeadline`.
 */
export type PopButtonProps = SliceComponentProps<Content.PopButtonSlice>;

/**
 * Component for "PopHeadline" Slices.
 */
const PopButton: FC<PopButtonProps> = ({ slice }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const mobileButtonRef = useRef<HTMLDivElement>(null);
  const desktopButtonRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileTextButtonRef = useRef<HTMLDivElement>(null);
  const desktopTextButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = setupFadeInAnimation(sectionRef.current);
    return cleanup;
  }, []);

  useEffect(() => {
    if (mobileButtonRef.current) {
      setupStaggeredAnimation(mobileButtonRef.current, {
        stagger: 0.2,
        duration: 0.6,
        ease: "power2.out"
      });
    }
    if (desktopButtonRef.current) {
      setupStaggeredAnimation(desktopButtonRef.current, {
        stagger: 0.2,
        duration: 0.6,
        ease: "power2.out"
      });
    }
  }, []);

  // Simple size calculation for mobile version
  useEffect(() => {
    if (!mobileContainerRef.current || !mobileTextButtonRef.current) return;

    const updateMobileSize = () => {
      if (!mobileContainerRef.current || !mobileTextButtonRef.current) return;
      const textHeight = mobileTextButtonRef.current.offsetHeight;
      if (textHeight > 0) {
        mobileContainerRef.current.style.height = `${textHeight}px`;
        mobileContainerRef.current.style.width = `${textHeight}px`;
      }
    };

    updateMobileSize();
    const observer = new ResizeObserver(updateMobileSize);
    observer.observe(mobileTextButtonRef.current);
    return () => observer.disconnect();
  }, []);

  // Simple size calculation for desktop version
  useEffect(() => {
    if (!desktopContainerRef.current || !desktopTextButtonRef.current) return;

    const updateDesktopSize = () => {
      if (!desktopContainerRef.current || !desktopTextButtonRef.current) return;
      const textHeight = desktopTextButtonRef.current.offsetHeight;
      if (textHeight > 0) {
        desktopContainerRef.current.style.height = `${textHeight}px`;
        desktopContainerRef.current.style.width = `${textHeight}px`;
      }
    };

    updateDesktopSize();
    const observer = new ResizeObserver(updateDesktopSize);
    observer.observe(desktopTextButtonRef.current);
    return () => observer.disconnect();
  }, []);

  // Early return if not visible
  if (!((slice.primary as WithVisible<typeof slice.primary>).visible ?? true)) return null;

  return (
    <>
      {/* Mobile version - visible on mobile, hidden on desktop */}
      <section ref={sectionRef} className="flex gap-2 md:hidden">
        <div ref={mobileTextButtonRef} className="bg-white rounded-r-full pl-8 pr-12 pt-3 pb-3 w-fit text-gray-800">
          <h2>
            {slice.primary.button?.text}
          </h2>
        </div>
        <div ref={mobileButtonRef} className="flex items-stretch">
          <div ref={mobileContainerRef} className="flex-shrink-0 overflow-hidden aspect-square">
            <PrismicNextLink field={slice.primary.button} className="block h-full w-full">
              <SimplePlusButton big={true} disableAutoSize={true} />
            </PrismicNextLink>
          </div>
        </div>
      </section>

      {/* Desktop version - hidden on mobile, visible on desktop */}
      <section className="hidden md:flex gap-2">
        <div ref={desktopTextButtonRef} className="bg-white rounded-r-full pl-8 pr-12 pt-6 pb-6 w-fit text-gray-800">
          <h2>
            {slice.primary.button?.text}
          </h2>
        </div>
        <div ref={desktopButtonRef} className="flex items-stretch">
          <div ref={desktopContainerRef} className="flex-shrink-0 overflow-hidden aspect-square">
            <PrismicNextLink field={slice.primary.button} className="block h-full w-full">
              <SimplePlusButton big={true} disableAutoSize={true} />
            </PrismicNextLink>
          </div>
        </div>
      </section>
    </>
  );
};

export default PopButton;
