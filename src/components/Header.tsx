"use client"
import { Content } from "@prismicio/client";
import { PrismicNextLink } from "@prismicio/next";
import Navigation from "./Navigation";
import Logo from "./Logo";

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
            <Logo logo={data.logo} />

            <Navigation links={data.navigation_header.map(link => ({
              text: link.text || '',
              link: link
            }))} />
        </div>
    </header>
  );
}
