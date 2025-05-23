"use client"
import { useRef, useEffect } from "react";
import gsap from "gsap";

type SimplePlusButtonProps = {
  onClick?: () => void;
  className?: string;
  big?: boolean;
};

export default function SimplePlusButton({ onClick, className = "", big = false }: SimplePlusButtonProps) {
  const iconRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update container width to match height
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight;
        containerRef.current.style.width = `${height}px`;
      }
    };

    // Initial update
    updateContainerWidth();

    // Create ResizeObserver to watch for height changes
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

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
      ref={containerRef}
      className={`bg-white rounded-full cursor-pointer text-gray-800 hover:bg-black hover:text-white transition-all duration-200 flex items-center justify-center h-full aspect-square ${className}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={iconRef} 
        className="inline-block w-4 h-full relative"
        style={{ transform: big ? 'scale(0.5) md:scale(1.5)' : 'none' }}
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
