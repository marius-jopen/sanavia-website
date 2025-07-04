import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `Space`.
 */
export type SpaceProps = SliceComponentProps<Content.SpaceSlice>;

/**
 * Valid height size options
 */
type HeightSize = "xs" | "s" | "m" | "lg" | "xl" | "2xl";

/**
 * Height mapping for individual sizes using Tailwind classes
 */
const heightMap: Record<HeightSize, string> = {
  "xs": "h-2",
  "s": "h-4", 
  "m": "h-8",
  "lg": "h-16",
  "xl": "h-24",
  "2xl": "h-32",
};

/**
 * Desktop height mapping using Tailwind classes
 */
const desktopHeightMap: Record<HeightSize, string> = {
  "xs": "md:h-8",
  "s": "md:h-16", 
  "m": "md:h-24",
  "lg": "md:h-32",
  "xl": "md:h-52",
  "2xl": "md:h-64",
};

/**
 * Component for "Space" Slices.
 */
const Space: FC<SpaceProps> = ({ slice }) => {
  const height = (slice.primary.height as HeightSize) || "m";
  const heightMobile = (slice.primary as { height_mobile?: string }).height_mobile as HeightSize || height;
  
  const mobileClasses = heightMap[heightMobile] || heightMap["m"];
  const desktopClasses = desktopHeightMap[height] || desktopHeightMap["m"];
  
  const heightClasses = `${mobileClasses} ${desktopClasses}`;

  // Early return if not visible
  if (!((slice.primary as any).visible ?? true)) return null;


  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className={`w-full ${heightClasses}`}
    />
  );
};

export default Space;
