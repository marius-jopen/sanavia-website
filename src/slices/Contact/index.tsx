"use client"
import { FC, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Script from "next/script";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";

/**
 * Props for `Contact`.
 */
export type ContactProps = SliceComponentProps<Content.ContactSlice>;

/**
 * Component for "Contact" Slices.
 */
const Contact: FC<ContactProps> = ({ slice }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const formRefLeft = useRef<HTMLDivElement>(null);
  const formRefRight = useRef<HTMLDivElement>(null);
  const [openModal, setOpenModal] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    const boxEl = boxRef.current;
    const leftEl = formRefLeft.current;
    const rightEl = formRefRight.current;
    if (!boxEl) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(boxEl, { x: 0, opacity: 1, clearProps: 'transform' });
      if (leftEl) gsap.set(leftEl, { opacity: 1 });
      if (rightEl) gsap.set(rightEl, { opacity: 1 });
      return;
    }

    // Initial states
    gsap.set(boxEl, { x: -40, opacity: 0 });
    if (leftEl) gsap.set(leftEl, { opacity: 0 });
    if (rightEl) gsap.set(rightEl, { opacity: 0 });

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

    // Fade-in the embedded forms when HubSpot injects content
    const setupFormFade = (target: HTMLDivElement | null) => {
      if (!target) return { cleanup: () => {}, timeoutId: 0 };
      let hasFaded = false;
      const timeoutId = window.setTimeout(() => {
        if (!hasFaded) {
          gsap.to(target, { duration: 0.4, opacity: 1, ease: "power2.out" });
          hasFaded = true;
        }
      }, 2000);

      const mo = new MutationObserver(() => {
        if (!hasFaded && target.childElementCount > 0) {
          gsap.to(target, { duration: 0.4, opacity: 1, delay: 0.15, ease: "power2.out" });
          hasFaded = true;
          mo.disconnect();
        }
      });
      mo.observe(target, { childList: true, subtree: true });

      return {
        cleanup: () => {
          mo.disconnect();
          window.clearTimeout(timeoutId);
        },
        timeoutId
      };
    };

    const left = setupFormFade(leftEl);
    const right = setupFormFade(rightEl);

    return () => {
      observer.disconnect();
      left.cleanup();
      right.cleanup();
    };
  }, []);

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <Script src="https://js.hsforms.net/forms/embed/50539793.js" strategy="afterInteractive" />
      <div ref={boxRef} className="bg-white rounded-r-2xl -ml-[100px] pl-[100px] md:w-full mt-2 mr-4 md:mr-2 text-gray-800">
        <div className="py-6 md:py-8 px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 pb-2">
            <div className="flex flex-col justify-between">
              <div className="text-gray-700 text-base md:text-2xl leading-relaxed">
                <PrismicRichText field={slice.primary.text_1} />
              </div>

              <Button
                className="w-full md:w-auto mt-4"
                onClick={() => setOpenModal("left")}
                label={slice.primary.button_1 || "Button One"}
                innerClassName="bg-black text-white text-base md:text-2xl rounded-full px-6 py-2 hover:bg-gray-100 hover:text-black transition-all duration-200"
              />
    
            </div>

            <div className="flex flex-col justify-between">
              <div className="text-gray-700 text-base md:text-2xl leading-relaxed">
                <PrismicRichText field={slice.primary.text_2} />
              </div>

              <Button
                className="w-full md:w-auto mt-4"
                onClick={() => setOpenModal("right")}
                label={slice.primary.button_2 || "Button Two"}
                innerClassName="bg-black text-white text-base md:text-2xl rounded-full px-6 py-2 hover:bg-gray-100 hover:text-black transition-all duration-200"
              />

            </div>
          </div>
        </div>
      </div>

      {/* Left modal */}
      <Modal isOpen={openModal === "left"} onClose={() => setOpenModal(null)} maxWidth="max-w-3xl">
        <div className="p-6 md:p-8">
          <div
            ref={formRefLeft}
            className="hs-form-frame"
            data-region="na1"
            data-form-id="d9c97177-bfda-4828-bd3b-ef6a4bd23ada"
            data-portal-id="50539793"
          />
        </div>
      </Modal>

      {/* Right modal */}
      <Modal isOpen={openModal === "right"} onClose={() => setOpenModal(null)} maxWidth="max-w-3xl">
        <div className="p-6 md:p-8">
          <div
            ref={formRefRight}
            className="hs-form-frame"
            data-region="na1"
            data-form-id="d9c97177-bfda-4828-bd3b-ef6a4bd23ada"
            data-portal-id="50539793"
          />
        </div>
      </Modal>
    </section>
  );
};

export default Contact;
