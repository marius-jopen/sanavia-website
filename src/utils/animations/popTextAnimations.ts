import gsap from "gsap";
import { slideIn, slideOut } from "./slideAnimations";

/**
 * Animates the content box opening with smooth height transition followed by slide
 */
export const animatePopTextOpen = (
  textBox: HTMLElement | null, 
  contentHeight: number
) => {
  if (!textBox) return;
  
  // First animate the height to push down content below
  gsap.to(textBox, {
    duration: 0.2,
    height: contentHeight,
    ease: "power2.out",
    onComplete: () => {
      // Then slide in the content
      slideIn(textBox);
    }
  });
};

/**
 * Animates the content box closing with slide out first, then height transition
 */
export const animatePopTextClose = (
  textBox: HTMLElement | null
) => {
  if (!textBox) return;

  // Get current computed height before doing anything
  const currentHeight = textBox.offsetHeight;
  
  // First slide out the content
  slideOut(textBox, () => {
    // Instead of letting slideOut set height to 0 immediately,
    // we'll set a specific height and then animate it
    gsap.set(textBox, {
      height: currentHeight, // Set explicit height
      autoAlpha: 0,          // Keep invisible
      clearProps: "x,opacity" // Clear slideOut properties
    });
    
    // Then animate height to push content up smoothly
    gsap.to(textBox, {
      duration: 0.2,
      height: 0,
      ease: "power2.in"
    });
  });
}; 