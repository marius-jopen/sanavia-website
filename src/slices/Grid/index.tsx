"use client";
import { FC, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import Matter from 'matter-js';

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
        HEIGHT: 9
      },
      // Tablet: 16:9 is intermediate
      TABLET: {
        WIDTH: 16,
        HEIGHT: 9
      },
      // Mobile: 9:5 is portrait
      MOBILE: {
        WIDTH: 9,
        HEIGHT: 5
      }
    },
    
    // Spacing between circles in pixels
    SPACING: 10,
    
    // Circle colors
    COLORS: {
      DEFAULT: 'white',
      FILLED: 'black',
      OUTLINE: 'rgba(255, 255, 255, 0.6)',
      GLOW: 'rgba(0, 0, 0, 0.3)'
    },
    
    // Progress percentages
    INITIAL_FILLED_PERCENTAGE: 20,
    SOLUTION_FILLED_PERCENTAGE: 60,
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
      // Click/tap detection radius
      CLICK_RADIUS: {
        DESKTOP: 50,
        TABLET: 55,
        MOBILE: 60
      }
    },
    
    // Vertical padding (in pixels) to add at top and bottom of canvas
    VERTICAL_PADDING: 20
  }), []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const circlesRef = useRef<PhysicsCircle[]>([]);
  const isInitializedRef = useRef<boolean>(false);
  const toggleRef = useRef<boolean>(false);
  const timeRef = useRef<number>(0);
  const activeRipplesRef = useRef<RippleEffect[]>([]);
  
  // This state is only for forcing UI updates, not for physics
  const [toggleState, setToggleState] = useState(false);
  const [randomizedIndices, setRandomizedIndices] = useState<number[]>([]);
  const [gridDimensions, setGridDimensions] = useState({ 
    rows: 0, 
    columns: 0, 
    totalCircles: 0 
  });
  const [progress, setProgress] = useState(20);
  const [userFilledCount, setUserFilledCount] = useState(0);
  const [activeRipples, setActiveRipples] = useState<RippleEffect[]>([]);

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

  // Check if device is mobile based on window width (keeping for compatibility)
  const checkIfMobile = useCallback(() => {
    if (!isMounted || typeof window === 'undefined') {
      return false; // Default for SSR
    }
    return window.innerWidth < CONFIG.MOBILE_BREAKPOINT;
  }, [CONFIG.MOBILE_BREAKPOINT, isMounted]);

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
    if (!canvasRef.current) return; // Allow interaction in both modes
    
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
      
      if (distance < clickRadius && distance < closestDistance && !circle.isFilled) {
        closestDistance = distance;
        closestCircle = circle;
      }
    }
    
                  // Fill the closest circle if found
    if (closestCircle) {
      closestCircle.isFilled = true;
      closestCircle.isUserFilled = true;
      closestCircle.isClickedCircle = true;
      closestCircle.clickAnimationStart = Date.now();
      
      // Update progress
      const filledCount = circlesRef.current.filter(c => c.isFilled).length;
      const newProgress = Math.min(
        (filledCount / circlesRef.current.length) * 100,
        CONFIG.MAX_FILLED_PERCENTAGE
      );
      setProgress(newProgress);
      setUserFilledCount(prev => prev + 1);
      
      // Create ripple effect
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
  }, [CONFIG, getDeviceType]);

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
        
        // Determine if initially filled
        const isInitiallyFilled = filledIndicesSet.has(index);
        
        // Store circles with their original positions and ripple properties
        circles.push({
          body,
          originalPosition: { x, y },
          color: isInitiallyFilled ? CONFIG.COLORS.FILLED : CONFIG.COLORS.DEFAULT,
          index,
          isFilled: isInitiallyFilled,
          isInitiallyFilled,
          isUserFilled: false,
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
  }, [CONFIG, getDeviceType]);
  
  // Handle toggle button click - just update the ref and force UI update
  const handleToggle = useCallback(() => {
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
      
      // Update all circles to match toggle state
      for (const circle of circlesRef.current) {
        const shouldBeFilled = filledIndicesSet.has(circle.index);
        circle.isFilled = shouldBeFilled;
        circle.isInitiallyFilled = shouldBeFilled;
        circle.isUserFilled = false;
        circle.isClickedCircle = false;
        circle.clickAnimationStart = 0;
        circle.color = shouldBeFilled ? CONFIG.COLORS.FILLED : CONFIG.COLORS.DEFAULT;
      }
      
      // Update progress to match toggle state
      const newProgress = toggleRef.current ? CONFIG.SOLUTION_FILLED_PERCENTAGE : CONFIG.INITIAL_FILLED_PERCENTAGE;
      setProgress(newProgress);
      setUserFilledCount(0);
    }
  }, [gridDimensions, randomizedIndices, initializeRandomIndices, getFilledIndices, CONFIG]);

  // Animation loop for physics simulation with ripple effects
  const animatePhysics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current || !isInitializedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update physics engine
    Matter.Engine.update(engineRef.current, 1000 / 60);
    
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
      
      // Dynamic stroke width based on ripple scale
      const strokeWidth = 2 + (rippleScale - 1) * 3;
      
      if (isFilled) {
        // Filled circles (black) - always show as filled immediately
        ctx.fillStyle = CONFIG.COLORS.FILLED;
        ctx.fill();
        
        // Add dynamic glow based on scale and clicked state
        let glowIntensity = 4 + (rippleScale - 1) * 8;
        
        // Extra glow for clicked circles
        if (circle.isClickedCircle) {
          const elapsed = Date.now() - circle.clickAnimationStart;
          const progress = Math.min(elapsed / CONFIG.RIPPLE.DURATION, 1);
          const clickGlow = 2 * (1 - progress); // Extremely subtle glow that fades out
          glowIntensity += clickGlow;
        }
        
        ctx.shadowColor = CONFIG.COLORS.GLOW;
        ctx.shadowBlur = glowIntensity;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Unfilled circles (white outline) with dynamic width
        ctx.strokeStyle = CONFIG.COLORS.OUTLINE;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    }
    
    // Continue animation loop
    requestAnimationRef.current = requestAnimationFrame(animatePhysics);
  }, [CONFIG, getDeviceType]);

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
      const filledIndicesSet = getFilledIndices(indices, totalCircles, true);
      
      // Set up physics world - pass the top padding offset so grid starts at the right position
      setupPhysics(canvas, rows, columns, spacing, adjustedCircleSize, filledIndicesSet, verticalPadding);
      
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
  }, [CONFIG, initializeRandomIndices, getFilledIndices, setupPhysics, animatePhysics, getDeviceType, handleCanvasInteraction]);

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
          {toggleState ? 'Our solution' : 'The problem'}  
        </h2>
      </div>

      <div className="bg-white rounded-full pl-8 pr-12 py-2 md:py-6 w-fit mb-4 text-gray-800">
        <h2>
          {Math.round(progress)}% Helped
        </h2>
      </div>
    </div>

      <div className="bg-white rounded-r-3xl pl-8 pr-12 py-2 md:py-6 mr-3 md:w-1/2 mb-4 text-gray-800">
        <p>
        {settings?.grid_problem} 
        </p>
      </div>  

      <div className="bg-white rounded-r-full pl-8 pr-12 py-2 md:py-6 w-fit mb-4 text-gray-800">
        <h3>
          {toggleState 
            ? "This is what Sanavia's technology can achieve"
            : "Each dot = a patient. Click to give them hope."
          }
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
