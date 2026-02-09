"use client";

import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import dynamic from "next/dynamic";
import { setupFadeInAnimation } from "../../utils/animations/intersectionAnimations";
import type { MeshAnnotation } from "../../components/ModelViewer";

// Dynamic import with SSR disabled — Three.js requires the browser
const ModelViewer = dynamic(() => import("../../components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full flex items-center justify-center bg-[#191919] rounded-2xl"
      style={{ aspectRatio: "16 / 9" }}
    >
      <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  ),
});

// Helper type to add visible field to slice primary
type WithVisible<T> = T & { visible?: boolean };

/**
 * Props for `MoleculeViever`.
 */
export type MoleculeVieverProps =
  SliceComponentProps<Content.MoleculeVieverSlice>;

/**
 * Component for "MoleculeViever" Slices.
 *
 * Renders a 3D glTF/glb model viewer with orbit controls,
 * animation playback (play / pause / stop), and configurable lighting.
 */
const MoleculeViever: FC<MoleculeVieverProps> = ({ slice }) => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const cleanup = setupFadeInAnimation(sectionRef.current);
    return cleanup;
  }, []);

  // Early return if not visible
  if (!((slice.primary as WithVisible<typeof slice.primary>).visible ?? true))
    return null;

  // Read CMS fields with sensible fallbacks
  const primary = slice.primary as Record<string, unknown>;
  // Prefer uploaded media file, fall back to text URL
  const modelFile = primary.model_file as { url?: string } | undefined;
  const modelUrl = modelFile?.url || (primary.model_url as string) || "";
  const autoplay = (primary.autoplay as boolean) ?? true;
  const autoRotate = (primary.auto_rotate as boolean) ?? false;
  const bgColor = (primary.background_color as string) || "#191919";
  const enableZoom = (primary.enable_zoom as boolean) ?? true;
  const showControls = (primary.show_controls as boolean) ?? true;
  const devModeEnabled = (primary.dev_mode as boolean) ?? false;

  // Build annotation map from repeater items
  const items = (slice.items ?? []) as Array<Record<string, unknown>>;
  const annotations: MeshAnnotation[] = items
    .filter((item) => item.mesh_name)
    .map((item) => ({
      meshName: item.mesh_name as string,
      title: (item.info_title as string) || (item.mesh_name as string),
      content: item.info_text ? (
        <PrismicRichText field={item.info_text as Parameters<typeof PrismicRichText>[0]["field"]} />
      ) : null,
    }));

  if (!modelUrl) return null;

  return (
    <section
      ref={sectionRef}
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="w-full mb-4 px-4"
    >
      <div className="relative mx-auto md:w-full rounded-2xl overflow-hidden">
        <ModelViewer
          modelUrl={modelUrl}
          autoplay={autoplay}
          autoRotate={autoRotate}
          backgroundColor={bgColor}
          enableZoom={enableZoom}
          showControls={showControls}
          devMode={devModeEnabled}
          annotations={annotations}
          className="rounded-2xl"
        />
      </div>
    </section>
  );
};

export default MoleculeViever;
