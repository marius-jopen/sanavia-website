import { Content } from "@prismicio/client";
import { PrismicNextImage, PrismicNextLink } from "@prismicio/next";
import Navigation from "./Navigation";

type FooterProps = {
  data: Content.HeaderDocumentData;
};

export default function Footer({ data }: FooterProps) {
  return (
    <footer>
      <div>
        {data.logo && (
            <PrismicNextImage field={data.logo} fallbackAlt="" />
        )}
        
        <Navigation links={data.navigation_footer} variant="footer" />

        <div>
          {data.socials.map((item, index) => (
            <PrismicNextLink key={index} field={item.link} >
              {item.icon && (
                <PrismicNextImage field={item.icon} fallbackAlt="" />
              )}
            </PrismicNextLink>
          ))}
        </div>

        {data.footer_bottom_line && (
          <div>
            {data.footer_bottom_line}
          </div>
        )}
      </div>
    </footer>
  );
}
