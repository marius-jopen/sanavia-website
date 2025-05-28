"use client"
import { PrismicNextLink } from "@prismicio/next";
import { useState } from "react";
import { LinkField } from "@prismicio/client";

type MobileNavProps = {
  links: { text: string; link: LinkField }[];
  cta?: LinkField;
};

export default function MobileNav({ links, cta }: MobileNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={closeMobileMenu}>
          <div className="fixed inset-0 bg-white shadow-lg transform transition-transform duration-300 flex flex-col">
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button
                onClick={closeMobileMenu}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Close menu"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            {/* Mobile Navigation Links */}
            <nav className="px-4 pb-4 flex-1">
              {links.map((link, index) => (
                <div 
                  className="mb-2 mt-2"
                  key={index}
                >
                  <PrismicNextLink 
                    field={link.link}
                    className="block w-full px-4 py-3 bg-gray-50 rounded-2xl hover:bg-black hover:text-white transition-colors"
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
