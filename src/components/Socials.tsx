"use client"
import { Content } from "@prismicio/client";
import { PrismicNextImage, PrismicNextLink } from "@prismicio/next";
import { useEffect, useRef } from "react";
import { setupStaggeredAnimation } from "@/utils/animations/staggerAnimations";

type SocialsProps = {
  socials: Content.HeaderDocumentData["socials"];
};

export default function Socials({ socials }: SocialsProps) {
  const socialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socialsRef.current) return;
    setupStaggeredAnimation(socialsRef.current, {
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out"
    });
  }, []);

  return (
    <div ref={socialsRef} className="flex gap-1">
      {socials.map((item, index) => (
        <div 
          className={`group ${
            index === 0 
              ? 'rounded-r-xl pl-8 pr-4 bg-white' 
              : 'bg-white rounded-xl px-4'
          } py-2 hover:bg-black hover:text-white transition-colors`} 
          key={index}
        >
          <PrismicNextLink field={item.link}>
            {item.icon && (
              <PrismicNextImage 
                field={item.icon} 
                fallbackAlt="" 
                className="group-hover:brightness-0 group-hover:invert"
              />
            )}
          </PrismicNextLink>
        </div>
      ))}
    </div>
  );
}
