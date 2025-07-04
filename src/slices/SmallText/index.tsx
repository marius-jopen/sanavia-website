import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";

// Helper type to add visible field to slice primary
type WithVisible<T> = T & { visible?: boolean };

/**
 * Props for `SmallText`.
 */
export type SmallTextProps = SliceComponentProps<Content.SmallTextSlice>;

/**
 * Component for "SmallText" Slices.
 */
const SmallText: FC<SmallTextProps> = ({ slice }) => {

  // Early return if not visible
  if (!((slice.primary as WithVisible<typeof slice.primary>).visible ?? true)) return null;


  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <div className="mx-auto max-w-screen-sm">
        <PrismicRichText field={slice.primary.richtext} />
      </div>
    </section>
  );
};

export default SmallText;
