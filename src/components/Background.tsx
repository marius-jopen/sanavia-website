"use client"
import React, { useEffect, useRef, useState } from 'react';

const Background: React.FC = () => {
  // Client-side only state - not used during initial render
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  // Add state for random initial positions
  const [initialOffsets, setInitialOffsets] = useState({
    gradient1: { x: 0, y: 0 },
    gradient2: { x: 0, y: 0 },
    gradient3: { x: 0, y: 0 },
  });
  const backgroundRef = useRef<HTMLDivElement>(null);
  
  // Add state for auto movement
  const [autoMovement, setAutoMovement] = useState({ x: 0, y: 0 });
  
  // Add state for random delays
  const [delays] = useState({
    gradient1: Math.random() * 2000,
    gradient2: Math.random() * 2000,
    gradient3: Math.random() * 2000
  });
  
  // Basic styles that will be the same on server and client
  const gradientStyle = {
    opacity: 0.3,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
    overflow: 'hidden',
    background: '#e5e5e7',
    pointerEvents: 'none' as const,
  };
  
  // Gradient 1: Pink/Purple
  const gradient1BaseStyle = {
    position: 'absolute' as const,
    top: '-10%', // Adjusted to be more centered
    left: '-10%', // Adjusted to be more centered
    width: '140%', // Increased from 120%
    height: '140%', // Increased from 120%
    transform: 'translate3d(0, 0, 0)',
    transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth easing
    background: `
      radial-gradient(circle at 50% 50%, rgba(255, 105, 128, 0.85) 0%, rgba(188, 143, 250, 0.5) 35%, rgba(255, 255, 255, 0) 70%)
    `,
    filter: 'blur(60px)',
    opacity: 0.85,
    willChange: 'transform',
    mixBlendMode: 'normal' as const,
  };
  
  // Gradient 2: Cyan/Blue
  const gradient2BaseStyle = {
    position: 'absolute' as const,
    top: '-10%', // Adjusted to be more centered
    left: '-10%', // Adjusted to be more centered
    width: '140%', // Increased from 120%
    height: '140%', // Increased from 120%
    transform: 'translate3d(0, 0, 0)',
    transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth easing
    background: `
      radial-gradient(circle at 50% 50%, rgba(64, 224, 208, 0.85) 0%, rgba(100, 180, 255, 0.5) 35%, rgba(255, 255, 255, 0) 70%)
    `,
    filter: 'blur(60px)',
    opacity: 0.85,
    willChange: 'transform',
    mixBlendMode: 'normal' as const,
  };
  
  // Gradient 3: Yellow/Orange
  const gradient3BaseStyle = {
    position: 'absolute' as const,
    top: '-10%', // Adjusted to be more centered
    left: '-10%', // Adjusted to be more centered
    width: '140%', // Increased from 120%
    height: '140%', // Increased from 120%
    transform: 'translate3d(0, 0, 0)',
    transition: 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth easing
    background: `
      radial-gradient(circle at 50% 50%, rgba(255, 210, 100, 0.85) 0%, rgba(255, 140, 50, 0.5) 35%, rgba(255, 255, 255, 0) 70%)
    `,
    filter: 'blur(60px)',
    opacity: 0.85,
    willChange: 'transform',
    mixBlendMode: 'normal' as const,
  };
  
  // Helper function to generate random offsets
  const generateRandomOffsets = () => {
    // Smaller random values to keep gradients more centered
    return {
      gradient1: {
        x: Math.random() * 200 - 100, // Reduced from 300-150
        y: Math.random() * 200 - 100  // Reduced from 300-150
      },
      gradient2: {
        x: Math.random() * 200 - 100, // Reduced from 300-150
        y: Math.random() * 200 - 100  // Reduced from 300-150
      },
      gradient3: {
        x: Math.random() * 200 - 100, // Reduced from 300-150
        y: Math.random() * 200 - 100  // Reduced from 300-150
      }
    };
  };
  
  // Only start effects after client-side mount
  useEffect(() => {
    setMounted(true);
    
    // Generate random initial positions when component mounts
    setInitialOffsets(generateRandomOffsets());
    
    // Set up mouse movement handler
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Use window dimensions
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calculate normalized position (-1 to 1 range)
      targetX = (e.clientX / windowWidth) * 2 - 1;
      targetY = (e.clientY / windowHeight) * 2 - 1;
    };
    
    // Handle touch events for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        targetX = (e.touches[0].clientX / windowWidth) * 2 - 1;
        targetY = (e.touches[0].clientY / windowHeight) * 2 - 1;
      }
    };
    
    const updatePosition = () => {
      // Faster movement with higher easing factor
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      
      setMousePosition({ 
        x: currentX,
        y: currentY 
      });
      
      requestAnimationFrame(updatePosition);
    };
    
    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    const animationId = requestAnimationFrame(updatePosition);
    
    // Enhanced automatic movement
    let autoMoveX = 0;
    let autoMoveY = 0;
    let lastTimestamp = 0;
    
    const autoAnimate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Continuous movement with different frequencies for each axis
      autoMoveX += Math.sin(timestamp / 3000) * 0.002 * delta;
      autoMoveY += Math.cos(timestamp / 4000) * 0.002 * delta;
      
      // Add some randomness to the movement
      if (Math.random() < 0.01) {
        autoMoveX += (Math.random() - 0.5) * 0.1;
        autoMoveY += (Math.random() - 0.5) * 0.1;
      }
      
      // Keep the movement within bounds
      autoMoveX = Math.max(Math.min(autoMoveX, 0.5), -0.5);
      autoMoveY = Math.max(Math.min(autoMoveY, 0.5), -0.5);
      
      setAutoMovement({ x: autoMoveX, y: autoMoveY });
      
      requestAnimationFrame(autoAnimate);
    };
    
    const autoAnimationId = requestAnimationFrame(autoAnimate);
    
    // Key press to regenerate random positions
    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'r' to regenerate random positions
      if (e.key === 'r' || e.key === 'R') {
        setInitialOffsets(generateRandomOffsets());
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    // Set initial position slightly off center
    setTimeout(() => {
      if (targetX === 0 && targetY === 0) {
        setMousePosition({ x: 0.1, y: 0.1 });
      }
    }, 500);
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyPress);
      cancelAnimationFrame(animationId);
      cancelAnimationFrame(autoAnimationId);
    };
  }, []);
  
  // Custom easing functions
  const easeOutElastic = (x: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  };

  const easeInOutBack = (x: number): number => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return x < 0.5
      ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
      : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
  };

  const easeInOutQuart = (x: number): number => {
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
  };

  // Apply easing to positions
  const getEasedPosition = (position: number, delay: number, easing: (x: number) => number) => {
    const timestamp = Date.now() + delay;
    const cycle = Math.sin(timestamp / 3000) * 0.5 + 0.5; // Convert to 0-1 range
    return position + easing(cycle) * 0.3; // Scale the effect
  };

  // Combine mouse position with auto movement and easing
  const combinedPosition = {
    x: mousePosition.x + autoMovement.x,
    y: mousePosition.y + autoMovement.y
  };

  // Apply different easing effects to each gradient
  const gradient1Position = {
    x: getEasedPosition(combinedPosition.x, delays.gradient1, easeOutElastic),
    y: getEasedPosition(combinedPosition.y, delays.gradient1, easeOutElastic)
  };

  const gradient2Position = {
    x: getEasedPosition(combinedPosition.x, delays.gradient2, easeInOutBack),
    y: getEasedPosition(combinedPosition.y, delays.gradient2, easeInOutBack)
  };

  const gradient3Position = {
    x: getEasedPosition(combinedPosition.x, delays.gradient3, easeInOutQuart),
    y: getEasedPosition(combinedPosition.y, delays.gradient3, easeInOutQuart)
  };

  // Gradient 1 moves opposite to mouse X and with mouse Y
  const gradient1Transform = mounted 
    ? `translate3d(${-gradient1Position.x * 800 + initialOffsets.gradient1.x}px, ${gradient1Position.y * 720 + initialOffsets.gradient1.y}px, 0)` 
    : `translate3d(${initialOffsets.gradient1.x}px, ${initialOffsets.gradient1.y}px, 0)`;
    
  // Gradient 2 moves with mouse X and opposite to mouse Y
  const gradient2Transform = mounted 
    ? `translate3d(${gradient2Position.x * 720 + initialOffsets.gradient2.x}px, ${-gradient2Position.y * 880 + initialOffsets.gradient2.y}px, 0)` 
    : `translate3d(${initialOffsets.gradient2.x}px, ${initialOffsets.gradient2.y}px, 0)`;
    
  // Gradient 3 moves diagonally relative to mouse but in a slightly different angle
  const gradient3Transform = mounted 
    ? `translate3d(${gradient3Position.x * 840 + initialOffsets.gradient3.x}px, ${gradient3Position.y * 640 + initialOffsets.gradient3.y}px, 0)` 
    : `translate3d(${initialOffsets.gradient3.x}px, ${initialOffsets.gradient3.y}px, 0)`;
  
  return (
    <div ref={backgroundRef} style={gradientStyle}>
      {/* Order matters for overlapping - bottom layer first */}
      <div 
        key="gradient3"
        style={{
          ...gradient3BaseStyle,
          transform: gradient3Transform
        }} 
      />
      <div 
        key="gradient2"
        style={{
          ...gradient2BaseStyle,
          transform: gradient2Transform
        }} 
      />
      <div 
        key="gradient1"
        style={{
          ...gradient1BaseStyle,
          transform: gradient1Transform
        }} 
      />
    </div>
  );
};

export default Background;
