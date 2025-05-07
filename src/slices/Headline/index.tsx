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
  const alignment = slice.primary.alignment === 'left' ? 'text-left' : 'text-center';
  const headlineWidth = alignment === 'text-left' ? 'w-11/12 md:w-7/12' : 'w-8/12 mx-auto ';
  const subHeadlineWidth = alignment === 'text-left' ? 'w-11/12 md:w-7/12' : 'w-8/12 md:w-4/12 mx-auto ';
  
  return (
    <section className={`${alignment} pt-4 pb-4 px-8`}>
      <div className={`mb-8 ${headlineWidth} text-gray-800`}>
        <PrismicRichText field={slice.primary.headline} />
      </div>

      <div className={`${subHeadlineWidth} text-gray-500`}>
        <PrismicRichText field={slice.primary.sub_headline} />
      </div>
    </section>
  );
};

export default Headline;
