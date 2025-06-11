"use client"
import { PrismicNextLink } from "@prismicio/next";
import { useEffect, useRef } from "react";
import { setupStaggeredAnimation } from "@/utils/animations/staggerAnimations";
import { LinkField } from "@prismicio/client";

type NavigationProps = {
  links: { text: string; link: LinkField }[];
  enableStagger?: boolean;
  enableAnimation?: boolean;
};

export default function Navigation({ links, enableStagger = true, enableAnimation = true }: NavigationProps) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!navRef.current || !enableAnimation) return;
    setupStaggeredAnimation(navRef.current, {
      stagger: enableStagger ? 0.2 : 0,
      duration: 0.6,
      ease: "power2.out"
    });
  }, [enableStagger, enableAnimation]);

  return (
    <nav ref={navRef} className="hidden md:flex gap-1 mb-2">
      {links.map((link, index) => (
        <div 
          className={`${
            index === 0 
              ? 'rounded-r-2xl pl-8 pr-4 bg-white ' 
              : 'bg-white rounded-2xl px-4 '
          } py-2 hover:bg-black hover:text-white transition-colors `} 
          key={index}
        >
          <PrismicNextLink field={link.link}>
            {link.text}
          </PrismicNextLink>
        </div>
      ))}
    </nav>
  );
}
