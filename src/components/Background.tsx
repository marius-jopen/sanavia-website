"use client"
import React, { useEffect, useRef, useState } from 'react';

const Background: React.FC = () => {
  // Client-side only state - not used during initial render
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showIndicator, setShowIndicator] = useState(true);
  const [mounted, setMounted] = useState(false);
  // Add state for random initial positions
  const [initialOffsets, setInitialOffsets] = useState({
    gradient1: { x: 0, y: 0 },
    gradient2: { x: 0, y: 0 },
    gradient3: { x: 0, y: 0 },
  });
  const backgroundRef = useRef<HTMLDivElement>(null);
  
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
    background: '#f9f9fb',
    pointerEvents: 'none' as const,
  };
  
  // Gradient 1: Pink/Purple
  const gradient1BaseStyle = {
    position: 'absolute' as const,
    top: '0%',
    left: '0%',
    width: '120%', // Increased size to allow more movement space
    height: '120%', // Increased size to allow more movement space
    transform: 'translate3d(0, 0, 0)',
    transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth easing
    background: `
      radial-gradient(circle at 30% 40%, rgba(255, 105, 128, 0.85) 0%, rgba(188, 143, 250, 0.5) 35%, rgba(255, 255, 255, 0) 70%)
    `,
    filter: 'blur(60px)',
    opacity: 0.85,
    willChange: 'transform',
    mixBlendMode: 'normal' as const,
  };
  
  // Gradient 2: Cyan/Blue
  const gradient2BaseStyle = {
    position: 'absolute' as const,
    top: '0%',
    left: '0%',
    width: '120%', // Increased size
    height: '120%', // Increased size
    transform: 'translate3d(0, 0, 0)',
    transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth easing
    background: `
      radial-gradient(circle at 70% 60%, rgba(64, 224, 208, 0.85) 0%, rgba(100, 180, 255, 0.5) 35%, rgba(255, 255, 255, 0) 70%)
    `,
    filter: 'blur(60px)',
    opacity: 0.85,
    willChange: 'transform',
    mixBlendMode: 'normal' as const,
  };
  
  // Gradient 3: Yellow/Orange
  const gradient3BaseStyle = {
    position: 'absolute' as const,
    top: '0%',
    left: '0%',
    width: '120%', // Increased size
    height: '120%', // Increased size
    transform: 'translate3d(0, 0, 0)',
    transition: 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth easing
    background: `
      radial-gradient(circle at 50% 20%, rgba(255, 210, 100, 0.85) 0%, rgba(255, 140, 50, 0.5) 35%, rgba(255, 255, 255, 0) 70%)
    `,
    filter: 'blur(60px)',
    opacity: 0.85,
    willChange: 'transform',
    mixBlendMode: 'normal' as const,
  };
  
  // Indicator style
  const indicatorStyle = {
    position: 'fixed' as const,
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(255, 100, 100, 0.8)',
    border: '2px solid white',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none' as const,
    zIndex: 1000,
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
    transition: 'opacity 0.3s ease',
    opacity: showIndicator ? 1 : 0,
  };
  
  // Helper function to generate random offsets
  const generateRandomOffsets = () => {
    // Larger random values for more dramatic initial positions
    return {
      gradient1: {
        x: Math.random() * 300 - 150,
        y: Math.random() * 300 - 150
      },
      gradient2: {
        x: Math.random() * 300 - 150,
        y: Math.random() * 300 - 150
      },
      gradient3: {
        x: Math.random() * 300 - 150,
        y: Math.random() * 300 - 150
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
    let clientMouseX = window.innerWidth / 2;
    let clientMouseY = window.innerHeight / 2;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Store actual mouse position for indicator
      clientMouseX = e.clientX;
      clientMouseY = e.clientY;
      
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
        // Store actual touch position for indicator
        clientMouseX = e.touches[0].clientX;
        clientMouseY = e.touches[0].clientY;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        targetX = (e.touches[0].clientX / windowWidth) * 2 - 1;
        targetY = (e.touches[0].clientY / windowHeight) * 2 - 1;
      }
    };
    
    const updatePosition = () => {
      // Much smoother movement with lower easing factor
      currentX += (targetX - currentX) * 0.05; // Reduced from 0.2 for smoother flow
      currentY += (targetY - currentY) * 0.05; // Reduced from 0.2 for smoother flow
      
      setMousePosition({ 
        x: currentX,
        y: currentY 
      });
      
      // Move the indicator to the exact mouse position
      const indicator = document.getElementById('mouse-indicator');
      if (indicator) {
        indicator.style.left = `${clientMouseX}px`;
        indicator.style.top = `${clientMouseY}px`;
      }
      
      requestAnimationFrame(updatePosition);
    };
    
    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    const animationId = requestAnimationFrame(updatePosition);
    
    // Add subtle automatic movement even without mouse input
    let autoMoveX = 0;
    let autoMoveY = 0;
    let lastTimestamp = 0;
    
    const autoAnimate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Very slow, subtle drift when no mouse movement
      if (Math.abs(targetX) < 0.01 && Math.abs(targetY) < 0.01) {
        autoMoveX += Math.sin(timestamp / 5000) * 0.001 * delta;
        autoMoveY += Math.cos(timestamp / 7000) * 0.001 * delta;
        
        // Apply the auto movement if there's no significant mouse input
        setMousePosition(prev => ({
          x: prev.x + autoMoveX,
          y: prev.y + autoMoveY
        }));
      } else {
        // Reset auto movement when user moves mouse
        autoMoveX = 0;
        autoMoveY = 0;
      }
      
      requestAnimationFrame(autoAnimate);
    };
    
    const autoAnimationId = requestAnimationFrame(autoAnimate);
    
    // Key press to toggle indicator
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        setShowIndicator(prev => !prev);
      }
      
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
  
  // Dynamic styles with movements in different directions plus random offsets
  // Gradient 1 moves opposite to mouse X and with mouse Y
  const gradient1Transform = mounted 
    ? `translate3d(${-mousePosition.x * 200 + initialOffsets.gradient1.x}px, ${mousePosition.y * 180 + initialOffsets.gradient1.y}px, 0)` 
    : `translate3d(${initialOffsets.gradient1.x}px, ${initialOffsets.gradient1.y}px, 0)`;
    
  // Gradient 2 moves with mouse X and opposite to mouse Y
  const gradient2Transform = mounted 
    ? `translate3d(${mousePosition.x * 180 + initialOffsets.gradient2.x}px, ${-mousePosition.y * 220 + initialOffsets.gradient2.y}px, 0)` 
    : `translate3d(${initialOffsets.gradient2.x}px, ${initialOffsets.gradient2.y}px, 0)`;
    
  // Gradient 3 moves diagonally relative to mouse but in a slightly different angle
  const gradient3Transform = mounted 
    ? `translate3d(${mousePosition.x * 210 + initialOffsets.gradient3.x}px, ${mousePosition.y * 160 + initialOffsets.gradient3.y}px, 0)` 
    : `translate3d(${initialOffsets.gradient3.x}px, ${initialOffsets.gradient3.y}px, 0)`;
  
  return (
    <>
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
      {/* Mouse position indicator */}
      <div 
        id="mouse-indicator" 
        style={{
          ...indicatorStyle,
          left: `${window.innerWidth / 2}px`,
          top: `${window.innerHeight / 2}px`,
        }}
      />
    </>
  );
};

export default Background;
