"use client";
import { FC, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import Matter from 'matter-js';

// ============= CIRCLE COLORS CONFIGURATION =============
// Easily customize the appearance of circles in different states
const CIRCLE_COLORS = {
  // State 1: Unfilled/Empty circles
  STATE_1_OUTLINE: 'white',
  STATE_1_FILL: 'transparent',
  
  // State 2: Filled circles  
  STATE_2_OUTLINE: 'white',
  STATE_2_FILL: 'white'
} as const;

/**
 * Props for `Grid`.
 */
export type GridProps = SliceComponentProps<Content.GridSlice> & {
  settings?: {
    grid_problem?: string | null;
    grid_solution?: string | null;
  };
};

/**
 * Circle type for physics simulation
 */
type PhysicsCircle = {
  body: Matter.Body;
  originalPosition: { x: number; y: number };
  color: string;
  index: number;
  isFilled: boolean;
  isInitiallyFilled: boolean;
  isUserFilled: boolean;
  rippleScale: number;
  isClickedCircle: boolean;
  clickAnimationStart: number;
};

/**
 * Ripple effect type
 */
type RippleEffect = {
  id: string;
  centerX: number;
  centerY: number;
  startTime: number;
  duration: number;
};

/**
 * Confetti particle type with emojicons
 */
type ConfettiParticle = {
  id: string;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  life: number;
  maxLife: number;
};



/**
 * Component for "Grid" Slices.
 */
const Grid: FC<GridProps> = ({ slice, settings }) => {
  // Configuration variables - modify these to control the grid
  const CONFIG = useMemo(() => ({
    // Breakpoints
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024,
    
    // Number of columns in the grid
    COLUMNS: {
      DESKTOP: 15,
      TABLET: 12,
      MOBILE: 8
    },
    
    // Aspect ratio (width:height)
    ASPECT_RATIO: {
      // Desktop: 16:9 is widescreen
      DESKTOP: {
        WIDTH: 16,
        HEIGHT: 6
      },
      // Tablet: 16:9 is intermediate
      TABLET: {
        WIDTH: 16,
        HEIGHT: 6
      },
      // Mobile: 9:5 is portrait
      MOBILE: {
        WIDTH: 9,
        HEIGHT: 5
      }
    },
    
    // Spacing between circles in pixels
    SPACING: 10,
    
    // Circle colors - now using the configurable variables
    COLORS: {
      STATE_1_FILL: CIRCLE_COLORS.STATE_1_FILL,
      STATE_1_OUTLINE: CIRCLE_COLORS.STATE_1_OUTLINE,
      STATE_2_FILL: CIRCLE_COLORS.STATE_2_FILL,
      STATE_2_OUTLINE: CIRCLE_COLORS.STATE_2_OUTLINE
    },
    
    // Circle fill behavior
    FILL_OUTLINED_CIRCLES: true, // Set to false to make outlined circles transparent
    
    // Progress percentages
    INITIAL_FILLED_PERCENTAGE: 20,
    SOLUTION_FILLED_PERCENTAGE: 80,
    MAX_FILLED_PERCENTAGE: 100,
    
    // Animation settings
    FILL_ANIMATION_DURATION: 1500, // 1.5 seconds
    
    // Ripple animation configuration
    RIPPLE: {
      // Maximum ripple effect radius in pixels
      MAX_RADIUS: 1000,
      
      // Ripple animation duration in milliseconds
      DURATION: 4500,
      
      // Maximum scale effect (how much circles can grow)
      MAX_SCALE: 1.4,
      
      // Ripple speed (how fast it spreads)
      SPEED: 0.3,
      
      // Wave width for smoother effect
      WAVE_WIDTH: 120
    },
    
    // Interaction settings
    INTERACTION: {
      // Enable/disable interactive dot filling
      ENABLE_INTERACTIVE_FILLING: false, // Set to true to allow users to click and fill dots
      
      // Click/tap detection radius
      CLICK_RADIUS: {
        DESKTOP: 50,
        TABLET: 55,
        MOBILE: 60
      }
    },
    
    // Vertical padding (in pixels) to add at top and bottom of canvas
    VERTICAL_PADDING: 20,
    
    // Confetti configuration for celebration
    CONFETTI: {
      // Emojicons for celebration (fewer for better performance)
      EMOJIS: ['🎉', '🎊', '✨', '🌟', '💫', '🎈', '🥳', '🎁', '🌈', '⭐'],
      
      // Number of particles (fewer emojicons)
      PARTICLE_COUNT: 60,
      
      // Animation duration (faster - 5 seconds)
      DURATION: 5000,
      
      // Physics for outward explosion (faster)
      GRAVITY: 0.12,
      FRICTION: 0.992,
      
      // Explosion velocities (faster speeds)
      VELOCITY_RANGE: {
        MIN_SPEED: 5,
        MAX_SPEED: 18
      },
      
      // Rotation and scale
      ROTATION_SPEED_RANGE: [-0.2, 0.2],
      SCALE_RANGE: [0.8, 1.6]
    }
  }), []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const circlesRef = useRef<PhysicsCircle[]>([]);
  const isInitializedRef = useRef<boolean>(false);
  const toggleRef = useRef<boolean>(false);
  const activeRipplesRef = useRef<RippleEffect[]>([]);
  const confettiParticlesRef = useRef<ConfettiParticle[]>([]);
  
  // This state is only for forcing UI updates, not for physics
  const [toggleState, setToggleState] = useState(false);
  const [randomizedIndices, setRandomizedIndices] = useState<number[]>([]);
  const [gridDimensions, setGridDimensions] = useState({ 
    rows: 0, 
    columns: 0, 
    totalCircles: 0 
  });

  const [activeRipples, setActiveRipples] = useState<RippleEffect[]>([]);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const [isVictoryLocked, setIsVictoryLocked] = useState(false);

  // Add state for client-side hydration
  const [isMounted, setIsMounted] = useState(false);

  // Check device type based on window width
  const getDeviceType = useCallback((): 'mobile' | 'tablet' | 'desktop' => {
    if (!isMounted || typeof window === 'undefined') {
      return 'desktop'; // Default for SSR
    }
    const width = window.innerWidth;
    if (width < CONFIG.MOBILE_BREAKPOINT) return 'mobile';
    if (width < CONFIG.TABLET_BREAKPOINT) return 'tablet';
    return 'desktop';
    }, [CONFIG.MOBILE_BREAKPOINT, CONFIG.TABLET_BREAKPOINT, isMounted]);

  // Create confetti explosion from center outward
  const createConfetti = useCallback(() => {
    if (!canvasRef.current || hasShownConfetti || !isMounted) return;
    
    const canvas = canvasRef.current;
    const particles: ConfettiParticle[] = [];
    
    // Get canvas center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Create particles exploding outward from center
    for (let i = 0; i < CONFIG.CONFETTI.PARTICLE_COUNT; i++) {
      // Random emoji
      const emoji = CONFIG.CONFETTI.EMOJIS[Math.floor(Math.random() * CONFIG.CONFETTI.EMOJIS.length)];
      
      // Start at center with small random offset
      const x = centerX + (Math.random() - 0.5) * 20;
      const y = centerY + (Math.random() - 0.5) * 20;
      
      // Random angle for explosion direction
      const angle = Math.random() * 6.28318; // 2π
      
      // Random speed for explosion
      const speed = CONFIG.CONFETTI.VELOCITY_RANGE.MIN_SPEED + 
                    Math.random() * (CONFIG.CONFETTI.VELOCITY_RANGE.MAX_SPEED - CONFIG.CONFETTI.VELOCITY_RANGE.MIN_SPEED);
      
      // Calculate velocity components
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      // Random properties
      const rotation = Math.random() * 6.28318;
      const rotationSpeed = CONFIG.CONFETTI.ROTATION_SPEED_RANGE[0] + 
                           Math.random() * (CONFIG.CONFETTI.ROTATION_SPEED_RANGE[1] - CONFIG.CONFETTI.ROTATION_SPEED_RANGE[0]);
      const scale = CONFIG.CONFETTI.SCALE_RANGE[0] + 
                    Math.random() * (CONFIG.CONFETTI.SCALE_RANGE[1] - CONFIG.CONFETTI.SCALE_RANGE[0]);
      
      particles.push({
        id: `confetti-${i}-${Date.now()}`,
        emoji,
        x,
        y,
        vx,
        vy,
        rotation,
        rotationSpeed,
        scale,
        life: CONFIG.CONFETTI.DURATION,
        maxLife: CONFIG.CONFETTI.DURATION
      });
    }
    
    confettiParticlesRef.current = particles;
    setHasShownConfetti(true);
    
    // Clear confetti after duration - BUT NEVER RESET VICTORY STATE
    setTimeout(() => {
      confettiParticlesRef.current = [];
      // DON'T reset hasShownConfetti or victory state - keep dots filled forever
    }, CONFIG.CONFETTI.DURATION);
  }, [CONFIG, hasShownConfetti, isMounted]);

  // Generate initial random order of indices (only once)
  const initializeRandomIndices = useCallback((totalCircles: number) => {
    // Only initialize if not already done or if total changes
    if (randomizedIndices.length !== totalCircles) {
      // Create array of all possible indices
      const allIndices = Array.from({ length: totalCircles }, (_, i) => i);
      
      // Shuffle array (once)
      for (let i = allIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
      }
      
      setRandomizedIndices(allIndices);
      return allIndices;
    }
    
    return randomizedIndices;
  }, [randomizedIndices]);

  // Get the set of filled indices based on toggle state or interaction
  const getFilledIndices = useCallback((indices: number[], totalCircles: number, isToggleMode: boolean = false) => {
    if (isToggleMode) {
      // Toggle mode: use predefined percentages
      const percentage = toggleRef.current ? CONFIG.SOLUTION_FILLED_PERCENTAGE : CONFIG.INITIAL_FILLED_PERCENTAGE;
      const count = Math.floor(totalCircles * (percentage / 100));
      return new Set(indices.slice(0, count));
    } else {
      // Interactive mode: use current circle states
      return new Set(circlesRef.current.filter(circle => circle.isFilled).map(circle => circle.index));
    }
  }, [CONFIG.INITIAL_FILLED_PERCENTAGE, CONFIG.SOLUTION_FILLED_PERCENTAGE]);

  // Handle click/tap interaction
  const handleCanvasInteraction = useCallback((event: MouseEvent | TouchEvent) => {
    if (!canvasRef.current || isVictoryLocked) return; // No interaction once victory is locked
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get interaction coordinates
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Find closest circle within click radius
    const currentDeviceType = getDeviceType();
    const clickRadius = CONFIG.INTERACTION.CLICK_RADIUS[currentDeviceType.toUpperCase() as keyof typeof CONFIG.INTERACTION.CLICK_RADIUS];
    
    let closestCircle: PhysicsCircle | null = null;
    let closestDistance = Infinity;
    
    for (const circle of circlesRef.current) {
      const dx = circle.body.position.x - x;
      const dy = circle.body.position.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If filling is enabled, only detect unfilled circles; otherwise detect all circles for ripple effect
      const canInteract = CONFIG.INTERACTION.ENABLE_INTERACTIVE_FILLING ? !circle.isFilled : true;
      
      if (distance < clickRadius && distance < closestDistance && canInteract) {
        closestDistance = distance;
        closestCircle = circle;
      }
    }
    
                  // Handle closest circle interaction if found
    if (closestCircle) {
      // Always set click animation properties for ripple effect
      closestCircle.isClickedCircle = true;
      closestCircle.clickAnimationStart = Date.now();
      
      // Only fill the circle if interactive filling is enabled
      if (CONFIG.INTERACTION.ENABLE_INTERACTIVE_FILLING) {
        closestCircle.isFilled = true;
        closestCircle.isUserFilled = true;
        
        // Update progress
        const filledCount = circlesRef.current.filter(c => c.isFilled).length;
        const newProgress = Math.min(
          (filledCount / circlesRef.current.length) * 100,
          CONFIG.MAX_FILLED_PERCENTAGE
        );
        
        // Trigger confetti when reaching 100% and lock the progress PERMANENTLY
        if (newProgress >= 100 && !isVictoryLocked) {
          // PERMANENT VICTORY LOCK - dots stay filled until page reload
          setIsVictoryLocked(true);
          
          // Lock all circles as filled permanently
          for (const circle of circlesRef.current) {
            circle.isFilled = true;
            circle.isUserFilled = true;
          }
          
          if (!hasShownConfetti) {
            createConfetti();
          }
        }
      }
      
      // Always create ripple effect regardless of filling setting
      const rippleId = `ripple-${Date.now()}-${Math.random()}`;
      const newRipple: RippleEffect = {
        id: rippleId,
        centerX: closestCircle.body.position.x,
        centerY: closestCircle.body.position.y,
        startTime: Date.now(),
        duration: CONFIG.RIPPLE.DURATION
      };
      
      setActiveRipples(prev => {
        const newRipples = [...prev, newRipple];
        activeRipplesRef.current = newRipples;
        return newRipples;
      });
      
      // Remove ripple after duration
      setTimeout(() => {
        setActiveRipples(prev => {
          const filteredRipples = prev.filter(r => r.id !== rippleId);
          activeRipplesRef.current = filteredRipples;
          return filteredRipples;
        });
      }, CONFIG.RIPPLE.DURATION);
      
      // Reset click animation after duration
      setTimeout(() => {
        closestCircle.isClickedCircle = false;
      }, CONFIG.RIPPLE.DURATION);
    
    }
  }, [CONFIG, getDeviceType, hasShownConfetti, createConfetti, isVictoryLocked]);

  // Setup physics world with matter.js
  const setupPhysics = useCallback((
    canvas: HTMLCanvasElement,
    rows: number,
    columns: number,
    spacing: number,
    circleSize: number,
    filledIndicesSet: Set<number>,
    gridTopOffset: number
  ) => {
    // Clean up existing engine if it exists
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
      circlesRef.current = [];
    }
    
    // Initialize physics engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 } // No gravity
    });
    engineRef.current = engine;
    
    // Create circles as physics bodies
    const circles: PhysicsCircle[] = [];
    const totalWidth = canvas.width;
    const columnWidth = totalWidth / columns;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        
        // Calculate center position - adjust y position to account for top padding
        const x = (col * columnWidth) + (columnWidth / 2);
        const y = gridTopOffset + spacing + row * (circleSize + spacing) + circleSize / 2;
        
        // Create a circular body (static for no physics movement)
        const body = Matter.Bodies.circle(x, y, circleSize / 2, {
          isStatic: true,
          friction: 0,
          restitution: 0,
          frictionAir: 0
        });
        
        // Determine if initially filled - BUT RESPECT VICTORY LOCK
        let isInitiallyFilled = filledIndicesSet.has(index);
        let isUserFilledState = false;
        
        // VICTORY LOCK: If victory is locked, ALL circles should be filled
        if (isVictoryLocked) {
          isInitiallyFilled = true;
          isUserFilledState = true;
        }
        
        // Store circles with their original positions and ripple properties
        circles.push({
          body,
          originalPosition: { x, y },
          color: isInitiallyFilled ? CONFIG.COLORS.STATE_2_FILL : CONFIG.COLORS.STATE_1_FILL,
          index,
          isFilled: isInitiallyFilled,
          isInitiallyFilled,
          isUserFilled: isUserFilledState,
          rippleScale: 1,
          isClickedCircle: false,
          clickAnimationStart: 0
        });
        
        // Add body to the world
        Matter.Composite.add(engine.world, body);
      }
    }
    
    circlesRef.current = circles;
    isInitializedRef.current = true;
    
    return engine;
  }, [CONFIG, isVictoryLocked]);
  
    // Handle toggle button click - just update the ref and force UI update
  const handleToggle = useCallback(() => {
    // VICTORY LOCK: Once 100% is reached, NEVER allow any reset until page reload
    if (isVictoryLocked) {
      return;
    }
    
    // Update our ref first (this is what physics will use)
    toggleRef.current = !toggleRef.current;
    
    // Only force a UI update
    setToggleState(toggleRef.current);
    
    // Reset all user interactions and set predetermined states
    if (isInitializedRef.current && circlesRef.current.length > 0) {
      const { totalCircles } = gridDimensions;
      const indices = randomizedIndices.length === totalCircles 
        ? randomizedIndices 
        : initializeRandomIndices(totalCircles);
      
      const filledIndicesSet = getFilledIndices(indices, totalCircles, true);
      
      // Update all circles to match toggle state (BUT NEVER if victory is locked)
      for (const circle of circlesRef.current) {
        const shouldBeFilled = filledIndicesSet.has(circle.index);
        
        // VICTORY LOCK: Never change filled state once victory is achieved
        if (!isVictoryLocked) {
          circle.isFilled = shouldBeFilled;
          circle.isInitiallyFilled = shouldBeFilled;
          circle.isUserFilled = false;
          circle.color = shouldBeFilled ? CONFIG.COLORS.STATE_2_FILL : CONFIG.COLORS.STATE_1_FILL;
        }
        
        circle.isClickedCircle = false;
        circle.clickAnimationStart = 0;
      }
      
      // Update progress to match toggle state (BUT NEVER if victory is locked)
      let newProgress = 100; // Default to 100 if victory is locked
      if (!isVictoryLocked) {
        newProgress = toggleRef.current ? CONFIG.SOLUTION_FILLED_PERCENTAGE : CONFIG.INITIAL_FILLED_PERCENTAGE;
        
        // Reset confetti state (only if not in victory mode)
        setHasShownConfetti(false);
        confettiParticlesRef.current = [];
        
        // Trigger confetti if toggle shows solution (100%)
        if (newProgress >= 100) {
          setTimeout(() => createConfetti(), 100);
        }
      }
    }
     }, [gridDimensions, randomizedIndices, initializeRandomIndices, getFilledIndices, CONFIG, createConfetti, isVictoryLocked]);

  // Animation loop for physics simulation with ripple effects
  const animatePhysics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current || !isInitializedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update physics engine
    Matter.Engine.update(engineRef.current, 1000 / 60);
    
    // Update confetti particles (performant in-place updates)
    if (confettiParticlesRef.current.length > 0) {
      const deltaTime = 1000 / 60;
      const gravity = CONFIG.CONFETTI.GRAVITY;
      const friction = CONFIG.CONFETTI.FRICTION;
      
      for (let i = confettiParticlesRef.current.length - 1; i >= 0; i--) {
        const particle = confettiParticlesRef.current[i];
        
        // Update physics
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= friction;
        particle.vy += gravity;
        particle.rotation += particle.rotationSpeed;
        particle.life -= deltaTime;
        
        // Remove dead or out-of-bounds particles
        if (particle.life <= 0 || 
            particle.x < -600 || particle.x > canvas.width + 600 ||
            particle.y < -600 || particle.y > canvas.height + 600) {
          confettiParticlesRef.current.splice(i, 1);
        }
      }
    }
    
    // Update circles with ripple effects
    const circles = circlesRef.current;
    const currentTime = Date.now();
    
    for (const circle of circles) {
      // Calculate ripple scale based on active ripples
      let rippleScale = 1;
      
              // Special animation for clicked circle
        if (circle.isClickedCircle) {
          const elapsed = currentTime - circle.clickAnimationStart;
          const progress = Math.min(elapsed / CONFIG.RIPPLE.DURATION, 1);
          
          if (progress >= 0 && progress <= 1) {
            // Easing function for click animation (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 2);
            
            // Create a very subtle pulsing effect
            const pulseIntensity = Math.sin(progress * Math.PI * 3) * (1 - progress) * 0.05;
            
            // Extremely subtle scaling for clicked circle
            const clickScale = 1 + (0.08 * (1 - easeOut)) + pulseIntensity;
            rippleScale = Math.max(rippleScale, clickScale);
          }
        }
      
      for (const ripple of activeRipplesRef.current) {
        const elapsed = currentTime - ripple.startTime;
        const progress = Math.min(elapsed / ripple.duration, 1);
        
        if (progress >= 0 && progress <= 1) {
          // Calculate distance from ripple center
          const dx = circle.originalPosition.x - ripple.centerX;
          const dy = circle.originalPosition.y - ripple.centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Easing function that starts immediately but slows down (ease-out)
          const easeOut = Math.sqrt(progress);
          
          // Calculate ripple wave position with easing
          const wavePosition = easeOut * CONFIG.RIPPLE.MAX_RADIUS;
          const waveWidth = CONFIG.RIPPLE.WAVE_WIDTH;
          
          // Create a smoother wave front
          const waveStart = Math.max(0, wavePosition - waveWidth);
          const waveEnd = wavePosition;
          
          // Check if circle is within the ripple wave
          if (distance >= waveStart && distance <= waveEnd) {
            // Calculate position within the wave (0 to 1)
            const waveProgress = waveWidth > 0 ? (distance - waveStart) / waveWidth : 0;
            
            // Create gentler wave intensity using sine function
            const waveIntensity = Math.sin(waveProgress * Math.PI) * 0.8;
            
            // Apply gentle fade out over time
            const fadeOut = Math.pow(1 - progress, 1.5);
            
            // Additional distance-based attenuation for more natural look
            const distanceAttenuation = Math.max(0, 1 - (distance / CONFIG.RIPPLE.MAX_RADIUS));
            
            // Combine all factors with reduced intensity
            const finalIntensity = waveIntensity * fadeOut * distanceAttenuation * 0.7;
            
            // Calculate scale effect with smooth interpolation
            const scaleEffect = 1 + (CONFIG.RIPPLE.MAX_SCALE - 1) * finalIntensity;
            rippleScale = Math.max(rippleScale, scaleEffect);
          }
        }
      }
      
      // Smooth interpolation to prevent jarring changes
      const lerpFactor = 0.08; // Gentler, slower transitions
      circle.rippleScale = circle.rippleScale + (rippleScale - circle.rippleScale) * lerpFactor;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render circles
    for (const circle of circlesRef.current) {
      const { body, isFilled, rippleScale } = circle;
      const baseRadius = body.circleRadius as number || body.bounds.max.x - body.bounds.min.x;
      const radius = baseRadius * rippleScale;
      
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, radius, 0, Math.PI * 2);
      
      // Dynamic stroke width based on ripple scale (2px thicker)
      const strokeWidth = 2 + (rippleScale - 1) * 3;
      
      if (isFilled) {
        // Filled circles - use state 2 colors
        ctx.fillStyle = CONFIG.COLORS.STATE_2_FILL;
        ctx.fill();
      } else {
        // Unfilled circles - use state 1 colors
        if (CONFIG.FILL_OUTLINED_CIRCLES && CONFIG.COLORS.STATE_1_FILL !== 'transparent') {
          ctx.fillStyle = CONFIG.COLORS.STATE_1_FILL;
          ctx.fill();
        }
        ctx.strokeStyle = CONFIG.COLORS.STATE_1_OUTLINE;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    }
    
    // Render confetti particles (emoji celebration)
    if (confettiParticlesRef.current.length > 0) {
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      for (const particle of confettiParticlesRef.current) {
        // Calculate fade - smooth fade from 1.0 to 0.0 over entire lifetime
        const lifeProgress = 1 - (particle.life / particle.maxLife);
        const alpha = Math.max(0, 1 - lifeProgress); // Fade from 1 to 0
        
        if (alpha < 0.01) continue; // Skip nearly invisible particles
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.scale(particle.scale, particle.scale);
        
        // Draw emoji
        ctx.fillStyle = 'black';
        ctx.fillText(particle.emoji, 0, 0);
        
        ctx.restore();
      }
    }
    
    // Continue animation loop
    requestAnimationRef.current = requestAnimationFrame(animatePhysics);
  }, [CONFIG]);

  // Handle resize and initial setup - ONLY RUNS ON RESIZE or FIRST MOUNT
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      // Cancel any existing animation frame
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
        requestAnimationRef.current = null;
      }
      
      // We need to re-initialize physics on resize
      isInitializedRef.current = false;
      
      // Check if mobile
      const currentDeviceType = getDeviceType();
      
      // Get viewport width for truly full width canvas
      const viewportWidth = window.innerWidth;
      canvas.width = viewportWidth;
      
      // Use responsive values based on device type
      const columns = CONFIG.COLUMNS[currentDeviceType.toUpperCase() as keyof typeof CONFIG.COLUMNS];
      const aspectRatioConfig = CONFIG.ASPECT_RATIO[currentDeviceType.toUpperCase() as keyof typeof CONFIG.ASPECT_RATIO];
      const aspectRatio = aspectRatioConfig.WIDTH / aspectRatioConfig.HEIGHT;
      
      // Calculate spacing
      const spacing = CONFIG.SPACING;
      
      // Calculate the column width to ensure full coverage
      const columnWidth = viewportWidth / columns;
      // Circle size to fill columns
      const adjustedCircleSize = columnWidth - spacing;
      
      // Calculate height based on aspect ratio
      const baseHeight = viewportWidth / aspectRatio;
      
      // Calculate row height based on adjusted circle size
      const rowHeight = adjustedCircleSize + spacing;
      
      // Calculate number of rows that would fit in the aspect ratio
      const estimatedRows = Math.floor((baseHeight - spacing) / rowHeight);
      
      // Add extra padding at the bottom to ensure last row is fully visible
      const gridHeight = (estimatedRows * rowHeight) + (spacing * 2);
      
      // Add vertical padding for circles that move outside the grid
      const verticalPadding = CONFIG.VERTICAL_PADDING;
      
      // Set canvas height to accommodate all rows plus padding
      const totalHeight = gridHeight + (verticalPadding * 2);
      canvas.height = totalHeight;
      
      const rows = estimatedRows;
      const totalCircles = rows * columns;
      
      // Update grid dimensions
      setGridDimensions({ rows, columns, totalCircles });
      
      // Initialize indices and set up physics
      const indices = initializeRandomIndices(totalCircles);
      
      // VICTORY LOCK: If victory is locked, ignore normal filled indices
      let filledIndicesSet: Set<number>;
      if (isVictoryLocked) {
        // Victory mode: all circles should be filled
        filledIndicesSet = new Set(Array.from({ length: totalCircles }, (_, i) => i));
      } else {
        filledIndicesSet = getFilledIndices(indices, totalCircles, true);
      }
      
      // Set up physics world - pass the top padding offset so grid starts at the right position
      setupPhysics(canvas, rows, columns, spacing, adjustedCircleSize, filledIndicesSet, verticalPadding);
      
      // VICTORY LOCK: Ensure progress stays at 100% after resize
      if (isVictoryLocked) {
        // Progress display is disabled, no need to set progress
      }
      
      // Start animation loop
      requestAnimationRef.current = requestAnimationFrame(animatePhysics);
    };

    // Add interaction event listeners
    const handleClick = (e: MouseEvent) => {
      handleCanvasInteraction(e);
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling on touch
      handleCanvasInteraction(e);
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart);
    
          handleResize();
      
      return () => {
        // Clean up
        if (requestAnimationRef.current) {
          cancelAnimationFrame(requestAnimationRef.current);
        }
        
        if (engineRef.current) {
          Matter.Engine.clear(engineRef.current);
        }
        
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('touchstart', handleTouchStart);
      };
    }, [CONFIG, initializeRandomIndices, getFilledIndices, setupPhysics, animatePhysics, handleCanvasInteraction, isVictoryLocked, getDeviceType]);

  // Add useEffect to set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keep activeRipplesRef in sync with activeRipples state
  useEffect(() => {
    activeRipplesRef.current = activeRipples;
  }, [activeRipples]);

  return (
    <div>  

      
      {/* Grid Section */}
      <section
        data-slice-type={slice.slice_type}
        data-slice-variation={slice.variation}
        style={{ 
          margin: 0, 
          padding: 0,
          width: '100vw',
          maxWidth: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw'
        }}
      >     

<div className="flex items-center gap-2">
      <div onClick={handleToggle} className="cursor-pointer hover:bg-black hover:text-white bg-white rounded-r-full pl-8 pr-12 py-2 md:py-6 w-fit mb-4 text-gray-800">
        <h2>
          {toggleState ? 'Our solution' : 'Click here see how Sanavia can help'}  
        </h2>
      </div>
    </div>


      {/* <div className="flex md:items-center gap-2 md:flex-row flex-col">
        <div className="bg-white rounded-r-full pl-8 pr-12 py-2 md:py-6 w-fit  md:mb-4 text-gray-800 mr-3 mb-2">
          <h3>
            {toggleState 
              ? "This is what Sanavia's technology can achieve"
              : "Each dot = a patient. Click to give them hope."
            }
          </h3>
        </div>

        <div className="bg-white md:rounded-full rounded-r-3xl pl-8 pr-12 py-2 md:py-6 w-fit mb-4 text-gray-800">
          <h3>
            {Math.round(progress)}% Helped
          </h3>
        </div>
      </div> */}

        

        
     

<div className="mt-4 bg-white rounded-r-3xl pl-8 pr-12 py-2 md:py-6 mr-3 md:w-1/2 mb-4 text-gray-800">
        <h3>
        {settings?.grid_problem} 
        </h3>
      </div> 
      
      <canvas 
          ref={canvasRef} 
          style={{ 
            display: 'block', 
            margin: 0, 
            padding: '0 20px 0 20px',
            width: '100%',
            maxWidth: '100%',
            cursor: 'pointer'
          }}
        />

      </section>


    </div>
  );
};

export default Grid;
