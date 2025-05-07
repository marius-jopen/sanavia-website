"use client"
import { PrismicNextLink } from "@prismicio/next";
import { useEffect, useRef } from "react";
import { setupStaggeredAnimation } from "@/utils/animations/staggerAnimations";

type NavigationProps = {
  links: { text: string; link: any }[];
};

export default function Navigation({ links }: NavigationProps) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!navRef.current) return;
    setupStaggeredAnimation(navRef.current, {
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out"
    });
  }, []);

  return (
    <nav ref={navRef} className="flex gap-1 mb-2">
      {links.map((link, index) => (
        <div 
          className={`${
            index === 0 
              ? 'rounded-r-xl pl-8 pr-4 bg-white' 
              : 'bg-white rounded-xl px-4'
          } py-2 hover:bg-black hover:text-white transition-colors`} 
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
