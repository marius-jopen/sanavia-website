"use client"
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useToggle } from "./ExpandableSection";

interface ToggleButtonProps {
  buttonText: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ buttonText }) => {
  const { isToggled, toggle } = useToggle();
  const [displayX, setDisplayX] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const xIconWidthRef = useRef<number>(0);
  const textWidthRef = useRef<number>(0);

  // Calculate and store widths for animation
  const saveWidths = () => {
    // Create temporary elements to measure widths
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    document.body.appendChild(tempDiv);

    // Measure X icon width
    tempDiv.innerHTML = `
      <span class="inline-block w-4 h-4 relative"></span>
    `;
    xIconWidthRef.current = tempDiv.offsetWidth + 48; // Add padding

    // Measure text width
    tempDiv.innerHTML = buttonText || '';
    textWidthRef.current = tempDiv.offsetWidth + 48; // Add padding

    // Clean up
    document.body.removeChild(tempDiv);
  };

  // Initialize on mount
  useEffect(() => {
    // Save the widths for animation
    saveWidths();
  }, [buttonText]);

  // Handle content change and button animation when toggling
  useEffect(() => {
    if (!buttonRef.current) return;
    
    if (isToggled) {
      // When opening: First change to X, then animate width
      setDisplayX(true);
      
      // Wait a tiny bit for the DOM to update
      setTimeout(() => {
        // Then animate width to X size
        gsap.to(buttonRef.current, {
          width: xIconWidthRef.current,
          duration: 0.1,
          ease: "power2.inOut"
        });
      }, 10);
    } else {
      // When closing: First animate width, then change to text
      gsap.to(buttonRef.current, {
        width: textWidthRef.current,
        duration: 0.1,
        ease: "power2.inOut",
        onComplete: () => {
          // After width animation, switch to text
          setDisplayX(false);
        }
      });
    }
  }, [isToggled]);

  return (
    <div 
      ref={buttonRef}
      className="bg-white rounded-4xl px-6 py-6 cursor-pointer hover:bg-gray-50 transition-colors border border-[var(--color-border)] whitespace-nowrap"
      onClick={toggle}
    >
      {displayX ? (
        <span className="inline-block w-4 h-4 relative">
          <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-black rotate-45 -translate-y-1/2"></span>
          <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-black -rotate-45 -translate-y-1/2"></span>
        </span>
      ) : (
        <span className="whitespace-nowrap">{buttonText}</span>
      )}
    </div>
  );
};

export default ToggleButton; 