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
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  headerContent,
  children
}) => {
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const contentBoxRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);

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
    setIsContentVisible(!isContentVisible);
  };

  // Handle content box animations
  useEffect(() => {
    if (!contentBoxRef.current || !contentInnerRef.current) return;
    
    if (isContentVisible) {
      // Get the height of the content
      const contentHeight = contentInnerRef.current.offsetHeight;
      // Use the external animation function for opening
      animatePopTextOpen(contentBoxRef.current, contentHeight);
      
      // Scroll the section to the center of the viewport
      scrollElementToCenter(sectionRef.current);
    } else {
      // Use the external animation function for closing
      animatePopTextClose(contentBoxRef.current);
    }
  }, [isContentVisible]);

  // Create the toggle context value
  const toggleContextValue = {
    isToggled: isContentVisible,
    toggle: handleToggle
  };

  return (
    <ToggleContext.Provider value={toggleContextValue}>
      <section className="mb-12" ref={sectionRef}>
        <div className="flex">
          {headerContent}
        </div>

        <div 
          ref={contentBoxRef}
          className="bg-white rounded-r-4xl -ml-[100px] pl-[100px] w-10/12 border border-[var(--color-border)]"
          style={{ 
            display: isInitialized ? 'block' : 'none', 
            height: 0,
            overflow: "hidden"
          }}
        >
          <div className="py-6 px-4" ref={contentInnerRef}>
            {children}
          </div>
        </div>
      </section>
    </ToggleContext.Provider>
  );
};

export default ExpandableSection; 