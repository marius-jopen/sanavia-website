"use client"
import { Content } from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import { useEffect, useRef } from "react";
import { setupFadeInAnimation } from "@/utils/animations/intersectionAnimations";
import Link from "next/link";

type LogoProps = {
  logo?: Content.ImageFieldImage;
};

export default function Logo({ logo }: LogoProps) {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logoRef.current) {
      setupFadeInAnimation(logoRef.current);
    }
  }, []);

  if (!logo) return null;

  return (
    <Link href="/">
      <div ref={logoRef} className="mt-2 mb-2 rounded-r-xl pl-8 pt-3 pb-4 w-40 pr-5 bg-white">
        <PrismicNextImage field={logo} fallbackAlt="" />
      </div>
    </Link>
  );
}
