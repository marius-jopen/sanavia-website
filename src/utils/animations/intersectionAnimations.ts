import gsap from "gsap";

/**
 * Sets up an intersection observer that animates an element when it comes into view from the bottom
 * The animation repeats each time the element enters the viewport from the bottom
 */
export const setupFadeInAnimation = (element: HTMLElement | null) => {
  if (!element) return;
  
  // Set initial state
  gsap.set(element, { 
    y: 30,
    opacity: 0
  });
  
  // Create observer with rootMargin that only detects bottom entries
  const observer = new IntersectionObserver(
    (entries) => {
      // Scroll direction tracking code removed to fix linting errors
      // This was previously used to detect scroll direction
      
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.boundingClientRect.top > 0) {
          // Only animate when entering from bottom (positive top value)
          gsap.to(element, {
            duration: 0.6,
            y: 0,
            opacity: 1,
            ease: "power2.out"
          });
        } 
        
        // When element is fully out of view below the viewport
        if (!entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight) {
          // Reset for next entry
          gsap.set(element, { 
            y: 100,
            opacity: 0
          });
        }
      });
    },
    { 
      threshold: [0, 0.1], 
      rootMargin: "0px 0px 100px 0px" // Add margin to bottom of viewport
    }
  );
  
  observer.observe(element);
  
  // Return cleanup function
  return () => {
    observer.unobserve(element);
  };
};

/**
 * Sets up an intersection observer that animates child elements with a stagger effect
 * when the parent element comes into view from the bottom
 */
export const setupStaggeredFadeInAnimation = (element: HTMLElement | null) => {
  if (!element) return;
  
  const items = element.children;
  
  // Set initial state
  gsap.set(items, { 
    y: 100,
    opacity: 0
  });
  
  // Create observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.boundingClientRect.top > 0) {
          // Animate with stagger
          gsap.to(items, {
            duration: 0.6,
            y: 0,
            opacity: 1,
            stagger: 0.2,
            ease: "power2.out"
          });
        }
        
        if (!entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight) {
          // Reset for next entry
          gsap.set(items, { 
            y: 100,
            opacity: 0
          });
        }
      });
    },
    { 
      threshold: [0, 0.1], 
      rootMargin: "0px 0px 100px 0px"
    }
  );
  
  observer.observe(element);
  
  return () => {
    observer.disconnect();
  };
}; 