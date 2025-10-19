import { FC } from "react";
import Script from "next/script";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `Contact`.
 */
export type ContactProps = SliceComponentProps<Content.ContactSlice>;

/**
 * Component for "Contact" Slices.
 */
const Contact: FC<ContactProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <Script
        src="https://js.hsforms.net/forms/embed/50539793.js"
        strategy="afterInteractive"
      />
      <div
        className="hs-form-frame"
        data-region="na1"
        data-form-id="d9c97177-bfda-4828-bd3b-ef6a4bd23ada"
        data-portal-id="50539793"
      />
    </section>
  );
};

export default Contact;
