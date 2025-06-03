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

  // <SliceZone> renders the page's slices with enhanced components
  return <SliceZone slices={home.data.slices} components={enhancedComponents} />;
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const home = await client.getByUID("page", "home");

  return {
    title: asText(home.data.title),
    description: home.data.meta_description,
    openGraph: {
      title: home.data.meta_title ?? undefined,
      images: [{ url: home.data.meta_image.url ?? "" }],
    },
  };
}
