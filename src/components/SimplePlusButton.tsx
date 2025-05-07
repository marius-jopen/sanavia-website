"use client"
import { useRef } from "react";
import gsap from "gsap";

type SimplePlusButtonProps = {
  onClick?: () => void;
  className?: string;
};

export default function SimplePlusButton({ onClick, className = "" }: SimplePlusButtonProps) {
  const iconRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        rotation: 45,
        duration: 0.3,
        ease: "power2.inOut"
      });
    }
  };

  const handleMouseLeave = () => {
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.inOut"
      });
    }
  };

  return (
    <div 
      className={`bg-white rounded-full px-6 py-4 cursor-pointer text-gray-800 hover:bg-black hover:text-white transition-all duration-200 ${className}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={iconRef} 
        className="inline-block w-4 h-[22px] relative translate-y-[3px]"
      >
        <h4>
          {/* Horizontal line (always visible) */}
          <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-current transform -translate-y-1/2"></span>
          {/* Vertical line (stays vertical in + mode, rotates to diagonal in X mode) */}
          <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-current transform -translate-y-1/2 rotate-90"></span>
        </h4>
      </div>
    </div>
  );
}
