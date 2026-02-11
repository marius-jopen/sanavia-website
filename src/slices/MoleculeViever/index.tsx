"use client";

import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicRichText } from "@prismicio/react";
import dynamic from "next/dynamic";
import { setupFadeInAnimation } from "../../utils/animations/intersectionAnimations";
import type { MeshAnnotation, AnimationMode, HighlightBlendMode } from "../../components/ModelViewer";

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
  const modelFile = primary.model_file as { url?: string } | undefined;
  const modelUrl = modelFile?.url || "";
  const devModeEnabled = (primary.dev_mode as boolean) ?? false;

  // Parse the settings JSON field (pasted from Dev Mode "Copy Settings as JSON")
  let settings: Record<string, unknown> = {};
  try {
    const raw = (primary.settings_json as string) || "{}";
    console.log("[MoleculeViewer] settings_json raw value:", primary.settings_json);
    console.log("[MoleculeViewer] parsing JSON:", raw);
    settings = JSON.parse(raw);
    console.log("[MoleculeViewer] parsed settings:", settings);
  } catch (err) {
    console.warn("[MoleculeViewer] Failed to parse settings_json:", err, "| raw value:", primary.settings_json);
  }

  const autoplay = (settings.autoplay as boolean) ?? true;
  const autoRotate = (settings.autoRotate as boolean) ?? false;
  const bgColor = (settings.backgroundColor as string) || "#191919";
  const transparentBg = (settings.transparentBackground as boolean) ?? true;
  const enableZoom = (settings.enableZoom as boolean) ?? false;
  const simpleMaterialsEnabled = (settings.simpleMaterials as boolean) ?? true;
  const ambientLightIntensity = (settings.ambientLightIntensity as number) ?? undefined;
  const ambientLightColor = (settings.ambientLightColor as string) ?? undefined;
  const directLightIntensity = (settings.directLightIntensity as number) ?? undefined;
  const directLightColor = (settings.directLightColor as string) ?? undefined;
  const exposureValue = (settings.exposure as number) ?? undefined;
  const highlightColorValue = (settings.highlightColor as string) ?? undefined;
  const highlightBlendModeValue = (settings.highlightBlendMode as HighlightBlendMode) ?? undefined;
  const highlightOpacityValue = (settings.highlightOpacity as number) ?? undefined;
  const animationModeValue = (settings.animationMode as AnimationMode) ?? undefined;
  const animationSpeedValue = (settings.animationSpeed as number) ?? undefined;

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
      color: (item.mesh_color as string) || undefined,
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
          transparentBackground={transparentBg}
          enableZoom={enableZoom}
          devMode={devModeEnabled}
          simpleMaterials={simpleMaterialsEnabled}
          {...(ambientLightIntensity !== undefined && { ambientLightIntensity })}
          {...(ambientLightColor !== undefined && { ambientLightColor })}
          {...(directLightIntensity !== undefined && { directLightIntensity })}
          {...(directLightColor !== undefined && { directLightColor })}
          {...(exposureValue !== undefined && { exposure: exposureValue })}
          {...(highlightColorValue !== undefined && { highlightColor: highlightColorValue })}
          {...(highlightBlendModeValue !== undefined && { highlightBlendMode: highlightBlendModeValue })}
          {...(highlightOpacityValue !== undefined && { highlightOpacity: highlightOpacityValue })}
          {...(animationModeValue !== undefined && { animationMode: animationModeValue })}
          {...(animationSpeedValue !== undefined && { animationSpeed: animationSpeedValue })}
          annotations={annotations}
          className="rounded-2xl"
        />
      </div>
    </section>
  );
};

export default MoleculeViever;
