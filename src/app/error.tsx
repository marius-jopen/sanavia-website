'use client';

import { useEffect } from 'react';
import { SliceZone } from "@prismicio/react";

import { createClient } from "@/prismicio";
import { components } from "@/slices";
import { SliceComponentProps } from "@prismicio/react";
import { Content } from "@prismicio/client";
import { useState } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [errorPageData, setErrorPageData] = useState<{
    page: Content.PageDocument;
    settings: Content.HeaderDocument;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.error(error);
    
    // Fetch the error page from Prismic
    const fetchErrorPage = async () => {
      try {
        const client = createClient();
        const page = await client.getByUID("page", "error");
        const settings = await client.getSingle("header");
        
        setErrorPageData({ page, settings });
      } catch (err) {
        console.error("Failed to fetch error page from Prismic:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchErrorPage();
  }, [error]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  if (errorPageData) {
    // Create enhanced components that include settings data
    const enhancedComponents = {
      ...components,
      grid: (props: SliceComponentProps<Content.GridSlice>) => {
        const GridComponent = components.grid;
        return <GridComponent {...props} settings={errorPageData.settings.data} />;
      }
    };

    return <SliceZone slices={errorPageData.page.data.slices} components={enhancedComponents} />;
  }

  // Fallback error page if Prismic fetch fails
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-6xl font-bold text-black mb-4">Oops!</h1>
        <h2 className="text-3xl font-semibold text-black mb-4">Something went wrong</h2>
        <p className="text-gray-600 text-lg mb-8">
          We&apos;re sorry, but something unexpected happened. Please try again.
        </p>
        <button
          onClick={reset}
          className="text-white bg-black rounded-full px-8 py-3 hover:bg-gray-800 transition-all duration-200 text-lg font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
} 