import { Content } from "@prismicio/client";
import Navigation from "./Navigation";
import Logo from "./Logo";
import Socials from "./Socials";
import BottomText from "./BottomText";

type FooterProps = {
  data: Content.HeaderDocumentData;
};

export default function Footer({ data }: FooterProps) {
  return (
    <footer>
      <div>
        <Logo logo={data.logo} />
        
        <Navigation 
          links={data.navigation_footer.map(link => ({
            text: link.text || '',
            link: link
          }))} 
        />

        <Socials socials={data.socials} />

        <BottomText text={data.footer_bottom_line} />
      </div>
    </footer>
  );
}
