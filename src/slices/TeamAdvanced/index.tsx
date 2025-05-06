import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `TeamAdvanced`.
 */
export type TeamAdvancedProps = SliceComponentProps<Content.TeamAdvancedSlice>;

/**
 * Component for "TeamAdvanced" Slices.
 */
const TeamAdvanced: FC<TeamAdvancedProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for team_advanced (variation: {slice.variation})
      Slices
    </section>
  );
};

export default TeamAdvanced;
