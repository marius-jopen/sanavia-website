import gsap from "gsap";

/**
 * Sets up an intersection observer that animates an element when it comes into view from the bottom
 * The animation repeats each time the element enters the viewport from the bottom
 */
export const setupFadeInAnimation = (element: HTMLElement | null) => {
  if (!element) return;
  
  let hasAnimated = false;

  // Function to check if element is in viewport
  const isElementVisible = () => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  // Set initial state and handle elements already in view
  const initializeElement = () => {
    const isVisible = isElementVisible();
    
    if (isVisible) {
      // If already visible, show it immediately without animation
      gsap.set(element, {
        y: 0,
        opacity: 1
      });
      hasAnimated = true;
    } else {
      // If not visible, set initial hidden state
      gsap.set(element, { 
        y: 30,
        opacity: 0
      });
    }
  };

  // Initialize immediately
  initializeElement();
  
  // Also check after a short delay to handle any layout shifts
  setTimeout(() => {
    if (!hasAnimated && isElementVisible()) {
      gsap.set(element, {
        y: 0,
        opacity: 1
      });
      hasAnimated = true;
    }
  }, 100);
  
  // Create observer with rootMargin that detects entries from both directions
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          // Animate when element comes into view from any direction
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
        
        // Reset when element is completely out of view (either direction)
        if (!entry.isIntersecting) {
          const rect = entry.boundingClientRect;
          const isCompletelyOutOfView = rect.bottom < 0 || rect.top > window.innerHeight;
          
          if (isCompletelyOutOfView && hasAnimated) {
            // Reset animation state when completely out of view
            hasAnimated = false;
            gsap.set(element, { 
              y: 30,
              opacity: 0
            });
          }
        }
      });
    },
    { 
      threshold: [0, 0.1], 
      rootMargin: "100px 0px 100px 0px" // Add margin to top and bottom of viewport
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
  let hasAnimated = false;

  // Function to check if element is in viewport
  const isElementVisible = () => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  // Set initial state and handle elements already in view
  const initializeElement = () => {
    const isVisible = isElementVisible();
    
    if (isVisible) {
      // If already visible, show items immediately without animation
      gsap.set(items, {
        y: 0,
        opacity: 1
      });
      hasAnimated = true;
    } else {
      // If not visible, set initial hidden state
      gsap.set(items, { 
        y: 100,
        opacity: 0
      });
    }
  };

  // Initialize immediately
  initializeElement();
  
  // Also check after a short delay to handle any layout shifts
  setTimeout(() => {
    if (!hasAnimated && isElementVisible()) {
      gsap.set(items, {
        y: 0,
        opacity: 1
      });
      hasAnimated = true;
    }
  }, 100);
  
  // Create observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          // Animate with stagger when element comes into view from any direction
          gsap.to(items, {
            duration: 0.6,
            y: 0,
            opacity: 1,
            stagger: 0.2,
            ease: "power2.out"
          });
          hasAnimated = true;
        }
        
        // Reset when element is completely out of view (either direction)
        if (!entry.isIntersecting) {
          const rect = entry.boundingClientRect;
          const isCompletelyOutOfView = rect.bottom < 0 || rect.top > window.innerHeight;
          
          if (isCompletelyOutOfView && hasAnimated) {
            // Reset animation state when completely out of view
            hasAnimated = false;
            gsap.set(items, { 
              y: 100,
              opacity: 0
            });
          }
        }
      });
    },
    { 
      threshold: [0, 0.1], 
      rootMargin: "100px 0px 100px 0px" // Add margin to top and bottom of viewport
    }
  );
  
  observer.observe(element);
  
  return () => {
    observer.disconnect();
  };
}; 