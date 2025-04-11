import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps, PrismicRichText } from "@prismicio/react";
/**
 * Props for `Headline`.
 */
export type HeadlineProps = SliceComponentProps<Content.HeadlineSlice>;

/**
 * Component for "Headline" Slices.
 */
const Headline: FC<HeadlineProps> = ({ slice }) => {
  return (
    <section className="text-center pt-24 pb-24">
      <div className="mb-8 w-7/12 mx-auto text-gray-800">
        <PrismicRichText field={slice.primary.headline} />
      </div>

      <div className="w-4/12 mx-auto text-gray-500">
        <PrismicRichText field={slice.primary.sub_headline} />
      </div>
    </section>
  );
};

export default Headline;
