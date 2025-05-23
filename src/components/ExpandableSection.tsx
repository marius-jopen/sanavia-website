"use client"
import React, { useState, useRef, useEffect, ReactNode, createContext, useContext } from "react";
import { initializeSlideElement } from "@/utils/animations/slideAnimations";
import { animatePopTextOpen, animatePopTextClose } from "@/utils/animations/popTextAnimations";
import { setupFadeInAnimation } from "@/utils/animations/intersectionAnimations";
import { scrollElementToCenter } from "@/utils/animations/scrollAnimations";

// Create a context for toggle state
type ToggleContextType = {
  isToggled: boolean;
  toggle: () => void;
};

const ToggleContext = createContext<ToggleContextType>({
  isToggled: false,
  toggle: () => {},
});

// Hook to use the toggle context
export const useToggle = () => useContext(ToggleContext);

interface ExpandableSectionProps {
  headerContent: ReactNode;
  children: ReactNode;
  mobileHeadlineClickable?: boolean;
  defaultOpen?: boolean;
  isControlledOpen?: boolean;
  disableAutoScroll?: boolean;
  onMobileHeaderClick?: () => void;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  headerContent,
  children,
  mobileHeadlineClickable = true,
  defaultOpen = false,
  isControlledOpen,
  disableAutoScroll = false,
  onMobileHeaderClick
}) => {
  const [isContentVisible, setIsContentVisible] = useState(defaultOpen);
  const [isInitialized, setIsInitialized] = useState(false);
  const contentBoxRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);

  // Use controlled state if provided, otherwise use internal state
  const actualIsVisible = isControlledOpen !== undefined ? isControlledOpen : isContentVisible;

  // Initialize the element's hidden state on mount
  useEffect(() => {
    if (contentBoxRef.current) {
      initializeSlideElement(contentBoxRef.current);
    }
    setIsInitialized(true);
  }, []);

  // Set up intersection observer for section animation
  useEffect(() => {
    if (!sectionRef.current) return;
    
    const cleanup = setupFadeInAnimation(sectionRef.current);
    
    // Return cleanup function
    return cleanup;
  }, []);

  // Handle toggle button click
  const handleToggle = () => {
    // Only toggle internal state if not controlled externally
    if (isControlledOpen === undefined) {
      setIsContentVisible(!isContentVisible);
    }
  };

  // Handle content box animations
  useEffect(() => {
    if (!contentBoxRef.current || !contentInnerRef.current) return;
    
    if (actualIsVisible) {
      // Get the height of the content
      const contentHeight = contentInnerRef.current.offsetHeight;
      // Use the external animation function for opening
      animatePopTextOpen(contentBoxRef.current, contentHeight);
    } else {
      // Use the external animation function for closing
      animatePopTextClose(contentBoxRef.current);
    }
  }, [actualIsVisible]);

  // Handle header click for mobile
  const handleHeaderClick = () => {
    if (mobileHeadlineClickable && window.innerWidth < 768) {
      if (onMobileHeaderClick) {
        onMobileHeaderClick();
      } else {
        handleToggle();
      }
    }
  };

  // Create the toggle context value
  const toggleContextValue = {
    isToggled: actualIsVisible,
    toggle: handleToggle
  };

  return (
    <ToggleContext.Provider value={toggleContextValue}>
      <section className="mb-2" ref={sectionRef}>
        <div 
          className="flex gap-[2px]" 
          onClick={handleHeaderClick}
        >
          {headerContent}
        </div>

        <div 
          ref={contentBoxRef}
          className="bg-white rounded-r-2xl -ml-[100px] pl-[100px] md:w-full mt-2 mr-4 md:mr-2"
          style={{ 
            display: isInitialized ? 'block' : 'none', 
            height: 0,
            overflow: "hidden"
          }}
        >
          <div className="py-6 md:py-8 px-4 md:px-8" ref={contentInnerRef}>
            {children}
          </div>
        </div>
      </section>
    </ToggleContext.Provider>
  );
};

export default ExpandableSection; 