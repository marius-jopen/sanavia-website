"use client"
import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import VideoBasic from "@/components/VideoBasic";

/**
 * Props for `Team`.
 */
export type TeamProps = SliceComponentProps<Content.TeamSlice>;

/**
 * Component for "Team" Slices.
 */
const Team: FC<TeamProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-6"
    >
      <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {slice.primary.items?.map((item, index) => {
            const isFirstInRow = index % 4 === 0; // Since we have 4 columns in lg breakpoint
            return (
              <div 
                key={index} 
                className={`flex flex-col bg-white px-4 py-4 text-center ${
                  isFirstInRow ? 'pl-6 rounded-l-0 rounded-r-2xl' : 'rounded-2xl '
                }`}
              >
                <div className="overflow-hidden rounded-2xl aspect-[4/3] mb-4">
                  <VideoBasic
                    url={item.video_url || undefined}
                    poster={item.image}
                  />
                </div>
                {item.headline && (
                  <h3 className="pt-2 pb-2 text-xl font-bold mb-2">{item.headline}</h3>
                )}
                {item.richtext && (
                  <div className="px-12 text-sm text-gray-500">
                    <PrismicRichText field={item.richtext} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Team;
