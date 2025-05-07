import { Content } from "@prismicio/client";
import { PrismicNextImage, PrismicNextLink } from "@prismicio/next";

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
        
        <nav>
          {data.navigation_footer.map((link, index) => (
            <PrismicNextLink key={index} field={link} >
              {link.text}
            </PrismicNextLink>
          ))}
        </nav>

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
