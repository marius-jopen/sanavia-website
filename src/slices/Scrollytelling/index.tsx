import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `Scrollytelling`.
 */
export type ScrollytellingProps =
  SliceComponentProps<Content.ScrollytellingSlice>;

/**
 * Component for "Scrollytelling" Slices.
 */
const Scrollytelling: FC<ScrollytellingProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for scrollytelling (variation: {slice.variation})
      Slices
    </section>
  );
};

export default Scrollytelling;
