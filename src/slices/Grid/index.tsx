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
    
    // Circle color
    CIRCLE_COLOR: 'white'
  }), []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCircle, setHoveredCircle] = useState<number | null>(null);
  const [gridDimensions, setGridDimensions] = useState({ 
    rows: 0, 
    columns: CONFIG.COLUMNS, 
    totalCircles: 0 
  });

  // Define drawCircles as a memoized function to avoid recreating it on each render
  const drawCircles = useCallback((
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement,
    circleSize: number, 
    spacing: number, 
    rows: number, 
    columns: number
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
        // Calculate center position of each circle to span full width
        const x = (col * columnWidth) + (columnWidth / 2);
        const y = spacing + row * (adjustedCircleSize + spacing) + adjustedCircleSize / 2;
        
        ctx.beginPath();
        ctx.arc(x, y, adjustedCircleSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.CIRCLE_COLOR;
        ctx.fill();
      }
    }
  }, [CONFIG.CIRCLE_COLOR]);

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
      
      // Draw circles with adjusted sizes
      drawCircles(ctx, canvas, adjustedCircleSize, spacing, rows, columns);
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
  }, [CONFIG.COLUMNS, CONFIG.SPACING, CONFIG.ASPECT_RATIO.WIDTH, CONFIG.ASPECT_RATIO.HEIGHT, drawCircles]);

  return (
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
  );
};

export default Grid;
