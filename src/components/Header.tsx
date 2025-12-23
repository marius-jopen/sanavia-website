"use client"
import { Content } from "@prismicio/client";
import { useState, useEffect, useRef } from "react";
import Navigation from "./Navigation";
import MobileNav from "./MobileNav";
import Logo from "./Logo";
import Cta from "./Cta";

type HeaderProps = {
  data: Content.HeaderDocumentData;
  enableAnimation?: boolean;
};

export default function Header({ data }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      // Don't hide header when mobile menu is open
      if (isMobileMenuOpen) return;
      
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Only hide/show after scrolling past a threshold (e.g., 100px)
          if (currentScrollY > 100) {
            if (currentScrollY > lastScrollY.current) {
              // Scrolling down
              setIsVisible(false);
            } else {
              // Scrolling up
              setIsVisible(true);
            }
          } else {
            // Always show at top of page
            setIsVisible(true);
          }
          
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobileMenuOpen]);

  const navigationLinks = data.navigation_header.map(link => ({
    text: link.text || '',
    link: link
  }));

  return (
    <header>
        <Cta cta={data.cta} isVisible={isVisible} />

        <div
          className={`fixed z-50 top-0 transition-transform duration-800 ease-in-out ${
            isVisible ? "translate-y-0 md:delay-100" : "-translate-y-40 delay-0"
          }`}
        >
            <Logo logo={data.logo} enableAnimation={false} />
        </div>

        {/* Desktop Navigation */}
        <div 
          className={`fixed z-50 top-0 mt-20 hidden md:block transition-transform duration-1000 ease-in-out ${
            isVisible ? "translate-y-0 delay-0" : "-translate-y-40 delay-100"
          }`}
        >
          <Navigation 
            enableStagger={false} 
            enableAnimation={false}
            links={navigationLinks} 
          />
        </div>

        {/* Mobile Navigation */}
        <MobileNav 
          links={navigationLinks} 
          cta={data.cta} 
          logo={data.logo} 
          isHeaderVisible={isVisible}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
    </header>
  );
}
