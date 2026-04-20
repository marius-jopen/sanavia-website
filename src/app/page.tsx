import { type Metadata } from "next";

import { asText } from "@prismicio/client";
import { SliceZone } from "@prismicio/react";

import { createClient } from "@/prismicio";
import { components } from "@/slices";
import { SliceComponentProps } from "@prismicio/react";
import { Content } from "@prismicio/client";

export default async function Home() {
  const client = createClient();
  const home = await client.getByUID("page", "home");

  // Fetch settings data for components that need it (like Grid)
  const settings = await client.getSingle("header");

  // Create enhanced components that include settings data
  const enhancedComponents = {
    ...components,
    grid: (props: SliceComponentProps<Content.GridSlice>) => {
      const GridComponent = components.grid;
      return <GridComponent {...props} settings={settings.data} />;
    }
  };

  const pageHeading = asText(home.data.title) || home.data.meta_title || "Sanavia";

  return (
    <>
      <h1 className="sr-only">{pageHeading}</h1>
      <SliceZone slices={home.data.slices} components={enhancedComponents} />
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const home = await client.getByUID("page", "home");
  const pageTitle = asText(home.data.title);
  const seoTitle = home.data.meta_title || pageTitle || undefined;
  const ogImage = home.data.meta_image.url;

  return {
    title: seoTitle,
    description: home.data.meta_description || undefined,
    alternates: { canonical: "/" },
    openGraph: {
      title: seoTitle,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}
