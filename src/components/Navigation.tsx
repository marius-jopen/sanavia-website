"use client"
import { PrismicNextLink } from "@prismicio/next";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type NavigationProps = {
  links: { text: string; link: any }[];
};

export default function Navigation({ links }: NavigationProps) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!navRef.current) return;

    const items = navRef.current.children;
    
    // Set initial state
    gsap.set(items, { 
      y: 100,
      opacity: 0
    });

    // Create observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.boundingClientRect.top > 0) {
            // Animate with stagger
            gsap.to(items, {
              duration: 0.6,
              y: 0,
              opacity: 1,
              stagger: 0.2,
              ease: "power2.out"
            });
          }
          
          if (!entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight) {
            // Reset for next entry
            gsap.set(items, { 
              y: 100,
              opacity: 0
            });
          }
        });
      },
      { 
        threshold: [0, 0.1], 
        rootMargin: "0px 0px 100px 0px"
      }
    );
    
    observer.observe(navRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <nav ref={navRef} className="flex gap-1">
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
