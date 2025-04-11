import gsap from "gsap";

/**
 * Sets up an intersection observer that animates an element when it comes into view
 * The animation repeats each time the element enters the viewport
 */
export const setupFadeInAnimation = (element: HTMLElement | null) => {
  if (!element) return;
  
  const animateElement = () => {
    // Reset to initial state
    gsap.set(element, { 
      y: 50, 
      autoAlpha: 0 
    });
    
    // Animate in
    gsap.to(element, {
      duration: 0.8,
      y: 0,
      autoAlpha: 1,
      ease: "power2.out"
    });
  };
  
  // Set initial state
  gsap.set(element, { 
    y: 50, 
    autoAlpha: 0 
  });
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Animate element when it comes into view
          animateElement();
        } else {
          // Reset when out of view for next animation
          gsap.set(element, { 
            y: 50, 
            autoAlpha: 0 
          });
        }
      });
    },
    { threshold: 0.1 } // Trigger when 10% of the element is visible
  );
  
  observer.observe(element);
  
  // Return cleanup function
  return () => {
    observer.unobserve(element);
  };
}; 