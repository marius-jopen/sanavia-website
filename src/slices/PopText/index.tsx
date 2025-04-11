import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";

/**
 * Props for `PopText`.
 */
export type PopTextProps = SliceComponentProps<Content.PopTextSlice>;

/**
 * Component for "PopText" Slices.
 */
const PopText: FC<PopTextProps> = ({ slice }) => {
  return (
    <section className="mb-12">
      <div className="flex">
        <div className="bg-white rounded-r-4xl px-8 py-6">
          {slice.primary.headline}
        </div>

        <div className="bg-white rounded-4xl px-8 py-6">
          {slice.primary.button_text}
        </div>
      </div>

      <div className="bg-white rounded-r-4xl px-8 py-6 w-10/12">
        <PrismicRichText field={slice.primary.rich_text} />
      </div>
    </section>
  );
};

export default PopText;
