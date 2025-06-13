import { Metadata } from "next";
import { SliceZone } from "@prismicio/react";
import { asText } from "@prismicio/client";

import { createClient } from "@/prismicio";
import { components } from "@/slices";
import { SliceComponentProps } from "@prismicio/react";
import { Content } from "@prismicio/client";

export default async function NotFound() {
  const client = createClient();
  
  try {
    const page = await client.getByUID("page", "error");
    
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
    return <SliceZone slices={page.data.slices} components={enhancedComponents} />;
  } catch (error) {
    // Fallback in case the error page doesn't exist in Prismic
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-9xl font-bold text-black mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-black mb-4">Page Not Found</h2>
          <p className="text-gray-600 text-lg mb-8">
            Sorry, the page you are looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  
  try {
    const page = await client.getByUID("page", "error");
    
    return {
      title: asText(page.data.title) || "404 - Page Not Found",
      description: page.data.meta_description || "The page you are looking for could not be found.",
      openGraph: {
        title: page.data.meta_title ?? undefined,
        images: [{ url: page.data.meta_image.url ?? "" }],
      },
    };
  } catch (error) {
    return {
      title: "404 - Page Not Found",
      description: "The page you are looking for could not be found.",
    };
  }
} 