"use client"
import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import ExpandableSection from "@/components/ExpandableSection";
import HeadlineBox from "@/components/HeadlineBox";
import ToggleButton from "@/components/ToggleButton";
import { PrismicNextImage } from "@prismicio/next";

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
      mobileHeadlineClickable={true}
      headerContent={
        <>
          <HeadlineBox>
            {slice.primary.headline}
          </HeadlineBox>
          <div className="md:block hidden">
            <ToggleButton buttonText={buttonText} />
          </div>
        </>
      }
    >
      <div className="text-gray-800">

        {slice.primary.image.url && (
          <div className="mb-6">
            <PrismicNextImage className="w-full rounded-xl" field={slice.primary.image} />
          </div>
        )}

        <div className="md:w-10/12">
          <PrismicRichText field={slice.primary.rich_text} />
        </div>
      </div>
    </ExpandableSection>
  );
};

export default PopText;