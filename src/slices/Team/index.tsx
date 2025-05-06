import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

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
    >
      Placeholder component for team (variation: {slice.variation}) Slices
    </section>
  );
};

export default Team;
