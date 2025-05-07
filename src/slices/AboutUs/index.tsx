import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `AboutUs`.
 */
export type AboutUsProps = SliceComponentProps<Content.AboutUsSlice>;

/**
 * Component for "AboutUs" Slices.
 */
const AboutUs: FC<AboutUsProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for about_us (variation: {slice.variation}) Slices
    </section>
  );
};

export default AboutUs;
