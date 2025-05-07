"use client"
import { Content } from "@prismicio/client";
import { PrismicNextImage, PrismicNextLink } from "@prismicio/next";
import Navigation from "./Navigation";

type HeaderProps = {
  data: Content.HeaderDocumentData;
};

export default function Header({ data }: HeaderProps) {
  return (
    <header>
      <div>
        {data.logo && (
          <PrismicNextImage field={data.logo} fallbackAlt="" />
        )}

        <Navigation links={data.navigation_header} variant="header" />

        {data.cta && (
            <PrismicNextLink field={data.cta} >
                {data.cta.text}
            </PrismicNextLink>
        )}
      </div>
    </header>
  );
}
