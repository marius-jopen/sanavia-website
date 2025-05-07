import { Content } from "@prismicio/client";
import { PrismicNextImage, PrismicNextLink } from "@prismicio/next";

type HeaderProps = {
  data: Content.HeaderDocumentData;
};

export default function Header({ data }: HeaderProps) {
  return (
    <header>
      <div>
        {data.logo && (
          <PrismicNextImage field={data.logo} fallbackAlt="" />
        )}

        <nav>
          {data.navigation_header.map((link, index) => (
            <PrismicNextLink key={index} field={link} >
              {link.text}
            </PrismicNextLink>
          ))}
        </nav>

        {data.cta && (
            <PrismicNextLink field={data.cta} >
                {data.cta.text}
            </PrismicNextLink>
        )}
      </div>
    </header>
  );
}
