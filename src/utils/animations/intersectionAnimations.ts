import gsap from "gsap";

/**
 * Sets up an intersection observer that animates an element when it comes into view from the bottom
 * The animation repeats each time the element enters the viewport from the bottom
 */
export const setupFadeInAnimation = (element: HTMLElement | null) => {
  if (!element) return;
  
  let hasAnimated = false;

  // Function to check and handle visibility
  const checkVisibility = () => {
    const rect = element.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isVisible && !hasAnimated) {
      // Set initial state only if not visible
      gsap.set(element, { 
        y: 30,
        opacity: 0
      });
      
      gsap.to(element, {
        duration: 0.6,
        y: 0,
        opacity: 1,
        ease: "power2.out"
      });
      hasAnimated = true;
    } else if (isVisible && hasAnimated) {
      // If already animated and visible, ensure it stays visible
      gsap.set(element, {
        y: 0,
        opacity: 1
      });
    }
  };

  // Check visibility immediately and after a short delay to handle any layout shifts
  checkVisibility();
  setTimeout(checkVisibility, 100);
  
  // Create observer with rootMargin that only detects bottom entries
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.boundingClientRect.top > 0 && !hasAnimated) {
          gsap.to(element, {
            duration: 0.6,
            y: 0,
            opacity: 1,
            ease: "power2.out"
          });
          hasAnimated = true;
        } else if (entry.isIntersecting && hasAnimated) {
          // If already animated and intersecting, ensure it stays visible
          gsap.set(element, {
            y: 0,
            opacity: 1
          });
        }
        
        // Only reset if we're scrolling down and the element is completely out of view
        if (!entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight && !hasAnimated) {
          gsap.set(element, { 
            y: 30,
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