import { PrismicPreview } from "@prismicio/next";
import { repositoryName } from "@/prismicio";
import Background from "@/components/Background";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Background />
      </body>
      <PrismicPreview repositoryName={repositoryName} />
    </html>
  );
}
