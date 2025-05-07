"use client"
import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { useToggle } from "./ExpandableSection";

interface ToggleButtonProps {
  buttonText: string;
}

const ANIMATION_CONFIG = {
  duration: 0.2,
  ease: "power2.inOut",
} as const;

const ToggleButton: React.FC<ToggleButtonProps> = ({ buttonText }) => {
  const { isToggled, toggle } = useToggle();
  const buttonRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const iconWidthRef = useRef<number>(0);
  const textWidthRef = useRef<number>(0);
  const hasText = Boolean(buttonText);

  const saveWidths = useCallback(() => {
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: nowrap;
      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
    `;
    document.body.appendChild(tempDiv);

    // Measure icon width - use the height of the button to make it square
    const buttonHeight = buttonRef.current?.offsetHeight || 48; // fallback to 48 if not available
    iconWidthRef.current = buttonHeight; // Make it square by using height as width

    // Measure text width
    tempDiv.innerHTML = `<h4><span class="whitespace-nowrap">${buttonText || ''}</span></h4>`;
    textWidthRef.current = tempDiv.offsetWidth + 48; // Using fixed padding for text width

    document.body.removeChild(tempDiv);
  }, [buttonText]);

  // Update widths when button height changes
  useEffect(() => {
    const updateWidths = () => {
      if (buttonRef.current) {
        const buttonHeight = buttonRef.current.offsetHeight;
        iconWidthRef.current = buttonHeight;
      }
    };

    // Initial update
    updateWidths();
    saveWidths();

    // Create ResizeObserver to watch for height changes
    const resizeObserver = new ResizeObserver(() => {
      updateWidths();
      saveWidths();
    });
    if (buttonRef.current) {
      resizeObserver.observe(buttonRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [saveWidths]);

  useEffect(() => {
    if (!buttonRef.current || !iconRef.current) return;

    const animateIcon = (rotation: number) => {
      gsap.to(iconRef.current, {
        rotation,
        ...ANIMATION_CONFIG,
      });
    };

    const animateWidth = (width: number) => {
      gsap.to(buttonRef.current, {
        width,
        ...ANIMATION_CONFIG,
      });
    };

    if (isToggled) {
      if (hasText) {
        animateWidth(iconWidthRef.current);
        setTimeout(() => animateIcon(45), ANIMATION_CONFIG.duration * 1000);
      } else {
        animateIcon(45);
      }
    } else {
      if (hasText) {
        animateIcon(0);
        setTimeout(() => animateWidth(textWidthRef.current), ANIMATION_CONFIG.duration * 1000);
      } else {
        animateIcon(0);
      }
    }
  }, [isToggled, hasText]);

  const handleMouseEnter = () => {
    if (iconRef.current && !isToggled) {
      gsap.to(iconRef.current, {
        rotation: 45,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }
  };

  const handleMouseLeave = () => {
    if (iconRef.current && !isToggled) {
      gsap.to(iconRef.current, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }
  };

  const buttonWidth = hasText 
    ? (isToggled ? iconWidthRef.current : textWidthRef.current) || 'auto'
    : iconWidthRef.current || 'auto';

  return (
    <div 
      ref={buttonRef}
      className="bg-white rounded-full cursor-pointer text-gray-800 hover:bg-black hover:text-white transition-all duration-200 whitespace-nowrap overflow-hidden h-full flex items-center justify-center"
      style={{ width: buttonWidth }}
      onClick={toggle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasText && !isToggled ? (
        <h3>
          <span className="whitespace-nowrap">{buttonText}</span>
        </h3>
      ) : (
        <div className="h-full flex items-center justify-center aspect-square">
          <div 
            ref={iconRef} 
            className="inline-block w-4 h-full relative"
            style={{ transform: hasText && isToggled ? 'rotate(45deg)' : 'none' }}
          >
            <h3>
              <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-current transform -translate-y-1/2"></span>
              <span className="absolute top-1/2 left-0 w-full h-[1.5px] bg-current transform -translate-y-1/2 rotate-90"></span>
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToggleButton; 