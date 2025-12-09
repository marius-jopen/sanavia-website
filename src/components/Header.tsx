"use client"
import { Content } from "@prismicio/client";
import Navigation from "./Navigation";
import MobileNav from "./MobileNav";
import Logo from "./Logo";
import Cta from "./Cta";

type HeaderProps = {
  data: Content.HeaderDocumentData;
  enableAnimation?: boolean;
};

export default function Header({ data }: HeaderProps) {
  const navigationLinks = data.navigation_header.map(link => ({
    text: link.text || '',
    link: link
  }));

  return (
    <header>
        <Cta cta={data.cta} />

        <div>
            <div className="fixed z-50 top-0">
                <Logo logo={data.logo} enableAnimation={false} />
            </div>

            {/* Desktop Navigation */}
            <div className="fixed z-50 top-0 mt-20 hidden md:block">
              <Navigation 
                enableStagger={false} 
                enableAnimation={false}
                links={navigationLinks} 
              />
            </div>

            {/* Mobile Navigation */}
            <MobileNav links={navigationLinks} cta={data.cta} logo={data.logo} />
        </div>
    </header>
  );
}
