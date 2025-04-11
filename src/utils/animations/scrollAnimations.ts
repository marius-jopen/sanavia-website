/**
 * Scrolls an element to a position higher than the vertical center of the viewport
 */
export const scrollElementToCenter = (element: HTMLElement | null) => {
  if (!element) return;
  
  const elementPosition = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  
  // Calculate the target scroll position:
  // Positioning at 1/3 of the viewport height instead of 1/2 (center)
  // This places the element higher in the viewport
  const scrollToY = 
    window.scrollY + 
    elementPosition.top - 
    (viewportHeight / 3) + 
    (elementPosition.height / 2);
  
  // Scroll smoothly to the calculated position
  window.scrollTo({
    top: scrollToY,
    behavior: 'smooth'
  });
}; 