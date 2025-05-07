"use client"
import { Content } from "@prismicio/client";
import { PrismicNextLink } from "@prismicio/next";

type CtaProps = {
  cta?: Content.LinkField & { text?: string };
};

export default function Cta({ cta }: CtaProps) {
  if (!cta) return null;

  return (
    <PrismicNextLink 
      className="text-white bg-black rounded-2xl px-6 py-2 fixed top-4 right-4 hover:bg-white hover:text-black transition-all duration-200" 
      field={cta}
    >
      {cta.text}
    </PrismicNextLink>
  );
}
