"use client"
import { PrismicNextLink } from "@prismicio/next";
import { useState, useEffect, useRef } from "react";
import { LinkField, ImageField } from "@prismicio/client";
import { gsap } from "gsap";
import Logo from "./Logo";

type MobileNavProps = {
  links: { text: string; link: LinkField }[];
  cta?: LinkField;
  logo?: ImageField;
};

export default function MobileNav({ links, cta, logo }: MobileNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement[]>([]);

  const toggleMobileMenu = () => {
    if (!isMobileMenuOpen) {
      setIsMobileMenuOpen(true);
    } else {
      closeMobileMenu();
    }
  };

  const closeMobileMenu = () => {
    if (overlayRef.current && menuRef.current) {
      // Disable pointer events during animation to prevent interference
      menuRef.current.style.pointerEvents = 'none';
      
      // Animate out
      const tl = gsap.timeline({
        onComplete: () => {
          setIsMobileMenuOpen(false);
          // Re-enable pointer events after animation completes
          if (menuRef.current) {
            menuRef.current.style.pointerEvents = 'auto';
          }
        }
      });
      
      tl.to(linksRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.2,
        stagger: 0.05
      })
      .to(menuRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.3
      }, "-=0.1")
      .to(overlayRef.current, {
        opacity: 0,
        duration: 0.2
      }, "-=0.2");
    }
  };

  // Animate in when menu opens
  useEffect(() => {
    if (isMobileMenuOpen && overlayRef.current && menuRef.current) {
      // Disable pointer events initially to prevent clicks during animation
      menuRef.current.style.pointerEvents = 'none';
      
      // Set initial states
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(menuRef.current, { opacity: 0, y: -30 });
      gsap.set(linksRef.current, { opacity: 0, y: -20 });

      // Animate in
      const tl = gsap.timeline({
        onComplete: () => {
          // Re-enable pointer events after animation completes
          if (menuRef.current) {
            menuRef.current.style.pointerEvents = 'auto';
          }
        }
      });
      
      tl.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3
      })
      .to(menuRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out"
      }, "-=0.1")
      .to(linksRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        stagger: 0.1,
        ease: "power2.out"
      }, "-=0.2");
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="md:hidden">
      {/* Burger Menu Button - Top Right */}
      <button
        onClick={toggleMobileMenu}
        className="fixed top-4 right-4 z-50 flex flex-col justify-center items-center w-14 h-14 bg-white rounded-full px-2 py-2 focus:outline-none"
        aria-label="Toggle mobile menu"
      >
        <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
        <span className={`block w-6 h-0.5 bg-black transition-all duration-300 my-1 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
        <span className={`block w-6 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-40" 
          onClick={closeMobileMenu}
        >
          {/* Fixed Logo when menu is open */}
            {logo && <Logo logo={logo} fixed={true} enableAnimation={false} />}
          
          <div 
            ref={menuRef}
            className="fixed inset-0 bg-white shadow-lg flex flex-col"
          >
            {/* Mobile Navigation Links */}
            <nav className="px-4 pb-4 flex-1 pt-20">
              {links.map((link, index) => (
                <div 
                  ref={(el) => {
                    if (el) linksRef.current[index] = el;
                  }}
                  className="mb-2 mt-2"
                  key={index}
                >
                  <PrismicNextLink 
                    field={link.link}
                    className="block w-full px-4 py-3 bg-gray-50 rounded-2xl hover:bg-black hover:text-white transition-colors text-center text-lg"
                    onClick={closeMobileMenu}
                  >
                    {link.text}
                  </PrismicNextLink>
                </div>
              ))}
            </nav>

            {/* CTA at bottom of menu */}
            {cta && (
              <div className="p-4 border-t border-gray-200">
                <PrismicNextLink 
                  className="block w-full text-center text-white bg-black rounded-2xl px-6 py-3 hover:bg-gray-800 transition-all duration-200" 
                  field={cta}
                  onClick={closeMobileMenu}
                >
                  {cta.text || "GET IN TOUCH"}
                </PrismicNextLink>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
