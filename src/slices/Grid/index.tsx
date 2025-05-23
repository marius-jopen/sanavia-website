"use client";
import { FC, useEffect, useRef, useState, useCallback } from "react";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCircle, setHoveredCircle] = useState<number | null>(null);
  const [gridDimensions, setGridDimensions] = useState({ rows: 0, columns: 15, totalCircles: 0 });

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
    
    // Start position to distribute circles evenly across full width
    const startX = spacing;
    const startY = spacing;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const i = row * columns + col;
        
        // Calculate center position of each circle
        const x = startX + col * (circleSize + spacing) + circleSize / 2;
        const y = startY + row * (circleSize + spacing) + circleSize / 2;
        
        ctx.beginPath();
        const scale = hoveredCircle === i ? 1.1 : 1;
        ctx.arc(x, y, (circleSize / 2) * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
      }
    }
  }, [hoveredCircle]);

  // Handle resize and initial setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      // Get viewport width for truly full width canvas
      const viewportWidth = document.documentElement.clientWidth;
      canvas.width = viewportWidth;
      
      // Fixed number of columns (15)
      const columns = 15;
      
      // Calculate appropriate spacing and circle size
      const spacing = 10;
      const adjustedCellWidth = (viewportWidth - (spacing * 2)) / columns;
      const adjustedCircleSize = adjustedCellWidth - spacing;
      
      // Calculate how many rows will fit in the desired height
      // Use 16:9 as a starting point but ensure enough height for all circles
      const baseHeight = viewportWidth * (9/16);
      
      // Calculate row height
      const rowHeight = adjustedCircleSize + spacing;
      
      // Calculate number of rows that would fit in 16:9 ratio
      const estimatedRows = Math.floor((baseHeight - (spacing * 2)) / rowHeight);
      
      // Add extra padding at the bottom to ensure last row is fully visible
      const totalHeight = (estimatedRows * rowHeight) + (spacing * 2) + adjustedCircleSize/2;
      
      // Set canvas height to accommodate all rows plus padding
      canvas.height = totalHeight;
      
      const rows = estimatedRows;
      const totalCircles = rows * columns;
      
      // Update grid dimensions
      setGridDimensions({ rows, columns, totalCircles });
      
      // Draw circles
      drawCircles(ctx, canvas, adjustedCircleSize, spacing, rows, columns);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const { columns, totalCircles } = gridDimensions;
      
      // Use same spacing and size calculations as in drawCircles
      const spacing = 10; 
      const startX = spacing;
      const startY = spacing;
      
      // Adjust circle size to match drawCircles function
      const adjustedCellWidth = (canvas.width - (spacing * 2)) / columns;
      const adjustedCircleSize = adjustedCellWidth - spacing;
      
      let hovered = null;
      
      for (let i = 0; i < totalCircles; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        
        // Calculate center position of each circle (same as in drawCircles)
        const circleX = startX + col * (adjustedCircleSize + spacing) + adjustedCircleSize / 2;
        const circleY = startY + row * (adjustedCircleSize + spacing) + adjustedCircleSize / 2;
        
        const distance = Math.sqrt(Math.pow(x - circleX, 2) + Math.pow(y - circleY, 2));
        
        if (distance <= adjustedCircleSize / 2) {
          hovered = i;
          break;
        }
      }
      
      if (hovered !== hoveredCircle) {
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
  }, [drawCircles]); // Only depend on the drawCircles function

  // Redraw when hover state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { rows, columns } = gridDimensions;
    
    // Use same spacing and size calculations
    const spacing = 10;
    
    // Adjust circle size to ensure they fill the full width
    const adjustedCellWidth = (canvas.width - (spacing * 2)) / columns;
    const adjustedCircleSize = adjustedCellWidth - spacing;
    
    // Draw circles with current state
    drawCircles(ctx, canvas, adjustedCircleSize, spacing, rows, columns);
    
  }, [hoveredCircle, gridDimensions, drawCircles]);

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="w-screen overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full"
        style={{ 
          display: 'block', 
          margin: 0, 
          padding: 0,
          position: 'relative',
          left: 0
        }}
      />
    </section>
  );
};

export default Grid;
