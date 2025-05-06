import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `Space`.
 */
export type SpaceProps = SliceComponentProps<Content.SpaceSlice>;

/**
 * Component for "Space" Slices.
 */
const Space: FC<SpaceProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for space (variation: {slice.variation}) Slices
    </section>
  );
};

export default Space;
