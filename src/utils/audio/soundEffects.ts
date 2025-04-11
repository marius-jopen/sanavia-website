/**
 * Plays the pop sound effect
 */
export const playPopSound = () => {
  // Create a new audio instance each time to allow overlapping sounds
  const audio = new Audio('/pop-sound.mp3');
  
  // Play the sound and handle any errors silently
  try {
    // Set volume to a pleasant level
    audio.volume = 0.5;
    
    // Play the sound
    audio.play().catch(err => {
      // Silently handle autoplay policy issues
      console.log('Error playing sound:', err);
    });
  } catch (err) {
    // Fallback for older browsers or other issues
    console.log('Error initializing sound:', err);
  }
}; 