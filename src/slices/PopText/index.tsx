"use client"
import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import ExpandableSection from "@/components/ExpandableSection";
import HeadlineBox from "@/components/HeadlineBox";
import ToggleButton from "@/components/ToggleButton";

/**
 * Props for `PopText`.
 */
export type PopTextProps = SliceComponentProps<Content.PopTextSlice>;

/**
 * Component for "PopText" Slices.
 */
const PopText: FC<PopTextProps> = ({ slice }) => {
  // Convert KeyTextField to string
  const buttonText = slice.primary.button_text?.toString() || '';

  return (
    <ExpandableSection
      headerContent={
        <>
          <HeadlineBox>
            {slice.primary.headline}
          </HeadlineBox>
          <ToggleButton buttonText={buttonText} />
        </>
      }
    >
      <PrismicRichText field={slice.primary.rich_text} />
    </ExpandableSection>
  );
};

export default PopText;