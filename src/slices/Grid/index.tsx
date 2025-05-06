import { FC } from "react";
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
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for grid (variation: {slice.variation}) Slices
    </section>
  );
};

export default Grid;
