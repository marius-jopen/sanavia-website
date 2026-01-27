"use client"
import { PrismicNextLink } from "@prismicio/next";
import { useEffect, useRef } from "react";
import { LinkField, ImageField } from "@prismicio/client";
import { gsap } from "gsap";
import Logo from "./Logo";

/**
 * iOS 18 Safari Performance Note:
 * iOS 18 introduced performance regressions with CSS transforms/transitions.
 * This component uses translate3d, force3D, and backface-visibility optimizations
 * to ensure smooth animations on real iOS devices (BrowserStack may not reproduce the issue).
 */

type MobileNavProps = {
  links: { text: string; link: LinkField }[];
  cta?: LinkField;
  logo?: ImageField;
  isHeaderVisible?: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
};

export default function MobileNav({ links, cta, logo, isHeaderVisible = true, isMobileMenuOpen, setIsMobileMenuOpen }: MobileNavProps) {
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
        stagger: 0.05,
        force3D: true
      })
      .to(menuRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.3,
        force3D: true
      }, "-=0.1")
      .to(overlayRef.current, {
        opacity: 0,
        duration: 0.2,
        force3D: true
      }, "-=0.2");
    }
  };

  // Animate in when menu opens - menu appears instantly, only links animate
  useEffect(() => {
    if (isMobileMenuOpen && overlayRef.current && menuRef.current) {
      // Menu and overlay appear instantly (no animation)
      gsap.set(overlayRef.current, { opacity: 1 });
      gsap.set(menuRef.current, { opacity: 1, y: 0, force3D: true });
      
      // Only animate the links flying in
      gsap.set(linksRef.current, { opacity: 0, y: -20, force3D: true });
      
      gsap.to(linksRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        stagger: 0.1,
        ease: "power2.out",
        force3D: true
      });
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="md:hidden">
      {/* Burger Menu Button - Top Right */}
      <button
        onClick={toggleMobileMenu}
        className={`burger-button fixed top-4 right-4 z-50 flex flex-col justify-center items-center w-14 h-14 bg-white rounded-full px-2 py-2 focus:outline-none ${
          isHeaderVisible ? "burger-visible" : "burger-hidden"
        } ${isMobileMenuOpen ? "burger-open" : ""}`}
        aria-label="Toggle mobile menu"
      >
        <span className="burger-line burger-line-1"></span>
        <span className="burger-line burger-line-2"></span>
        <span className="burger-line burger-line-3"></span>
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-40" 
          onClick={closeMobileMenu}
          style={{ willChange: 'opacity' }}
        >
          {/* Fixed Logo when menu is open */}
            {logo && <Logo logo={logo} fixed={true} enableAnimation={false} />}
          
          <div 
            ref={menuRef}
            className="fixed inset-0 bg-white shadow-lg flex flex-col"
            style={{ 
              willChange: 'transform, opacity', 
              transform: 'translate3d(0, 0, 0)',
              WebkitTransform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
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
