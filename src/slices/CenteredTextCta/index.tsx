"use client"
import { FC, useEffect, useRef } from "react";
import { Content, isFilled } from "@prismicio/client";
import { SliceComponentProps, PrismicRichText } from "@prismicio/react";
import { PrismicNextLink } from "@prismicio/next";
import { setupFadeInAnimation } from "../../utils/animations/intersectionAnimations";

/**
 * Props for `CenteredTextCta`.
 */
export type CenteredTextCtaProps =
  SliceComponentProps<Content.CenteredTextCtaSlice>;

/**
 * Component for "CenteredTextCta" Slices.
 */
const CenteredTextCta: FC<CenteredTextCtaProps> = ({ slice }) => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const cleanup = setupFadeInAnimation(sectionRef.current);
    return cleanup;
  }, []);

  return (
    <section ref={sectionRef} className="w-full mb-4 px-4">
      <div className="border-2 border-white rounded-2xl overflow-hidden md:px-8 py-16 flex flex-col items-center gap-10">
        <div className="text-center md:w-8/12 mx-auto">
          <PrismicRichText field={slice.primary.headline} />
        </div>

        {isFilled.link(slice.primary.cta) && (
          <PrismicNextLink
            field={slice.primary.cta}
            className="bg-white hover:bg-black text-black hover:text-white text-base rounded-full px-8 py-2.5 transition-colors duration-200"
          >
            {slice.primary.cta.text}
          </PrismicNextLink>
        )}
      </div>
    </section>
  );
};

export default CenteredTextCta;
