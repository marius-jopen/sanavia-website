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
        {data.cta && (
            <PrismicNextLink className="text-white bg-black rounded-xl px-4 py-2 fixed top-4 right-4" field={data.cta} >
                {data.cta.text}
            </PrismicNextLink>
        )}

        <div>
            {data.logo && (
                <div className="mt-2 mb-2 rounded-r-xl pl-8 pt-3 pb-4 w-40 pr-5 bg-white">
                    <PrismicNextImage field={data.logo} fallbackAlt="" />
                </div>
            )}

            <Navigation links={data.navigation_header.map(link => ({
              text: link.text || '',
              link: link
            }))} />
        </div>
    </header>
  );
}
