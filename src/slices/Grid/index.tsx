"use client";
import { FC, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `Grid`.
 */
export type GridProps = SliceComponentProps<Content.GridSlice>;

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
      BLUE: 'black' // Using black as requested
    },
    
    // Percentage of blue circles when toggle is false (20%)
    BLUE_PERCENTAGE_OFF: 20,
    
    // Percentage of blue circles when toggle is true (60%)
    BLUE_PERCENTAGE_ON: 60
  }), []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCircle, setHoveredCircle] = useState<number | null>(null);
  const [toggleOn, setToggleOn] = useState(false);
  
  // Store all indices in a randomized but consistent order
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

  // Define drawCircles as a memoized function to avoid recreating it on each render
  const drawCircles = useCallback((
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement,
    circleSize: number, 
    spacing: number, 
    rows: number, 
    columns: number,
    blueIndicesSet: Set<number>
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate total width to ensure circles stretch edge to edge
    const totalWidth = canvas.width;
    
    // Calculate the size of each column to ensure complete coverage
    const columnWidth = totalWidth / columns;
    // Adjust circle size to fill entire width
    const adjustedCircleSize = columnWidth - spacing;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        
        // Calculate center position of each circle to span full width
        const x = (col * columnWidth) + (columnWidth / 2);
        const y = spacing + row * (adjustedCircleSize + spacing) + adjustedCircleSize / 2;
        
        ctx.beginPath();
        ctx.arc(x, y, adjustedCircleSize / 2, 0, Math.PI * 2);
        
        // Set color based on whether this circle is in the blue indices
        ctx.fillStyle = blueIndicesSet.has(index) ? CONFIG.COLORS.BLUE : CONFIG.COLORS.DEFAULT;
        ctx.fill();
      }
    }
  }, [CONFIG.COLORS.BLUE, CONFIG.COLORS.DEFAULT]);

  // Handle toggle button click
  const handleToggle = useCallback(() => {
    setToggleOn(prev => !prev);
  }, []);

  // Update display when toggle changes (but keep same random indices)
  useEffect(() => {
    if (gridDimensions.totalCircles > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const { rows, columns, totalCircles } = gridDimensions;
          const spacing = CONFIG.SPACING;
          const columnWidth = canvas.width / columns;
          const adjustedCircleSize = columnWidth - spacing;
          
          // Use the same randomized indices but change the count
          const indices = randomizedIndices.length === totalCircles 
            ? randomizedIndices 
            : initializeRandomIndices(totalCircles);
            
          const blueIndicesSet = getBlueIndices(indices, totalCircles);
          
          // Only draw the circles with updated blue percentage
          drawCircles(ctx, canvas, adjustedCircleSize, spacing, rows, columns, blueIndicesSet);
        }
      }
    }
  }, [toggleOn, gridDimensions, CONFIG.SPACING, randomizedIndices, initializeRandomIndices, getBlueIndices, drawCircles]);

  // Handle resize and initial setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
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
      
      // Make sure we have initialized our random indices
      const indices = initializeRandomIndices(totalCircles);
      const blueIndicesSet = getBlueIndices(indices, totalCircles);
      
      // Draw circles with initial blue indices
      drawCircles(ctx, canvas, adjustedCircleSize, spacing, rows, columns, blueIndicesSet);
    };

    // Handle mouse movement for potential future interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const { columns, totalCircles } = gridDimensions;
      
      // Calculate column width for hit detection
      const columnWidth = canvas.width / columns;
      const adjustedCircleSize = columnWidth - CONFIG.SPACING;
      
      let hovered = null;
      
      for (let i = 0; i < totalCircles; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        
        // Calculate center position of each circle
        const circleX = (col * columnWidth) + (columnWidth / 2);
        const circleY = CONFIG.SPACING + row * (adjustedCircleSize + CONFIG.SPACING) + adjustedCircleSize / 2;
        
        const distance = Math.sqrt(Math.pow(x - circleX, 2) + Math.pow(y - circleY, 2));
        
        if (distance <= adjustedCircleSize / 2) {
          hovered = i;
          break;
        }
      }
      
      if (hovered !== null) {
        setHoveredCircle(hovered);
      }
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [CONFIG.COLUMNS, CONFIG.SPACING, CONFIG.ASPECT_RATIO.WIDTH, CONFIG.ASPECT_RATIO.HEIGHT, drawCircles, initializeRandomIndices, getBlueIndices]);

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
