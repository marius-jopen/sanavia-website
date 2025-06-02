"use client"
import { ImageField } from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import { useEffect, useRef } from "react";
import { setupFadeInAnimation } from "@/utils/animations/intersectionAnimations";
import Link from "next/link";

type LogoProps = {
  logo?: ImageField;
  enableAnimation?: boolean;
  fixed?: boolean;
};

export default function Logo({ logo, enableAnimation = true, fixed = false }: LogoProps) {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logoRef.current && enableAnimation) {
      setupFadeInAnimation(logoRef.current);
    }
  }, [enableAnimation]);

  if (!logo) return null;

  return (
    <Link href="/">
      <div 
        ref={logoRef} 
        className={`
          rounded-r-2xl pl-8 pt-3 pb-4 w-40 pr-5 bg-white
          ${fixed ? 'fixed top-4 left-0 z-50' : 'mt-4 mb-2'}
        `}
      >
        <PrismicNextImage field={logo} fallbackAlt="" />
      </div>
    </Link>
  );
}
