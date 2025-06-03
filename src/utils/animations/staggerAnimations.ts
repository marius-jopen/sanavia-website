import gsap from "gsap";

interface StaggerAnimationOptions {
  duration?: number;
  stagger?: number;
  y?: number;
  ease?: string;
  threshold?: number[];
  rootMargin?: string;
}

/**
 * Sets up an intersection observer that animates child elements with a stagger effect
 * when the parent element comes into view
 */
export const setupStaggeredAnimation = (
  element: HTMLElement | null,
  options: StaggerAnimationOptions = {}
) => {
  if (!element) return;

  const {
    duration = 0.6,
    stagger = 0.2,
    y = 30,
    ease = "power2.out",
    threshold = [0, 0.1],
    rootMargin = "100px 0px 100px 0px"
  } = options;

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
        y,
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
            duration,
            y: 0,
            opacity: 1,
            stagger,
            ease
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
              y,
              opacity: 0
            });
          }
        }
      });
    },
    { 
      threshold,
      rootMargin
    }
  );
  
  observer.observe(element);
  
  return () => {
    observer.disconnect();
  };
};

/**
 * Creates a staggered animation for a list of elements
 * @param elements Array of elements to animate
 * @param options Animation options
 */
export const staggerElements = (
  elements: HTMLElement[],
  options: StaggerAnimationOptions = {}
) => {
  const {
    duration = 0.6,
    stagger = 0.2,
    y = 100,
    ease = "power2.out"
  } = options;

  // Set initial state
  gsap.set(elements, { 
    y,
    opacity: 0
  });

  // Animate with stagger
  return gsap.to(elements, {
    duration,
    y: 0,
    opacity: 1,
    stagger,
    ease
  });
}; 