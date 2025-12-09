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
    
    // Temporarily disable pointer events during initial animation
    navRef.current.style.pointerEvents = 'none';
    
    const cleanup = setupStaggeredAnimation(navRef.current, {
      stagger: enableStagger ? 0.2 : 0,
      duration: 0.6,
      ease: "power2.out"
    });
    
    // Re-enable pointer events after animation completes
    setTimeout(() => {
      if (navRef.current) {
        navRef.current.style.pointerEvents = 'auto';
      }
    }, (0.6 + (enableStagger ? 0.2 * 3 : 0)) * 1000); // Duration + stagger time
    
    return cleanup;
  }, [enableStagger, enableAnimation]);

  return (
    <nav ref={navRef} className=" flex-wrap flex gap-1 mb-2">
      {links.map((link, index) => (
        <PrismicNextLink 
          field={link.link}
          className={`${
            index === 0 
              ? 'rounded-r-2xl pl-8 pr-4 bg-white ' 
              : 'bg-white rounded-2xl px-4 '
          } py-2 hover:bg-black hover:text-white transition-colors block`}
          key={index}
        >
          {link.text}
        </PrismicNextLink>
      ))}
    </nav>
  );
}
