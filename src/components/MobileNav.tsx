"use client"
import { PrismicNextLink } from "@prismicio/next";
import { LinkField, ImageField } from "@prismicio/client";
import Logo from "./Logo";

type MobileNavProps = {
  links: { text: string; link: LinkField }[];
  cta?: LinkField;
  logo?: ImageField;
  isHeaderVisible?: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
};

export default function MobileNav({ links, cta, logo, isHeaderVisible = true, isMobileMenuOpen, setIsMobileMenuOpen }: MobileNavProps) {
  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        className={`burger-button fixed top-4 right-4 z-[60] flex flex-col justify-center items-center w-14 h-14 bg-white rounded-full px-2 py-2 focus:outline-none ${
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
          className="fixed inset-0 z-40" 
          onClick={closeMobileMenu}
        >
          {/* Fixed Logo when menu is open */}
            {logo && <Logo logo={logo} fixed={true} enableAnimation={false} />}
          
          <div className="fixed inset-0 bg-white shadow-lg flex flex-col">
            {/* Mobile Navigation Links */}
            <nav className="px-4 pb-4 flex-1 pt-20">
              {links.map((link, index) => (
                <div 
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
