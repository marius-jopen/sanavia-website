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
    <section>
      <div>
        <div>
          {slice.primary.headline}
        </div>

        <div>
          {slice.primary.button_text}
        </div>
      </div>

      <div>
        <PrismicRichText field={slice.primary.rich_text} />
      </div>
    </section>
  );
};

export default PopText;
