"use client"
import { PrismicNextLink } from "@prismicio/next";
import { LinkField } from "@prismicio/client";

type CtaProps = {
  cta?: LinkField;
};

export default function Cta({ cta }: CtaProps) {
  if (!cta) return null;

  return (
    <PrismicNextLink 
      className="hidden md:block text-white bg-black rounded-2xl px-6 py-2 fixed top-4 right-4 hover:bg-white hover:text-black transition-all duration-200 z-20" 
      field={cta}
    >
      {cta.text || "GET IN TOUCH"}
    </PrismicNextLink>
  );
}
