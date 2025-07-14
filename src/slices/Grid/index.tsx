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
  wiggleOffset: { x: number; y: number };
  wiggleSpeed: { x: number; y: number };
  isFilled: boolean;
  isInitiallyFilled: boolean;
  isUserFilled: boolean;
  isAnimating: boolean;
  animationProgress: number;
};

/**
 * Feedback message type
 */
type FeedbackMessage = {
  id: string;
  x: number;
  y: number;
  timestamp: number;
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
    MAX_FILLED_PERCENTAGE: 60,
    
    // Animation settings
    FILL_ANIMATION_DURATION: 1500, // 1.5 seconds
    
    // Wiggle animation configuration
    WIGGLE: {
      // Maximum wiggle distance in pixels
      MAX_DISTANCE: {
        DESKTOP: 3,
        TABLET: 2.5,
        MOBILE: 2
      },
      
      // Wiggle animation speed
      SPEED: {
        DESKTOP: 0.02,
        TABLET: 0.018,
        MOBILE: 0.015
      },
      
      // How quickly circles return to their original positions
      SPRING_STRENGTH: {
        DESKTOP: 0.001,
        TABLET: 0.001,
        MOBILE: 0.001
      },
      
      // Friction to control movement smoothness
      FRICTION: {
        DESKTOP: 8,
        TABLET: 7,
        MOBILE: 6
      }
    },
    
    // Interaction settings
    INTERACTION: {
      // Click/tap detection radius
      CLICK_RADIUS: {
        DESKTOP: 25,
        TABLET: 30,
        MOBILE: 35
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
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([]);
  const [showFinalMessage, setShowFinalMessage] = useState(false);

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
      const percentage = toggleRef.current ? CONFIG.MAX_FILLED_PERCENTAGE : CONFIG.INITIAL_FILLED_PERCENTAGE;
      const count = Math.floor(totalCircles * (percentage / 100));
      return new Set(indices.slice(0, count));
    } else {
      // Interactive mode: use current circle states
      return new Set(circlesRef.current.filter(circle => circle.isFilled).map(circle => circle.index));
    }
  }, [CONFIG.INITIAL_FILLED_PERCENTAGE, CONFIG.MAX_FILLED_PERCENTAGE]);

  // Handle click/tap interaction
  const handleCanvasInteraction = useCallback((event: MouseEvent | TouchEvent) => {
    if (!canvasRef.current || toggleRef.current) return; // Disable interaction in solution mode
    
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
      closestCircle.isAnimating = true;
      closestCircle.animationProgress = 0;
      
      // Update progress
      const filledCount = circlesRef.current.filter(c => c.isFilled).length;
      const newProgress = Math.min(
        (filledCount / circlesRef.current.length) * 100,
        CONFIG.MAX_FILLED_PERCENTAGE
      );
      setProgress(newProgress);
      setUserFilledCount(prev => prev + 1);
      
      // Add feedback message
      const feedbackId = `${closestCircle.index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setFeedbackMessages(prev => [...prev, {
        id: feedbackId,
        x: clientX - rect.left,
        y: clientY - rect.top,
        timestamp: Date.now()
      }]);
      
      // Remove feedback after 2 seconds
      setTimeout(() => {
        setFeedbackMessages(prev => prev.filter(msg => msg.id !== feedbackId));
      }, 2000);
      
      // Check if we've reached the maximum state
      if (newProgress >= CONFIG.MAX_FILLED_PERCENTAGE) {
        setShowFinalMessage(true);
      }
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
    
    const currentDeviceType = getDeviceType();
    const friction = CONFIG.WIGGLE.FRICTION[currentDeviceType.toUpperCase() as keyof typeof CONFIG.WIGGLE.FRICTION];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        
        // Calculate center position - adjust y position to account for top padding
        const x = (col * columnWidth) + (columnWidth / 2);
        const y = gridTopOffset + spacing + row * (circleSize + spacing) + circleSize / 2;
        
        // Create a circular body
        const body = Matter.Bodies.circle(x, y, circleSize / 2, {
          isStatic: false,
          friction: friction,
          restitution: 0.1,
          frictionAir: 0.05
        });
        
        // Determine if initially filled
        const isInitiallyFilled = filledIndicesSet.has(index);
        
        // Store circles with their original positions and wiggle properties
        circles.push({
          body,
          originalPosition: { x, y },
          color: isInitiallyFilled ? CONFIG.COLORS.FILLED : CONFIG.COLORS.DEFAULT,
          index,
          wiggleOffset: { x: 0, y: 0 },
          wiggleSpeed: { 
            x: (Math.random() - 0.5) * 0.02, 
            y: (Math.random() - 0.5) * 0.02 
          },
          isFilled: isInitiallyFilled,
          isInitiallyFilled,
          isUserFilled: false,
          isAnimating: false,
          animationProgress: 0
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
        circle.isAnimating = false;
        circle.animationProgress = 0;
        circle.color = shouldBeFilled ? CONFIG.COLORS.FILLED : CONFIG.COLORS.DEFAULT;
      }
      
      // Update progress to match toggle state
      const newProgress = toggleRef.current ? CONFIG.MAX_FILLED_PERCENTAGE : CONFIG.INITIAL_FILLED_PERCENTAGE;
      setProgress(newProgress);
      setUserFilledCount(0);
      setShowFinalMessage(false);
    }
  }, [gridDimensions, randomizedIndices, initializeRandomIndices, getFilledIndices, CONFIG]);

  // Animation loop for physics simulation with gentle wiggling
  const animatePhysics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current || !isInitializedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update time for wiggle animation
    timeRef.current += 0.016; // approximately 60fps

    // Update physics engine
    Matter.Engine.update(engineRef.current, 1000 / 60);
    
    // Apply gentle wiggle forces to circles
    const circles = circlesRef.current;
    const currentDeviceType = getDeviceType();
    const deviceKey = currentDeviceType.toUpperCase() as keyof typeof CONFIG.WIGGLE.MAX_DISTANCE;
    
    const maxDistance = CONFIG.WIGGLE.MAX_DISTANCE[deviceKey];
    const wiggleSpeed = CONFIG.WIGGLE.SPEED[deviceKey];
    const springStrength = CONFIG.WIGGLE.SPRING_STRENGTH[deviceKey];
    
    for (const circle of circles) {
      const { body, originalPosition } = circle;
      const { position } = body;
      
      // Update animation progress for filling circles
      if (circle.isAnimating) {
        circle.animationProgress += 0.016; // 60fps
        if (circle.animationProgress >= CONFIG.FILL_ANIMATION_DURATION / 1000) {
          circle.isAnimating = false;
          circle.animationProgress = 1;
        }
      }
      
      // Calculate gentle wiggle using sine waves with unique offsets per circle
      const wiggleMultiplier = circle.isFilled ? 0.7 : 1; // Filled circles wiggle less
      const wiggleX = Math.sin(timeRef.current * wiggleSpeed + circle.index * 0.5) * maxDistance * wiggleMultiplier;
      const wiggleY = Math.cos(timeRef.current * wiggleSpeed * 0.8 + circle.index * 0.3) * maxDistance * wiggleMultiplier;
      
      // Target position includes the wiggle offset
      const targetX = originalPosition.x + wiggleX;
      const targetY = originalPosition.y + wiggleY;
      
      // Apply gentle spring force toward the wiggling target position
      const springDx = targetX - position.x;
      const springDy = targetY - position.y;
      
      Matter.Body.applyForce(body, position, {
        x: springDx * springStrength,
        y: springDy * springStrength
      });
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render circles
    for (const circle of circlesRef.current) {
      const { body, isFilled, isAnimating, animationProgress } = circle;
      const radius = body.circleRadius as number || body.bounds.max.x - body.bounds.min.x;
      
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, radius, 0, Math.PI * 2);
      
      if (isFilled) {
        // Filled circles (black)
        if (isAnimating) {
          // Animated fill
          const progress = Math.min(animationProgress / (CONFIG.FILL_ANIMATION_DURATION / 1000), 1);
          const animRadius = radius * progress;
          
          // Draw outline first
          ctx.strokeStyle = CONFIG.COLORS.OUTLINE;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw growing fill
          if (animRadius > 0) {
            ctx.beginPath();
            ctx.arc(body.position.x, body.position.y, animRadius, 0, Math.PI * 2);
            ctx.fillStyle = CONFIG.COLORS.FILLED;
            ctx.fill();
          }
        } else {
          // Fully filled
          ctx.fillStyle = CONFIG.COLORS.FILLED;
          ctx.fill();
          
          // Add subtle glow
          ctx.shadowColor = CONFIG.COLORS.GLOW;
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else {
        // Unfilled circles (white outline)
        ctx.strokeStyle = CONFIG.COLORS.OUTLINE;
        ctx.lineWidth = 2;
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

        
        {/* Final message */}
        {showFinalMessage && !toggleState && (
          <div
            className="z-30 absolute left-1/2 transform -translate-x-1/2 
                       bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                       rounded-2xl px-8 py-6 shadow-2xl text-center max-w-md
                       animate-pulse"
            style={{
              bottom: `${CONFIG.VERTICAL_PADDING - 100}px`
            }}
          >
            <h3 className="text-xl font-bold mb-2">
              Imagine if our therapies could reach them all.
            </h3>
            <p className="text-sm opacity-90">
              See how Sanavia makes this vision a reality.
            </p>
          </div>
        )}
        
        {/* Feedback Messages */}
        {feedbackMessages.map((msg) => (
          <div
            key={msg.id}
            className="absolute pointer-events-none z-40 text-green-600 
                       font-bold text-sm animate-bounce"
            style={{
              left: msg.x,
              top: msg.y,
              transform: 'translate(-50%, -100%)',
              animation: 'fadeUpOut 2s ease-out forwards'
            }}
          >
            +1 patient helped
          </div>
        ))}
        
        <canvas 
          ref={canvasRef} 
          style={{ 
            display: 'block', 
            margin: 0, 
            padding: '0 20px 0 20px',
            width: '100%',
            maxWidth: '100%',
            cursor: toggleState ? 'default' : 'pointer'
          }}
        />
      </section>

      {/* CSS for feedback animation */}
      <style>{`
        @keyframes fadeUpOut {
          0% { opacity: 1; transform: translate(-50%, -100%) translateY(0px); }
          50% { opacity: 1; transform: translate(-50%, -100%) translateY(-20px); }
          100% { opacity: 0; transform: translate(-50%, -100%) translateY(-40px); }
        }
      `}</style>
    </div>
  );
};

export default Grid;
