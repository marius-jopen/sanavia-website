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
    y = 100,
    ease = "power2.out",
    threshold = [0, 0.1],
    rootMargin = "0px 0px 100px 0px"
  } = options;

  const items = element.children;
  
  // Set initial state
  gsap.set(items, { 
    y,
    opacity: 0
  });
  
  // Create observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.boundingClientRect.top > 0) {
          // Animate with stagger
          gsap.to(items, {
            duration,
            y: 0,
            opacity: 1,
            stagger,
            ease
          });
        }
        
        if (!entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight) {
          // Reset for next entry
          gsap.set(items, { 
            y,
            opacity: 0
          });
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