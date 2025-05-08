"use client"
import { FC, useEffect, useRef } from "react";
import { setupFadeInAnimation } from "../utils/animations/intersectionAnimations";
import { KeyTextField } from "@prismicio/client";

type BottomTextProps = {
  text: KeyTextField;
};

const BottomText: FC<BottomTextProps> = ({ text }) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = setupFadeInAnimation(sectionRef.current);
    return cleanup;
  }, []);

  if (!text) return null;

  return (
    <div ref={sectionRef} className="bg-white rounded-r-2xl pl-8 pr-4 py-2 w-fit mt-2 mb-4">
      {text}
    </div>
  );
};

export default BottomText;
