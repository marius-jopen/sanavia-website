import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `Space`.
 */
export type SpaceProps = SliceComponentProps<Content.SpaceSlice>;

/**
 * Height mapping for different sizes using Tailwind responsive classes
 */
const heightMap = {
  "xs": "h-2 md:h-8",
  "s": "h-2 md:h-16", 
  "m": "h-2 md:h-24",
  "lg": "h-4 md:h-32",
  "xl": "h-24 md:h-52",
  "2xl": "h-40 md:h-64",
};

/**
 * Component for "Space" Slices.
 */
const Space: FC<SpaceProps> = ({ slice }) => {
  const height = slice.primary.height || "m";
  const heightClasses = heightMap[height];

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className={`w-full ${heightClasses}`}
    />
  );
};

export default Space;
