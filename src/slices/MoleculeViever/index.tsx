import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `MoleculeViever`.
 */
export type MoleculeVieverProps =
  SliceComponentProps<Content.MoleculeVieverSlice>;

/**
 * Component for "MoleculeViever" Slices.
 */
const MoleculeViever: FC<MoleculeVieverProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for molecule_viever (variation: {slice.variation})
      Slices
    </section>
  );
};

export default MoleculeViever;
