"use client"
import { Content } from "@prismicio/client";
import Navigation from "./Navigation";
import Logo from "./Logo";
import Cta from "./Cta";

type HeaderProps = {
  data: Content.HeaderDocumentData;
  enableAnimation?: boolean;
};

export default function Header({ data }: HeaderProps) {
  return (
    <header>
        <Cta cta={data.cta} />

        <div>
            <Logo logo={data.logo} enableAnimation={false} />

            <Navigation 
              enableStagger={false} 
              enableAnimation={false}
              links={data.navigation_header.map(link => ({
                text: link.text || '',
                link: link
              }))} 
            />
        </div>
    </header>
  );
}
