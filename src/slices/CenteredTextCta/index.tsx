import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `CenteredTextCta`.
 */
export type CenteredTextCtaProps =
  SliceComponentProps<Content.CenteredTextCtaSlice>;

/**
 * Component for "CenteredTextCta" Slices.
 */
const CenteredTextCta: FC<CenteredTextCtaProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for centered_text_cta (variation: {slice.variation})
      Slices
    </section>
  );
};

export default CenteredTextCta;
