"use client"
import React, { useEffect, useRef, useState } from 'react';

const Background: React.FC = () => {
  // Use fixed initial state for server rendering
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [autoPosition, setAutoPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Check if we're running on client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Automatic animation only runs on client
  useEffect(() => {
    if (!isClient) return;
    
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      // Amplitude for visible movement
      const x = 18 * Math.sin(elapsed / 8000);
      const y = 18 * Math.cos(elapsed / 9000);
      
      setAutoPosition({ x, y });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isClient]);
  
  // Mouse movement handling
  useEffect(() => {
    if (!isClient) return;
    
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!backgroundRef.current) return;
      
      const { clientX, clientY } = e;
      const { width, height } = backgroundRef.current.getBoundingClientRect();
      
      // Normalize mouse position relative to the center
      targetX = ((clientX / width) - 0.5) * 25;
      targetY = ((clientY / height) - 0.5) * 25;
    };
    
    const updatePosition = () => {
      // Smoother easing
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      
      setMousePosition({ x: currentX, y: currentY });
      requestAnimationFrame(updatePosition);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    const animationId = requestAnimationFrame(updatePosition);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [isClient]);
  
  // Combined movement (auto + mouse)
  const transformX = autoPosition.x + mousePosition.x;
  const transformY = autoPosition.y + mousePosition.y;
  
  // Use inline styles for better control
  const gradientStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -10,
    overflow: 'hidden',
    background: '#f8f8fb', // Very light blue-gray background
  };
  
  // To avoid hydration mismatch, use consistent transform values
  const getTransform = (factor: number) => {
    return isClient 
      ? `translate3d(${transformX * factor}px, ${transformY * factor}px, 0)` 
      : 'translate3d(0, 0, 0)';
  };
  
  // Soft pink gradient
  const pinkGradientStyle = {
    position: 'absolute' as const,
    top: '-100%',
    left: '-100%',
    width: '300%',
    height: '300%',
    transform: getTransform(0.9),
    transition: 'transform 2.5s cubic-bezier(0.19, 1, 0.22, 1)',
    background: `
      radial-gradient(circle at 30% 40%, rgba(255, 233, 236, 0.85) 0%, rgba(255, 255, 255, 0) 60%)
    `,
    filter: 'blur(90px)',
    opacity: 1,
  };
  
  // Soft blue gradient
  const blueGradientStyle = {
    position: 'absolute' as const,
    top: '-100%',
    left: '-100%',
    width: '300%',
    height: '300%',
    transform: getTransform(0.7),
    transition: 'transform 3s cubic-bezier(0.19, 1, 0.22, 1)',
    background: `
      radial-gradient(circle at 70% 60%, rgba(232, 240, 255, 0.85) 0%, rgba(255, 255, 255, 0) 60%)
    `,
    filter: 'blur(90px)',
    opacity: 1,
  };
  
  // Soft pale yellow/cream gradient
  const creamGradientStyle = {
    position: 'absolute' as const,
    top: '-100%',
    left: '-100%',
    width: '300%',
    height: '300%',
    transform: getTransform(0.5),
    transition: 'transform 3.5s cubic-bezier(0.19, 1, 0.22, 1)',
    background: `
      radial-gradient(circle at 50% 50%, rgba(255, 244, 231, 0.85) 0%, rgba(255, 255, 255, 0) 65%)
    `,
    filter: 'blur(90px)',
    opacity: 1,
  };
  
  return (
    <div ref={backgroundRef} style={gradientStyle}>
      <div style={creamGradientStyle} />
      <div style={blueGradientStyle} />
      <div style={pinkGradientStyle} />
    </div>
  );
};

export default Background;
