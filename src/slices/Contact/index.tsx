"use client"
import { FC, useEffect, useRef } from "react";
import gsap from "gsap";
import Script from "next/script";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `Contact`.
 */
export type ContactProps = SliceComponentProps<Content.ContactSlice>;

/**
 * Component for "Contact" Slices.
 */
const Contact: FC<ContactProps> = ({ slice }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const boxEl = boxRef.current;
    const formEl = formRef.current;
    if (!boxEl) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(boxEl, { x: 0, opacity: 1, clearProps: 'transform' });
      if (formEl) gsap.set(formEl, { opacity: 1 });
      return;
    }

    // Initial states
    gsap.set(boxEl, { x: -40, opacity: 0 });
    if (formEl) gsap.set(formEl, { opacity: 0 });

    let hasAnimatedBox = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedBox) {
            gsap.to(boxEl, {
              duration: 0.6,
              x: 0,
              opacity: 1,
              ease: "power2.out"
            });
            hasAnimatedBox = true;
          }

          if (!entry.isIntersecting) {
            const rect = entry.boundingClientRect;
            const isCompletelyOutOfView = rect.bottom < 0 || rect.top > window.innerHeight;
            if (isCompletelyOutOfView && hasAnimatedBox) {
              hasAnimatedBox = false;
              gsap.set(boxEl, { x: -40, opacity: 0 });
            }
          }
        });
      },
      { threshold: [0, 0.1], rootMargin: "100px 0px 100px 0px" }
    );

    observer.observe(boxEl);

    // Fade-in the embedded form when HubSpot injects content
    let hasFadedForm = false;
    let mutationObserver: MutationObserver | null = null;
    const timeoutId = window.setTimeout(() => {
      if (!hasFadedForm && formEl) {
        gsap.to(formEl, { duration: 0.4, opacity: 1, ease: "power2.out" });
        hasFadedForm = true;
      }
    }, 2000);

    if (formEl) {
      mutationObserver = new MutationObserver(() => {
        if (!hasFadedForm && formEl.childElementCount > 0) {
          gsap.to(formEl, { duration: 0.4, opacity: 1, delay: 0.15, ease: "power2.out" });
          hasFadedForm = true;
          mutationObserver && mutationObserver.disconnect();
        }
      });
      mutationObserver.observe(formEl, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      mutationObserver && mutationObserver.disconnect();
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <div ref={boxRef} className="bg-white rounded-r-2xl -ml-[100px] pl-[100px] md:w-full mt-2 mr-4 md:mr-2 text-gray-800">
        <Script
          src="https://js.hsforms.net/forms/embed/50539793.js"
          strategy="afterInteractive"
        />
        <div
          ref={formRef}
          className="hs-form-frame"
          data-region="na1"
          data-form-id="d9c97177-bfda-4828-bd3b-ef6a4bd23ada"
          data-portal-id="50539793"
        />
      </div>
    </section>
  );
};

export default Contact;
