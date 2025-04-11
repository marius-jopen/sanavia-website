"use client"
import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { useToggle } from "./ExpandableSection";

interface ToggleButtonProps {
  buttonText: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ buttonText }) => {
  const { isToggled, toggle } = useToggle();
  const buttonRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const iconWidthRef = useRef<number>(0);
  const textWidthRef = useRef<number>(0);
  const hasText = !!buttonText;

  // Calculate and store widths for animation
  const saveWidths = useCallback(() => {
    // Create temporary elements to measure widths
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    // Add font styles to match the actual rendered text
    tempDiv.style.fontFamily = 'inherit';
    tempDiv.style.fontSize = 'inherit';
    tempDiv.style.fontWeight = 'inherit';
    document.body.appendChild(tempDiv);

    // Measure icon width
    tempDiv.innerHTML = `
      <span class="inline-block w-4 h-[22px] relative"></span>
    `;
    iconWidthRef.current = tempDiv.offsetWidth + 48; // Add padding

    // Measure text width with better simulation of actual rendering
    tempDiv.innerHTML = `<h4><span class="whitespace-nowrap">${buttonText || ''}</span></h4>`;
    // Increase padding buffer to prevent text from being cut off
    textWidthRef.current = tempDiv.offsetWidth + 48; // Increased padding from 48 to 64

    // Clean up
    document.body.removeChild(tempDiv);
  }, [buttonText]);

  // Initialize on mount
  useEffect(() => {
    // Save the widths for animation
    saveWidths();
  }, [saveWidths]);

  // Handle animation when toggling
  useEffect(() => {
    if (!buttonRef.current || !iconRef.current) return;
    
    if (isToggled) {
      // When toggling on
      if (hasText) {
        // If we have text, animate the width first
        gsap.to(buttonRef.current, {
          width: iconWidthRef.current,
          duration: 0.2,
          ease: "power2.inOut",
          onComplete: () => {
            // After width change, animate the icon rotation
            gsap.to(iconRef.current, {
              rotation: 45,
              duration: 0.2,
              ease: "power2.inOut"
            });
          }
        });
      } else {
        // If no text (already showing +), just rotate
        gsap.to(iconRef.current, {
          rotation: 45,
          duration: 0.3,
          ease: "power2.inOut"
        });
      }
    } else {
      // When toggling off
      if (hasText) {
        // First rotate back to +
        gsap.to(iconRef.current, {
          rotation: 0,
          duration: 0.2,
          ease: "power2.inOut",
          onComplete: () => {
            // Then animate width back to text width
            gsap.to(buttonRef.current, {
              width: textWidthRef.current,
              duration: 0.2,
              ease: "power2.inOut"
            });
          }
        });
      } else {
        // If no text, just rotate back to +
        gsap.to(iconRef.current, {
          rotation: 0,
          duration: 0.3,
          ease: "power2.inOut"
        });
      }
    }
  }, [isToggled, hasText]);

  return (
    <div 
      ref={buttonRef}
      className="bg-white rounded-4xl px-6 py-4 cursor-pointer text-gray-800 hover:bg-black hover:text-white transition-all duration-200 whitespace-nowrap overflow-hidden"
      style={{ width: hasText ? (isToggled ? iconWidthRef.current : textWidthRef.current) || 'auto' : iconWidthRef.current || 'auto' }}
      onClick={toggle}
    >
      {hasText && !isToggled ? (
        <h4>
          <span className="whitespace-nowrap block">
            {buttonText}
          </span>
        </h4>
      ) : (
        <div 
          ref={iconRef} 
          className="inline-block w-4 h-[22px] relative translate-y-[3px]"
          style={{ transform: hasText && isToggled ? 'rotate(45deg)' : 'none' }}
        >
          <h4>
            {/* Horizontal line (always visible) */}
            <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-current transform -translate-y-1/2"></span>
            {/* Vertical line (stays vertical in + mode, rotates to diagonal in X mode) */}
            <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-current transform -translate-y-1/2 rotate-90"></span>
          </h4>
        </div>
      )}
    </div>
  );
};

export default ToggleButton; 