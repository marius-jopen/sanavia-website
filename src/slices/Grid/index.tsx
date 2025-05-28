"use client";
import { FC, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import Matter from 'matter-js';

/**
 * Props for `Grid`.
 */
export type GridProps = SliceComponentProps<Content.GridSlice>;

/**
 * Circle type for physics simulation
 */
type PhysicsCircle = {
  body: Matter.Body;
  originalPosition: { x: number; y: number };
  color: string;
  index: number;
};

/**
 * Component for "Grid" Slices.
 */
const Grid: FC<GridProps> = ({ slice }) => {
  // Configuration variables - modify these to control the grid
  const CONFIG = useMemo(() => ({
    // Mobile breakpoint
    MOBILE_BREAKPOINT: 768,
    
    // Number of columns in the grid
    COLUMNS: {
      DESKTOP: 15,
      MOBILE: 8
    },
    
    // Aspect ratio (width:height)
    ASPECT_RATIO: {
      // Desktop: 16:9 is widescreen
      DESKTOP: {
        WIDTH: 16,
        HEIGHT: 9
      },
      // Mobile: 9:16 is portrait
      MOBILE: {
        WIDTH: 9,
        HEIGHT: 16
      }
    },
    
    // Spacing between circles in pixels
    SPACING: 10,
    
    // Circle colors
    COLORS: {
      DEFAULT: 'white',
      BLUE: 'black'
    },
    
    // Percentage of blue circles when toggle is false (20%)
    BLUE_PERCENTAGE_OFF: 20,
    
    // Percentage of blue circles when toggle is true (60%)
    BLUE_PERCENTAGE_ON: 60,
    
    // Physics configuration
    PHYSICS: {
      // How strongly circles are repelled by the mouse
      REPULSION_STRENGTH: 0.1,
      
      // Maximum distance that the mouse affects circles
      REPULSION_RADIUS: {
        DESKTOP: 150,
        MOBILE: 80
      },
      
      // How quickly circles return to their original positions
      SPRING_STRENGTH: 0.001,
      
      // Friction to slow down circle movement
      FRICTION: 2,
      
      // Vertical padding (in pixels) to add at top and bottom of canvas
      // to ensure circles don't disappear when they move outside the grid
      VERTICAL_PADDING: 200
    }
  }), []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const circlesRef = useRef<PhysicsCircle[]>([]);
  const mousePositionRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const toggleRef = useRef<boolean>(false);
  
  // This state is only for forcing UI updates, not for physics
  const [toggleState, setToggleState] = useState(false);
  const [randomizedIndices, setRandomizedIndices] = useState<number[]>([]);
  const [gridDimensions, setGridDimensions] = useState({ 
    rows: 0, 
    columns: 0, 
    totalCircles: 0 
  });
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile based on window width
  const checkIfMobile = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < CONFIG.MOBILE_BREAKPOINT;
    }
    return false;
  }, [CONFIG.MOBILE_BREAKPOINT]);

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

  // Get the set of blue indices based on toggle state
  const getBlueIndices = useCallback((indices: number[], totalCircles: number) => {
    const percentage = toggleRef.current ? CONFIG.BLUE_PERCENTAGE_ON : CONFIG.BLUE_PERCENTAGE_OFF;
    const count = Math.floor(totalCircles * (percentage / 100));
    
    // Take first 'count' elements from our consistent randomized array
    return new Set(indices.slice(0, count));
  }, [CONFIG.BLUE_PERCENTAGE_ON, CONFIG.BLUE_PERCENTAGE_OFF]);

  // Setup physics world with matter.js
  const setupPhysics = useCallback((
    canvas: HTMLCanvasElement,
    rows: number,
    columns: number,
    spacing: number,
    circleSize: number,
    blueIndicesSet: Set<number>,
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
        
        // Create a circular body
        const body = Matter.Bodies.circle(x, y, circleSize / 2, {
          isStatic: false,
          friction: CONFIG.PHYSICS.FRICTION,
          restitution: 0.3,
          frictionAir: 0.03
        });
        
        // Determine color based on indices
        const color = blueIndicesSet.has(index) ? CONFIG.COLORS.BLUE : CONFIG.COLORS.DEFAULT;
        
        // Store circles with their original positions
        circles.push({
          body,
          originalPosition: { x, y },
          color,
          index
        });
        
        // Add body to the world
        Matter.Composite.add(engine.world, body);
      }
    }
    
    circlesRef.current = circles;
    isInitializedRef.current = true;
    
    return engine;
  }, [CONFIG.COLORS.BLUE, CONFIG.COLORS.DEFAULT, CONFIG.PHYSICS.FRICTION]);
  
  // Handle toggle button click - just update the ref and force UI update
  const handleToggle = useCallback(() => {
    // Update our ref first (this is what physics will use)
    toggleRef.current = !toggleRef.current;
    
    // Only force a UI update
    setToggleState(toggleRef.current);
    
    // Directly update circle colors without any re-render
    if (isInitializedRef.current && circlesRef.current.length > 0) {
      const { totalCircles } = gridDimensions;
      const indices = randomizedIndices.length === totalCircles 
        ? randomizedIndices 
        : initializeRandomIndices(totalCircles);
      
      const blueIndicesSet = getBlueIndices(indices, totalCircles);
      
      // Update colors without changing positions
      for (const circle of circlesRef.current) {
        circle.color = blueIndicesSet.has(circle.index) ? CONFIG.COLORS.BLUE : CONFIG.COLORS.DEFAULT;
      }
    }
  }, [gridDimensions, randomizedIndices, initializeRandomIndices, getBlueIndices, CONFIG.COLORS.BLUE, CONFIG.COLORS.DEFAULT]);

  // Animation loop for physics simulation
  const animatePhysics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current || !isInitializedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update physics engine
    Matter.Engine.update(engineRef.current, 1000 / 60);
    
    // Apply forces based on mouse position
    if (mousePositionRef.current) {
      const { x: mouseX, y: mouseY, active } = mousePositionRef.current;
      const circles = circlesRef.current;
      const repulsionStrength = CONFIG.PHYSICS.REPULSION_STRENGTH;
      const repulsionRadius = isMobile ? 
        CONFIG.PHYSICS.REPULSION_RADIUS.MOBILE : 
        CONFIG.PHYSICS.REPULSION_RADIUS.DESKTOP;
      const springStrength = CONFIG.PHYSICS.SPRING_STRENGTH;
      
      for (const circle of circles) {
        const { body, originalPosition } = circle;
        const { position } = body;
        
        // Only apply mouse repulsion if mouse is active (inside canvas)
        if (active) {
          // Calculate distance from mouse to circle
          const dx = position.x - mouseX;
          const dy = position.y - mouseY;
          const distanceSquared = dx * dx + dy * dy;
          
          if (distanceSquared < repulsionRadius * repulsionRadius) {
            // Apply repulsion force (stronger when closer)
            const distance = Math.sqrt(distanceSquared);
            const forceMagnitude = repulsionStrength * (1 - distance / repulsionRadius);
            
            // Normalize direction vector
            const forceX = (dx / distance) * forceMagnitude;
            const forceY = (dy / distance) * forceMagnitude;
            
            Matter.Body.applyForce(body, position, {
              x: forceX,
              y: forceY
            });
          }
        }
        
        // Always apply spring force to return to original position
        const springDx = originalPosition.x - position.x;
        const springDy = originalPosition.y - position.y;
        
        Matter.Body.applyForce(body, position, {
          x: springDx * springStrength,
          y: springDy * springStrength
        });
      }
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render circles
    for (const circle of circlesRef.current) {
      const { body, color } = circle;
      
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, body.circleRadius as number || body.bounds.max.x - body.bounds.min.x, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    
    // Continue animation loop
    requestAnimationRef.current = requestAnimationFrame(animatePhysics);
  }, [CONFIG.PHYSICS.REPULSION_STRENGTH, CONFIG.PHYSICS.REPULSION_RADIUS, CONFIG.PHYSICS.SPRING_STRENGTH, isMobile]);

  // Update mobile state on resize
  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = checkIfMobile();
      setIsMobile(mobileCheck);
    };

    handleResize(); // Check initially

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkIfMobile]);

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
      const mobile = checkIfMobile();
      setIsMobile(mobile);
      
      // Get viewport width for truly full width canvas
      const viewportWidth = window.innerWidth;
      canvas.width = viewportWidth;
      
      // Use responsive values based on device type
      const columns = mobile ? CONFIG.COLUMNS.MOBILE : CONFIG.COLUMNS.DESKTOP;
      const aspectRatio = mobile 
        ? CONFIG.ASPECT_RATIO.MOBILE.WIDTH / CONFIG.ASPECT_RATIO.MOBILE.HEIGHT 
        : CONFIG.ASPECT_RATIO.DESKTOP.WIDTH / CONFIG.ASPECT_RATIO.DESKTOP.HEIGHT;
      
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
      const verticalPadding = CONFIG.PHYSICS.VERTICAL_PADDING;
      
      // Set canvas height to accommodate all rows plus padding
      const totalHeight = gridHeight + (verticalPadding * 2);
      canvas.height = totalHeight;
      
      const rows = estimatedRows;
      const totalCircles = rows * columns;
      
      // Update grid dimensions
      setGridDimensions({ rows, columns, totalCircles });
      
      // Initialize indices and set up physics
      const indices = initializeRandomIndices(totalCircles);
      const blueIndicesSet = getBlueIndices(indices, totalCircles);
      
      // Set up physics world - pass the top padding offset so grid starts at the right position
      setupPhysics(canvas, rows, columns, spacing, adjustedCircleSize, blueIndicesSet, verticalPadding);
      
      // Start animation loop
      requestAnimationRef.current = requestAnimationFrame(animatePhysics);
    };

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update mouse position for physics simulation with active flag
      mousePositionRef.current = { x, y, active: true };
    };
    
    // Handle mouse leaving the canvas
    const handleMouseLeave = () => {
      // Instead of setting to null, we keep the last position but mark as inactive
      if (mousePositionRef.current) {
        mousePositionRef.current.active = false;
      }
    };

    // Handle mouse entering the canvas
    const handleMouseEnter = () => {
      // Reactivate mouse effect if we have a position
      if (mousePositionRef.current) {
        mousePositionRef.current.active = true;
      }
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    
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
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [CONFIG, initializeRandomIndices, getBlueIndices, setupPhysics, animatePhysics, checkIfMobile]);

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
          overflow: 'hidden',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw'
        }}
      >
        {/* Toggle Button - positioned above the circles */}
        <button 
          onClick={handleToggle}
          className={`
            bg-white text-black hover:bg-black hover:text-white
            pl-6 pr-10 py-3 md:py-6
            rounded-r-full
            cursor-pointer
            font-bold
            transition-all duration-300 ease-in-out
            focus:outline-none
            cursor-pointer
            z-20
            absolute
            left-0
          `}
          style={{
            top: `${CONFIG.PHYSICS.VERTICAL_PADDING - (isMobile ? 80 : 150)}px` // Closer on mobile
          }}
        >
          <h2>
            {toggleState ? `Our solution` : `The problem`}
          </h2>
        </button>
        
        <canvas 
          ref={canvasRef} 
          style={{ 
            display: 'block', 
            margin: 0, 
            padding: 0,
            width: '100%',
            maxWidth: '100%'
          }}
        />
      </section>
    </div>
  );
};

export default Grid;
