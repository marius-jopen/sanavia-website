import { Content } from "@prismicio/client";
import { PrismicNextImage, PrismicNextLink } from "@prismicio/next";
import Navigation from "./Navigation";
import Logo from "./Logo";
import Socials from "./Socials";

type FooterProps = {
  data: Content.HeaderDocumentData;
};

export default function Footer({ data }: FooterProps) {
  return (
    <footer>
      <div>
        <Logo logo={data.logo} />
        
        <Navigation links={data.navigation_footer} />

        <Socials socials={data.socials} />

        {data.footer_bottom_line && (
          <div>
            {data.footer_bottom_line}
          </div>
        )}
      </div>
    </footer>
  );
}
