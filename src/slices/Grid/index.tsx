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
};

/**
 * Component for "Grid" Slices.
 */
const Grid: FC<GridProps> = ({ slice }) => {
  // Configuration variables - modify these to control the grid
  const CONFIG = useMemo(() => ({
    // Number of columns in the grid
    COLUMNS: 15,
    
    // Aspect ratio (width:height) - 16:9 is widescreen
    ASPECT_RATIO: {
      WIDTH: 16,
      HEIGHT: 9
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
      REPULSION_STRENGTH: 0.5,
      
      // Maximum distance that the mouse affects circles
      REPULSION_RADIUS: 150,
      
      // How quickly circles return to their original positions
      SPRING_STRENGTH: 0.001,
      
      // Friction to slow down circle movement
      FRICTION: 1
    }
  }), []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const circlesRef = useRef<PhysicsCircle[]>([]);
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);
  
  const [toggleOn, setToggleOn] = useState(false);
  const [randomizedIndices, setRandomizedIndices] = useState<number[]>([]);
  const [gridDimensions, setGridDimensions] = useState({ 
    rows: 0, 
    columns: CONFIG.COLUMNS, 
    totalCircles: 0 
  });

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
    const percentage = toggleOn ? CONFIG.BLUE_PERCENTAGE_ON : CONFIG.BLUE_PERCENTAGE_OFF;
    const count = Math.floor(totalCircles * (percentage / 100));
    
    // Take first 'count' elements from our consistent randomized array
    return new Set(indices.slice(0, count));
  }, [toggleOn, CONFIG.BLUE_PERCENTAGE_ON, CONFIG.BLUE_PERCENTAGE_OFF]);

  // Setup physics world with matter.js
  const setupPhysics = useCallback((
    canvas: HTMLCanvasElement,
    rows: number,
    columns: number,
    spacing: number,
    circleSize: number,
    blueIndicesSet: Set<number>
  ) => {
    // Clean up existing engine if it exists
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
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
        
        // Calculate center position
        const x = (col * columnWidth) + (columnWidth / 2);
        const y = spacing + row * (circleSize + spacing) + circleSize / 2;
        
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
          color
        });
        
        // Add body to the world
        Matter.Composite.add(engine.world, body);
      }
    }
    
    circlesRef.current = circles;
    
    return engine;
  }, [CONFIG.COLORS.BLUE, CONFIG.COLORS.DEFAULT, CONFIG.PHYSICS.FRICTION]);
  
  // Handle toggle button click
  const handleToggle = useCallback(() => {
    setToggleOn(prev => !prev);
  }, []);

  // Update circle colors when toggle changes
  useEffect(() => {
    if (gridDimensions.totalCircles > 0 && circlesRef.current.length > 0) {
      const { totalCircles } = gridDimensions;
      
      // Use the same randomized indices but change the count
      const indices = randomizedIndices.length === totalCircles 
        ? randomizedIndices 
        : initializeRandomIndices(totalCircles);
        
      const blueIndicesSet = getBlueIndices(indices, totalCircles);
      
      // Update colors of circles
      const circles = circlesRef.current;
      for (let i = 0; i < circles.length; i++) {
        circles[i].color = blueIndicesSet.has(i) ? CONFIG.COLORS.BLUE : CONFIG.COLORS.DEFAULT;
      }
    }
  }, [toggleOn, gridDimensions, randomizedIndices, initializeRandomIndices, getBlueIndices, CONFIG.COLORS.BLUE, CONFIG.COLORS.DEFAULT]);

  // Animation loop for physics simulation
  const animatePhysics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update physics engine
    Matter.Engine.update(engineRef.current, 1000 / 60);
    
    // Apply forces based on mouse position
    if (mousePositionRef.current) {
      const { x: mouseX, y: mouseY } = mousePositionRef.current;
      const circles = circlesRef.current;
      const repulsionStrength = CONFIG.PHYSICS.REPULSION_STRENGTH;
      const repulsionRadius = CONFIG.PHYSICS.REPULSION_RADIUS;
      const springStrength = CONFIG.PHYSICS.SPRING_STRENGTH;
      
      for (const circle of circles) {
        const { body, originalPosition } = circle;
        const { position } = body;
        
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
        
        // Apply spring force to return to original position
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
  }, [CONFIG.PHYSICS.REPULSION_STRENGTH, CONFIG.PHYSICS.REPULSION_RADIUS, CONFIG.PHYSICS.SPRING_STRENGTH]);

  // Handle resize and initial setup
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
      
      // Get viewport width for truly full width canvas
      const viewportWidth = window.innerWidth;
      canvas.width = viewportWidth;
      
      // Fixed number of columns from config
      const columns = CONFIG.COLUMNS;
      
      // Calculate spacing
      const spacing = CONFIG.SPACING;
      
      // Calculate the column width to ensure full coverage
      const columnWidth = viewportWidth / columns;
      // Circle size to fill columns
      const adjustedCircleSize = columnWidth - spacing;
      
      // Calculate aspect ratio height
      const aspectRatio = CONFIG.ASPECT_RATIO.WIDTH / CONFIG.ASPECT_RATIO.HEIGHT;
      const baseHeight = viewportWidth / aspectRatio;
      
      // Calculate row height based on adjusted circle size
      const rowHeight = adjustedCircleSize + spacing;
      
      // Calculate number of rows that would fit in the aspect ratio
      const estimatedRows = Math.floor((baseHeight - spacing) / rowHeight);
      
      // Add extra padding at the bottom to ensure last row is fully visible
      const totalHeight = (estimatedRows * rowHeight) + (spacing * 2);
      
      // Set canvas height to accommodate all rows plus padding
      canvas.height = totalHeight;
      
      const rows = estimatedRows;
      const totalCircles = rows * columns;
      
      // Update grid dimensions
      setGridDimensions({ rows, columns, totalCircles });
      
      // Initialize indices and set up physics
      const indices = initializeRandomIndices(totalCircles);
      const blueIndicesSet = getBlueIndices(indices, totalCircles);
      
      // Set up physics world
      setupPhysics(canvas, rows, columns, spacing, adjustedCircleSize, blueIndicesSet);
      
      // Start animation loop
      requestAnimationRef.current = requestAnimationFrame(animatePhysics);
    };

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update mouse position for physics simulation
      mousePositionRef.current = { x, y };
    };
    
    // Handle mouse leaving the canvas
    const handleMouseLeave = () => {
      mousePositionRef.current = null;
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
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
    };
  }, [CONFIG.COLUMNS, CONFIG.SPACING, CONFIG.ASPECT_RATIO.WIDTH, CONFIG.ASPECT_RATIO.HEIGHT, initializeRandomIndices, getBlueIndices, setupPhysics, animatePhysics]);

  return (
    <div>
      {/* Toggle Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '20px 0',
        width: '100%' 
      }}>
        <button 
          onClick={handleToggle}
          style={{
            backgroundColor: toggleOn ? CONFIG.COLORS.BLUE : 'white',
            color: toggleOn ? 'white' : 'black',
            border: `2px solid ${CONFIG.COLORS.BLUE}`,
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          {toggleOn ? `${CONFIG.BLUE_PERCENTAGE_ON}% Black` : `${CONFIG.BLUE_PERCENTAGE_OFF}% Black`}
        </button>
      </div>
      
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
