import React from "react";

export interface SelectedObjectInfo {
  name: string;
  type: string;
  uuid: string;
  parentName: string;
  position: { x: string; y: string; z: string };
  materialName: string;
  materialType: string;
  vertexCount: number;
  triangleCount: number;
  userData: Record<string, unknown>;
}

export interface MeshAnnotation {
  meshName: string;
  title: string;
  content: React.ReactNode;
  color?: string;
}

export const FALLBACK_PALETTE = ["#bdd1ff", "#bdfffe", "#ffa34d"];

export type AnimationMode = "ramp" | "boomerang" | "sinus" | "triangle";

export interface ModelViewerProps {
  modelUrl: string;
  autoplay?: boolean;
  autoRotate?: boolean;
  backgroundColor?: string;
  transparentBackground?: boolean;
  ambientLightIntensity?: number;
  ambientLightColor?: string;
  directLightIntensity?: number;
  directLightColor?: string;
  exposure?: number;
  enableZoom?: boolean;
  simpleMaterials?: boolean;
  highlightColor?: string;
  animationMode?: AnimationMode;
  animationSpeed?: number;
  showControls?: boolean;
  devMode?: boolean;
  annotations?: MeshAnnotation[];
  className?: string;
}
