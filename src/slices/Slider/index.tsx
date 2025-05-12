import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import Slider from "@/components/Slider";

/**
 * Props for `Slider`.
 */
export type SliderProps = SliceComponentProps<Content.SliderSlice>;

/**
 * Component for "Slider" Slices.
 */
const SliderSlice: FC<SliderProps> = ({ slice }) => {
  // Pass the complete Prismic image field
  const images = slice.primary.items.map((item) => item.image);

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-8"
    >
      <Slider images={images} />
    </section>
  );
};

export default SliderSlice;
