import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `Space`.
 */
export type SpaceProps = SliceComponentProps<Content.SpaceSlice>;

/**
 * Height mapping for different sizes
 */
const heightMap = {
  xs: { desktop: "h-8", mobile: "h-4" },
  s: { desktop: "h-16", mobile: "h-8" },
  m: { desktop: "h-24", mobile: "h-8" },
  lg: { desktop: "h-32", mobile: "h-12" },
  xl: { desktop: "h-48", mobile: "h-12" },
  "2xl": { desktop: "h-64", mobile: "h-16" },
};

/**
 * Component for "Space" Slices.
 */
const Space: FC<SpaceProps> = ({ slice }) => {
  const height = slice.primary.height || "m";
  const { desktop, mobile } = heightMap[height];

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className={`w-full ${mobile} md:${desktop}`}
    />
  );
};

export default Space;
