import gsap from "gsap";

/**
 * Sets up and initializes the element for slide animations
 */
export const initializeSlideElement = (element: HTMLElement | null) => {
  if (!element) return;
  
  gsap.set(element, { 
    autoAlpha: 0,
    height: 0,
    overflow: "hidden",
    x: -300
  });
};

/**
 * Animates an element sliding in from the left
 */
export const slideIn = (element: HTMLElement | null) => {
  if (!element) return;

  // Reset visibility before animation starts
  gsap.set(element, { 
    autoAlpha: 1, 
    height: "auto",
    overflow: "visible",
  });
  
  // Slide in from left with bounce effect
  gsap.fromTo(element, 
    { x: -300, opacity: 0 },
    { 
      duration: 0.3, 
      x: 0, 
      opacity: 1,
      ease: "back.out(1.7)", // This creates the bounce effect
      clearProps: "x" // Clear transform after animation
    }
  );
};

/**
 * Animates an element sliding out to the left
 */
export const slideOut = (element: HTMLElement | null, onCompleteCallback?: () => void) => {
  if (!element) return;

  // Simple slide out to left animation
  gsap.to(element, {
    duration: 0.3,
    x: -300,
    opacity: 0,
    ease: "back.in(1.7)",
    onComplete: () => {
      gsap.set(element, { 
        autoAlpha: 0,
        height: 0,
        overflow: "hidden"
      });
      
      if (onCompleteCallback) {
        onCompleteCallback();
      }
    }
  });
}; 