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
      className="w-full h-full flex items-center justify-center"
    >
      <div className="grid grid-cols-5 md:grid-cols-20 gap-4 md:gap-4 px-8 w-full">
        {Array.from({ length: 140 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-full bg-white w-full transition-transform duration-200 hover:scale-110"
          />
        ))}
      </div>
    </section>
  );
};

export default Grid;
