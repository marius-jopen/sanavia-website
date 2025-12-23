"use client"
import { PrismicNextLink } from "@prismicio/next";
import { LinkField } from "@prismicio/client";

type CtaProps = {
  cta?: LinkField;
  isVisible?: boolean;
};

export default function Cta({ cta, isVisible = true }: CtaProps) {
  if (!cta) return null;

  return (
    <PrismicNextLink 
      className={`hidden md:block text-white bg-black rounded-full px-6 py-2 fixed top-4 right-4 hover:bg-white hover:text-black transition-transform duration-800 ease-in-out z-50 ${
        isVisible ? "translate-y-0 delay-100" : "-translate-y-40 delay-0"
      }`}
      field={cta}
    >
      {cta.text || "GET IN TOUCH"}
    </PrismicNextLink>
  );
}
