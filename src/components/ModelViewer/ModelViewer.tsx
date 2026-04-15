"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import type { SelectedObjectInfo, MeshAnnotation, ModelViewerProps, AnimationMode, HighlightBlendMode } from "./types";
import { FALLBACK_PALETTE } from "./types";
import { getDepth } from "./utils";
import { DevPanel } from "./DevPanel";
import { AnnotationPopup } from "./AnnotationPopup";
import { BottomControls } from "./BottomControls";
import { TopLeftElements } from "./TopLeftElements";
import { LoadingOverlay, ErrorOverlay } from "./Overlays";

const ModelViewer: React.FC<ModelViewerProps> = ({
  modelUrl,
  compareModelUrl,
  compareAnnotations = [],
  title,
  autoplay = true,
  autoRotate = true,
  backgroundColor = "#191919",
  transparentBackground = true,
  ambientLightIntensity = 1.65,
  ambientLightColor = "#FFFFFF",
  directLightIntensity = 1.5,
  directLightColor = "#FFFFFF",
  exposure = 0.5,
  enableZoom = false,
  simpleMaterials = true,
  highlightColor = "#fff700",
  highlightBlendMode = "normal",
  highlightOpacity = 1.0,
  animationMode = "ramp",
  animationSpeed = 1.0,
  showControls = true,
  devMode = false,
  annotations = [],
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Three.js object refs — persisted across renders, created in useEffect
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const frameRef = useRef<number>(0);
  const actionsRef = useRef<THREE.AnimationAction[]>([]);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const directRef = useRef<THREE.DirectionalLight | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const compareGroupRef = useRef<THREE.Group | null>(null);
  const compareMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const compareActionsRef = useRef<THREE.AnimationAction[]>([]);
  const maxCompareClipDurationRef = useRef(1);
  const dragStateRef = useRef<{ active: boolean; target: THREE.Group | null; lastX: number; lastY: number }>({ active: false, target: null, lastX: 0, lastY: 0 });
  const mirrorHighlight = useRef<{
    mesh: THREE.Mesh;
    originalEmissive: THREE.Color;
    originalColor: THREE.Color;
  } | null>(null);
  const [compareMode, setCompareMode] = useState(true);
  const compareModeRef = useRef(true);
  compareModeRef.current = compareMode;
  const isCompareRef = useRef(!!compareModelUrl);
  isCompareRef.current = !!compareModelUrl && compareMode;
  const isMobileRef = useRef(
    typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );
  const framingRef = useRef<{
    single: { modelPos: THREE.Vector3; camPos: THREE.Vector3; target: THREE.Vector3; near: number; far: number };
    compare: { modelPos: THREE.Vector3; comparePos: THREE.Vector3; camPos: THREE.Vector3; target: THREE.Vector3; near: number; far: number };
  } | null>(null);
  const isPlayingRef = useRef(autoRotate);

  // Raycasting refs
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const pointerDownPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const previousHighlight = useRef<{
    mesh: THREE.Mesh;
    originalEmissive: THREE.Color;
    originalColor: THREE.Color;
  } | null>(null);
  const hoverHighlight = useRef<{
    mesh: THREE.Mesh;
    originalEmissive: THREE.Color;
    originalColor: THREE.Color;
  } | null>(null);
  const mirrorHoverHighlight = useRef<{
    mesh: THREE.Mesh;
    originalEmissive: THREE.Color;
    originalColor: THREE.Color;
  } | null>(null);
  const suppressHoverUntil = useRef(0);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoRotate);
  isPlayingRef.current = isPlaying;
  const [hasAnimations, setHasAnimations] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Annotation popup state
  const [activeAnnotation, setActiveAnnotation] = useState<MeshAnnotation | null>(null);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const annotationRef = useRef<HTMLDivElement>(null);
  const annotationsRef = useRef<MeshAnnotation[]>(annotations);
  annotationsRef.current = annotations;
  const compareAnnotationsRef = useRef<MeshAnnotation[]>(compareAnnotations);
  compareAnnotationsRef.current = compareAnnotations;

  // Dev mode state
  const devModeRef = useRef(devMode);
  devModeRef.current = devMode;
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SelectedObjectInfo | null>(null);
  const [devBgColor, setDevBgColor] = useState(backgroundColor);
  const [devAmbientIntensity, setDevAmbientIntensity] = useState(ambientLightIntensity);
  const [devAmbientColor, setDevAmbientColor] = useState(ambientLightColor);
  const [devDirectIntensity, setDevDirectIntensity] = useState(directLightIntensity);
  const [devDirectColor, setDevDirectColor] = useState(directLightColor);
  const [devAutoRotate, setDevAutoRotate] = useState(autoRotate);
  const [devEnableZoom, setDevEnableZoom] = useState(enableZoom);
  const [devExposure, setDevExposure] = useState(exposure);
  const [devHighlightColor, setDevHighlightColor] = useState(highlightColor);
  const highlightColorRef = useRef(highlightColor);
  highlightColorRef.current = devHighlightColor;
  const [devHighlightBlend, setDevHighlightBlend] = useState<HighlightBlendMode>(highlightBlendMode);
  const highlightBlendRef = useRef<HighlightBlendMode>(highlightBlendMode);
  highlightBlendRef.current = devHighlightBlend;
  const [devHighlightOpacity, setDevHighlightOpacity] = useState(highlightOpacity);
  const highlightOpacityRef = useRef(highlightOpacity);
  highlightOpacityRef.current = devHighlightOpacity;
  const [devTransparentBg, setDevTransparentBg] = useState(transparentBackground);
  const [devSimpleMaterials, setDevSimpleMaterials] = useState(simpleMaterials);
  const originalMaterials = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());
  const [sceneGraph, setSceneGraph] = useState<string[]>([]);
  const [compareSceneGraph, setCompareSceneGraph] = useState<string[]>([]);

  // Animation dev state
  const [devAnimPlaying, setDevAnimPlaying] = useState(autoplay);
  const [devAnimMode, setDevAnimMode] = useState<AnimationMode>(animationMode);
  const [devAnimSpeed, setDevAnimSpeed] = useState(animationSpeed);
  const animModeRef = useRef<AnimationMode>(animationMode);
  animModeRef.current = devAnimMode;
  const devAnimPlayingRef = useRef(autoplay);
  devAnimPlayingRef.current = devAnimPlaying;
  const devAnimSpeedRef = useRef(animationSpeed);
  devAnimSpeedRef.current = devAnimSpeed;
  const animTimeAccum = useRef(0);
  const maxClipDurationRef = useRef(1);

  // Elements dropdown state
  const [elementsOpen, setElementsOpen] = useState(false);

  // Shake / explode state
  const [isShaken, setIsShaken] = useState(false);
  const shakeAnimatingRef = useRef(false);
  const originalTransforms = useRef<Map<string, { position: THREE.Vector3; rotation: THREE.Euler }>>(new Map());

  // ── Highlight helpers — apply/restore based on blend mode ──

  const applyHighlight = useCallback(
    (mat: THREE.MeshStandardMaterial, color: string, animated = false) => {
      const mode = highlightBlendRef.current;
      const opacity = highlightOpacityRef.current;
      const c = new THREE.Color(color);

      if (mode === "screen") {
        if (!mat.emissive) return;
        const target = new THREE.Color(c.r * opacity, c.g * opacity, c.b * opacity);
        if (animated) {
          gsap.killTweensOf(mat.emissive);
          gsap.to(mat.emissive, { r: target.r, g: target.g, b: target.b, duration: 0.4, ease: "power2.out" });
        } else {
          mat.emissive.copy(target);
        }
      } else if (mode === "normal") {
        if (!mat.color) return;
        const target = new THREE.Color().copy(mat.color).lerp(c, opacity);
        if (animated) {
          gsap.killTweensOf(mat.color);
          gsap.to(mat.color, { r: target.r, g: target.g, b: target.b, duration: 0.4, ease: "power2.out" });
        } else {
          mat.color.copy(target);
        }
      } else if (mode === "multiply") {
        if (!mat.color) return;
        const multiplied = new THREE.Color().copy(mat.color).multiply(c);
        const target = new THREE.Color().copy(mat.color).lerp(multiplied, opacity);
        if (animated) {
          gsap.killTweensOf(mat.color);
          gsap.to(mat.color, { r: target.r, g: target.g, b: target.b, duration: 0.4, ease: "power2.out" });
        } else {
          mat.color.copy(target);
        }
      } else if (mode === "difference") {
        if (!mat.color) return;
        const diff = new THREE.Color(
          Math.abs(mat.color.r - c.r),
          Math.abs(mat.color.g - c.g),
          Math.abs(mat.color.b - c.b),
        );
        const target = new THREE.Color().copy(mat.color).lerp(diff, opacity);
        if (animated) {
          gsap.killTweensOf(mat.color);
          gsap.to(mat.color, { r: target.r, g: target.g, b: target.b, duration: 0.4, ease: "power2.out" });
        } else {
          mat.color.copy(target);
        }
      }
    },
    [],
  );

  const restoreHighlight = useCallback(
    (mat: THREE.MeshStandardMaterial, origEmissive: THREE.Color, origColor: THREE.Color) => {
      if (mat.emissive) {
        gsap.killTweensOf(mat.emissive);
        mat.emissive.copy(origEmissive);
      }
      if (mat.color) {
        gsap.killTweensOf(mat.color);
        mat.color.copy(origColor);
      }
    },
    [],
  );

  const captureHighlightState = useCallback(
    (mesh: THREE.Mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      return {
        mesh,
        originalEmissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0, 0, 0),
        originalColor: mat.color ? mat.color.clone() : new THREE.Color(1, 1, 1),
      };
    },
    [],
  );

  // ── Helper: apply or revert simple materials ──
  const applySimpleMaterials = useCallback((model: THREE.Group, annotationsOverride?: MeshAnnotation[]) => {
    const shouldApply = devSimpleMaterials;
    const sourceAnnotations = annotationsOverride ?? annotationsRef.current;

    if (shouldApply) {
      // Build a map: meshName → color from annotations
      const annotationColorMap = new Map<string, string>();
      sourceAnnotations.forEach((a) => {
        if (a.color) annotationColorMap.set(a.meshName, a.color);
      });

      // Tag every node whose name matches an annotation
      const nodeColorMap = new Map<string, string>();
      model.traverse((node) => {
        if (!node.name) return;
        for (const [meshName, color] of annotationColorMap) {
          if (
            node.name === meshName ||
            node.name.startsWith(meshName) ||
            meshName.startsWith(node.name)
          ) {
            nodeColorMap.set(node.uuid, color);
            break;
          }
        }
      });

      // Fallback palette per top-level group
      let fallbackIndex = 0;
      const fallbackMap = new Map<string, string>();

      model.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;

        // Save original material(s)
        if (!originalMaterials.current.has(mesh.uuid)) {
          originalMaterials.current.set(
            mesh.uuid,
            Array.isArray(mesh.material) ? [...mesh.material] : mesh.material,
          );
        }

        // Walk up parent chain for nearest annotation color
        let assignedColor: string | undefined;
        let cur: THREE.Object3D | null = mesh;
        while (cur && cur !== model) {
          if (nodeColorMap.has(cur.uuid)) {
            assignedColor = nodeColorMap.get(cur.uuid);
            break;
          }
          cur = cur.parent;
        }

        // Fallback
        if (!assignedColor) {
          let topParent: THREE.Object3D = mesh;
          while (topParent.parent && topParent.parent !== model) {
            topParent = topParent.parent;
          }
          if (!fallbackMap.has(topParent.uuid)) {
            fallbackMap.set(
              topParent.uuid,
              FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length],
            );
            fallbackIndex++;
          }
          assignedColor = fallbackMap.get(topParent.uuid)!;
        }

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const newMats = mats.map((mat) => {
          const std = mat as THREE.MeshStandardMaterial;
          const simple = new THREE.MeshStandardMaterial({
            color: new THREE.Color(assignedColor),
            roughness: 0.35,
            metalness: 0.15,
            envMapIntensity: 1.2,
            transparent: std.transparent,
            opacity: std.opacity,
            side: std.side,
          });
          simple.name = std.name;
          return simple;
        });

        mesh.material = newMats.length === 1 ? newMats[0] : newMats;
      });
    } else {
      // Restore original materials
      model.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        const saved = originalMaterials.current.get(mesh.uuid);
        if (saved) {
          mesh.material = saved;
        }
      });
      originalMaterials.current.clear();
    }
  }, [devSimpleMaterials]);

  // ───────────────────────────────────────────────
  // Initialise Three.js scene & load model
  // ───────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = devTransparentBg ? null : new THREE.Color(devBgColor);
    sceneRef.current = scene;

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.01,
      1000,
    );
    camera.position.set(0, 1, 3);
    scene.add(camera);
    cameraRef.current = camera;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = devExposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Environment (makes PBR materials look great) ──
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment()).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // ── Controls ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = true;
    controls.enableZoom = devEnableZoom;
    controls.autoRotate = devAutoRotate;
    controls.autoRotateSpeed = 0.5;
    // In compare mode, we handle rotation per-model manually
    if (compareModelUrl) {
      controls.enableRotate = false;
      controls.autoRotate = false;
    }
    controlsRef.current = controls;

    // ── Lights ──
    const ambient = new THREE.AmbientLight(devAmbientColor, devAmbientIntensity);
    scene.add(ambient);
    ambientRef.current = ambient;

    const direct = new THREE.DirectionalLight(devDirectColor, devDirectIntensity);
    direct.position.set(0.5, 1, 0.866);
    camera.add(direct);
    directRef.current = direct;

    // ── Clock ──
    const clock = new THREE.Clock();
    clockRef.current = clock;

    // ── Raycaster (for dev mode click inspection) ──
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;

    // ── GLTF Loader (with Draco for compressed meshes) ──
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      `https://unpkg.com/three@0.${THREE.REVISION}.x/examples/jsm/libs/draco/gltf/`,
    );
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    setIsLoading(true);
    setError(null);
    let disposed = false;

    const loadGLTF = (url: string): Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }> =>
      new Promise((resolve, reject) => {
        loader.load(
          url,
          (gltf) => resolve(gltf),
          (progress) => {
            if (progress.total > 0) {
              setLoadProgress(Math.round((progress.loaded / progress.total) * 100));
            }
          },
          reject,
        );
      });

    const setupModel = (gltf: { scene: THREE.Group; animations: THREE.AnimationClip[] }, modelAnnotations: MeshAnnotation[]) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      const pivot = new THREE.Group();
      pivot.add(model);

      const names: string[] = [];
      model.traverse((node) => {
        const indent = "  ".repeat(getDepth(node, model));
        const type = (node as THREE.Mesh).isMesh ? "Mesh" : node.type;
        names.push(`${indent}${type}: "${node.name || "(unnamed)"}"`);
      });

      applySimpleMaterials(model, modelAnnotations);

      let mixer: THREE.AnimationMixer | null = null;
      let actions: THREE.AnimationAction[] = [];
      const clips = gltf.animations;
      if (clips && clips.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        actions = clips.map((clip) => mixer!.clipAction(clip));
        if (autoplay) {
          actions.forEach((a) => {
            a.loop = THREE.LoopRepeat;
            a.clampWhenFinished = false;
            a.play();
          });
        }
      }

      return { model, pivot, size, names, mixer, actions, clips };
    };

    (async () => {
      try {
        const gltf1 = await loadGLTF(modelUrl);
        if (disposed) return;
        const r1 = setupModel(gltf1, annotationsRef.current);

        scene.add(r1.pivot);
        modelGroupRef.current = r1.pivot;
        setSceneGraph(r1.names);

        if (r1.mixer) {
          mixerRef.current = r1.mixer;
          actionsRef.current = r1.actions;
          setHasAnimations(true);
          maxClipDurationRef.current = Math.max(...r1.clips.map((c) => c.duration));
          setDevAnimPlaying(autoplay);
        }

        if (compareModelUrl) {
          const gltf2 = await loadGLTF(compareModelUrl);
          if (disposed) return;
          const r2 = setupModel(gltf2, compareAnnotationsRef.current);

          scene.add(r2.pivot);
          compareGroupRef.current = r2.pivot;
          setCompareSceneGraph(r2.names);

          if (r2.mixer) {
            compareMixerRef.current = r2.mixer;
            compareActionsRef.current = r2.actions;
            maxCompareClipDurationRef.current = Math.max(...r2.clips.map((c) => c.duration));
          }

          // Position side by side (desktop) or stacked (mobile)
          const mobile = isMobileRef.current;
          const comparePosR1 = new THREE.Vector3();
          const comparePosR2 = new THREE.Vector3();
          if (mobile) {
            const gapY = -Math.max(r1.size.y, r2.size.y) * 0.08;
            comparePosR1.set(0, r1.size.y / 2 + gapY, 0);
            comparePosR2.set(0, -(r2.size.y / 2), 0);
          } else {
            const gap = Math.max(r1.size.x, r2.size.x) * 0.3;
            comparePosR1.set(-(r1.size.x / 2 + gap / 2), 0, 0);
            comparePosR2.set(r2.size.x / 2 + gap / 2, 0, 0);
          }

          // Compute compare framing
          r1.pivot.position.copy(comparePosR1);
          r2.pivot.position.copy(comparePosR2);
          const combinedBox = new THREE.Box3()
            .setFromObject(r1.pivot)
            .union(new THREE.Box3().setFromObject(r2.pivot));
          const combinedSize = combinedBox.getSize(new THREE.Vector3());
          const maxDim = Math.max(combinedSize.x, combinedSize.y, combinedSize.z);
          const fov = camera.fov * (Math.PI / 180);
          const camMultiplier = mobile ? 1.1 : 0.75;
          const cameraZ = (maxDim / (2 * Math.tan(fov / 2))) * camMultiplier;
          const compareFraming = {
            modelPos: comparePosR1.clone(),
            comparePos: comparePosR2.clone(),
            camPos: new THREE.Vector3(0, combinedSize.y * 0.05, cameraZ),
            target: new THREE.Vector3(0, 0, 0),
            near: cameraZ / 100,
            far: cameraZ * 100,
          };

          // Compute single framing (r1 at origin)
          r1.pivot.position.set(0, 0, 0);
          const singleBox = new THREE.Box3().setFromObject(r1.pivot);
          const singleSize = singleBox.getSize(new THREE.Vector3());
          const singleMaxDim = Math.max(singleSize.x, singleSize.y, singleSize.z);
          const singleCamZ = (singleMaxDim / (2 * Math.tan(fov / 2))) * 0.9;
          const singleFraming = {
            modelPos: new THREE.Vector3(0, 0, 0),
            camPos: new THREE.Vector3(0, singleSize.y * 0.15, singleCamZ),
            target: new THREE.Vector3(0, 0, 0),
            near: singleCamZ / 100,
            far: singleCamZ * 100,
          };

          framingRef.current = { single: singleFraming, compare: compareFraming };

          // Apply current compare mode
          const startInCompare = compareModeRef.current;
          const f = startInCompare ? compareFraming : singleFraming;
          r1.pivot.position.copy(f.modelPos);
          if (startInCompare) {
            r2.pivot.position.copy(compareFraming.comparePos);
            r2.pivot.visible = true;
          } else {
            r2.pivot.visible = false;
          }
          camera.position.copy(f.camPos);
          camera.near = f.near;
          camera.far = f.far;
          camera.updateProjectionMatrix();
          controls.target.copy(f.target);
          controls.enableRotate = !startInCompare;
          if (!startInCompare) controls.autoRotate = isPlayingRef.current;
          controls.update();
        } else {
          // Single model: frame camera
          const box = new THREE.Box3().setFromObject(r1.pivot);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          const cameraZ = (maxDim / (2 * Math.tan(fov / 2))) * 0.9;
          camera.position.set(0, size.y * 0.15, cameraZ);
          camera.near = cameraZ / 100;
          camera.far = cameraZ * 100;
          camera.updateProjectionMatrix();
          controls.target.set(0, 0, 0);
          controls.update();
        }

        setIsLoading(false);
      } catch (err) {
        if (disposed) return;
        console.error("Error loading 3D model:", err);
        setError("Failed to load 3D model");
        setIsLoading(false);
      }
    })();

    // ── Raycasting click handler (dev mode + annotation popups) ──
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos.current = { x: e.clientX, y: e.clientY };

      // In compare mode, detect which model to drag-rotate
      if (isCompareRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(mouse, camera);
        const targets = [modelGroupRef.current, compareGroupRef.current].filter(Boolean) as THREE.Group[];
        const allChildren = targets.flatMap((g) => [...g.children]);
        const intersects = raycaster.intersectObjects(allChildren, true);
        if (intersects.length > 0) {
          let targetGroup: THREE.Group | null = null;
          let cur: THREE.Object3D | null = intersects[0].object;
          while (cur) {
            if (cur === modelGroupRef.current || cur === compareGroupRef.current) {
              targetGroup = cur as THREE.Group;
              break;
            }
            cur = cur.parent;
          }
          dragStateRef.current = { active: true, target: targetGroup, lastX: e.clientX, lastY: e.clientY };
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      // End drag in compare mode
      if (dragStateRef.current.active) {
        dragStateRef.current = { active: false, target: null, lastX: 0, lastY: 0 };
      }

      const hasAnnotations = annotationsRef.current.length > 0 || compareAnnotationsRef.current.length > 0;
      if (!devModeRef.current && !hasAnnotations) return;

      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return; // was a drag, not a click

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );

      raycaster.setFromCamera(mouse, camera);

      const rayTargets = [modelGroupRef.current, compareGroupRef.current].filter(Boolean) as THREE.Group[];
      if (rayTargets.length === 0) return;
      const allChildren = rayTargets.flatMap((g) => [...g.children]);
      const intersects = raycaster.intersectObjects(allChildren, true);

      // Restore previous click highlights (both primary and mirror)
      if (previousHighlight.current) {
        const mat = previousHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(mat, previousHighlight.current.originalEmissive, previousHighlight.current.originalColor);
        previousHighlight.current = null;
      }
      if (mirrorHighlight.current) {
        const mMat = mirrorHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(mMat, mirrorHighlight.current.originalEmissive, mirrorHighlight.current.originalColor);
        mirrorHighlight.current = null;
      }

      // Clear hover highlights — restore their true originals first
      // so that the click highlight captures the correct base color
      if (hoverHighlight.current) {
        const hMat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(hMat, hoverHighlight.current.originalEmissive, hoverHighlight.current.originalColor);
        hoverHighlight.current = null;
      }
      if (mirrorHoverHighlight.current) {
        const mhMat = mirrorHoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(mhMat, mirrorHoverHighlight.current.originalEmissive, mirrorHoverHighlight.current.originalColor);
        mirrorHoverHighlight.current = null;
      }

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;

        // Collect ALL names from the hit mesh up through the parent chain
        const hitNames: string[] = [];
        let current: THREE.Object3D | null = hit;
        while (current && current !== modelGroupRef.current && current !== compareGroupRef.current) {
          if (current.name) hitNames.push(current.name);
          current = current.parent;
        }

        // Highlight clicked mesh
        const mat = hit.material as THREE.MeshStandardMaterial;
        previousHighlight.current = captureHighlightState(hit);
        applyHighlight(mat, highlightColorRef.current, false);

        // ── Annotation popup (always use primary annotations — mesh names are shared) ──
        if (hasAnnotations && hitNames.length > 0) {
          const match = annotationsRef.current.find((a) =>
            hitNames.some(
              (n) => n === a.meshName || n.startsWith(a.meshName) || a.meshName.startsWith(n),
            ),
          );

          setActiveAnnotation(match ?? null);

          // ── Mirror highlight: highlight same mesh on the OTHER model ──
          if (match && compareGroupRef.current && modelGroupRef.current) {
            // Determine which model was hit
            let hitGroup: THREE.Object3D | null = null;
            let walk: THREE.Object3D | null = hit;
            while (walk) {
              if (walk === modelGroupRef.current || walk === compareGroupRef.current) {
                hitGroup = walk;
                break;
              }
              walk = walk.parent;
            }
            const otherGroup = hitGroup === modelGroupRef.current ? compareGroupRef.current : modelGroupRef.current;

            // Find matching mesh in the other model
            let otherMesh: THREE.Mesh | null = null;
            otherGroup.traverse((node) => {
              if (otherMesh) return;
              let cur: THREE.Object3D | null = node;
              while (cur && cur !== otherGroup) {
                if (cur.name && (
                  cur.name === match.meshName ||
                  cur.name.startsWith(match.meshName) ||
                  match.meshName.startsWith(cur.name)
                )) {
                  // Find the first mesh inside this node
                  if ((node as THREE.Mesh).isMesh) {
                    otherMesh = node as THREE.Mesh;
                  }
                  return;
                }
                cur = cur.parent;
              }
            });

            if (otherMesh) {
              mirrorHighlight.current = captureHighlightState(otherMesh);
              applyHighlight((otherMesh as THREE.Mesh).material as THREE.MeshStandardMaterial, highlightColorRef.current, false);
            }
          }
        }

        // ── Dev mode inspector ──
        if (devModeRef.current) {
          const geo = hit.geometry;
          const vertexCount = geo?.attributes?.position?.count ?? 0;
          const indexCount = geo?.index?.count ?? 0;

          setSelectedObject({
            name: hit.name || "(unnamed)",
            type: hit.type,
            uuid: hit.uuid.slice(0, 8),
            parentName: hit.parent?.name || "(root)",
            position: {
              x: hit.position.x.toFixed(3),
              y: hit.position.y.toFixed(3),
              z: hit.position.z.toFixed(3),
            },
            materialName: mat.name || "(unnamed)",
            materialType: mat.type || "unknown",
            vertexCount,
            triangleCount: indexCount > 0 ? indexCount / 3 : vertexCount / 3,
            userData: hit.userData ?? {},
          });
        }
      } else {
        setSelectedObject(null);
        setActiveAnnotation(null);
      }
    };

    // ── Hover highlight handler (throttled) ──
    const hoverMouse = new THREE.Vector2();
    const hoverTargetColor = new THREE.Color();
    let hoverThrottleId: ReturnType<typeof setTimeout> | null = null;
    let pendingHoverEvent: PointerEvent | null = null;

    const processHover = (e: PointerEvent) => {
      // Skip hover if recently closed annotation
      if (Date.now() < suppressHoverUntil.current) {
        renderer.domElement.style.cursor = "";
        return;
      }

      const hasAnnotations = annotationsRef.current.length > 0 || compareAnnotationsRef.current.length > 0;
      if (!devModeRef.current && !hasAnnotations) {
        renderer.domElement.style.cursor = "";
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      hoverMouse.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );

      raycaster.setFromCamera(hoverMouse, camera);

      const hoverTargets = [modelGroupRef.current, compareGroupRef.current].filter(Boolean) as THREE.Group[];
      if (hoverTargets.length === 0) return;
      const hoverChildren = hoverTargets.flatMap((g) => [...g.children]);
      const intersects = raycaster.intersectObjects(hoverChildren, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;

        // Skip if already hovering this mesh or it's click-highlighted
        if (
          (hoverHighlight.current && hoverHighlight.current.mesh === hit) ||
          (previousHighlight.current && previousHighlight.current.mesh === hit)
        ) {
          renderer.domElement.style.cursor = "pointer";
          return;
        }

        // Restore previous hover + mirror hover
        if (hoverHighlight.current) {
          const prevMat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
          restoreHighlight(prevMat, hoverHighlight.current.originalEmissive, hoverHighlight.current.originalColor);
          hoverHighlight.current = null;
        }
        if (mirrorHoverHighlight.current) {
          const mhMat = mirrorHoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
          restoreHighlight(mhMat, mirrorHoverHighlight.current.originalEmissive, mirrorHoverHighlight.current.originalColor);
          mirrorHoverHighlight.current = null;
        }

        // Apply hover highlight (animated)
        const mat = hit.material as THREE.MeshStandardMaterial;
        hoverHighlight.current = captureHighlightState(hit);
        applyHighlight(mat, highlightColorRef.current, true);

        // Mirror hover: find matching mesh on the other model
        if (isCompareRef.current && compareGroupRef.current && modelGroupRef.current) {
          // Determine which model was hovered
          let hitGroup: THREE.Object3D | null = null;
          let walk: THREE.Object3D | null = hit;
          while (walk) {
            if (walk === modelGroupRef.current || walk === compareGroupRef.current) {
              hitGroup = walk; break;
            }
            walk = walk.parent;
          }
          const otherGroup = hitGroup === modelGroupRef.current ? compareGroupRef.current : modelGroupRef.current;

          // Collect names from hit through parent chain
          const hitNames: string[] = [];
          let cur: THREE.Object3D | null = hit;
          while (cur && cur !== hitGroup) {
            if (cur.name) hitNames.push(cur.name);
            cur = cur.parent;
          }

          // Find matching annotation by name
          const matchAnn = annotationsRef.current.find((a) =>
            hitNames.some((n) => n === a.meshName || n.startsWith(a.meshName) || a.meshName.startsWith(n))
          );

          if (matchAnn) {
            let otherMesh: THREE.Mesh | null = null;
            otherGroup.traverse((node) => {
              if (otherMesh) return;
              let c: THREE.Object3D | null = node;
              while (c && c !== otherGroup) {
                if (c.name && (c.name === matchAnn.meshName || c.name.startsWith(matchAnn.meshName) || matchAnn.meshName.startsWith(c.name))) {
                  if ((node as THREE.Mesh).isMesh) otherMesh = node as THREE.Mesh;
                  return;
                }
                c = c.parent;
              }
            });
            if (otherMesh && otherMesh !== previousHighlight.current?.mesh && otherMesh !== mirrorHighlight.current?.mesh) {
              mirrorHoverHighlight.current = captureHighlightState(otherMesh);
              applyHighlight((otherMesh as THREE.Mesh).material as THREE.MeshStandardMaterial, highlightColorRef.current, true);
            }
          }
        }

        renderer.domElement.style.cursor = "pointer";
      } else {
        // Restore hover highlight + mirror hover
        if (hoverHighlight.current) {
          const prevMat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
          restoreHighlight(prevMat, hoverHighlight.current.originalEmissive, hoverHighlight.current.originalColor);
          hoverHighlight.current = null;
        }
        if (mirrorHoverHighlight.current) {
          const mhMat = mirrorHoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
          restoreHighlight(mhMat, mirrorHoverHighlight.current.originalEmissive, mirrorHoverHighlight.current.originalColor);
          mirrorHoverHighlight.current = null;
        }
        renderer.domElement.style.cursor = "";
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      // Handle drag rotation in compare mode (quaternion-based for full 360°)
      if (dragStateRef.current.active && dragStateRef.current.target) {
        const deltaX = e.clientX - dragStateRef.current.lastX;
        const deltaY = e.clientY - dragStateRef.current.lastY;
        const target = dragStateRef.current.target;
        const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaX * 0.01);
        const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaY * 0.01);
        target.quaternion.premultiply(qX).premultiply(qY);
        dragStateRef.current.lastX = e.clientX;
        dragStateRef.current.lastY = e.clientY;
        return;
      }

      pendingHoverEvent = e;
      if (hoverThrottleId !== null) return;
      hoverThrottleId = setTimeout(() => {
        hoverThrottleId = null;
        if (pendingHoverEvent) {
          processHover(pendingHoverEvent);
          pendingHoverEvent = null;
        }
      }, 60);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointermove", onPointerMove);

    // ── Sync GSAP with our render loop so tweens update even without autoRotate ──
    gsap.ticker.remove(gsap.updateRoot);

    // ── Render loop ──
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      gsap.updateRoot(performance.now() / 1000);
      const delta = clock.getDelta();

      if (mixerRef.current) {
        const speed = devAnimSpeedRef.current;
        const mode = animModeRef.current;

        if (mode !== "ramp" && devAnimPlayingRef.current) {
          // Custom animation mode — manually control time
          animTimeAccum.current += delta * speed;
          const duration = maxClipDurationRef.current || 1;
          const t = animTimeAccum.current;
          let mappedTime: number;

          switch (mode) {
            case "boomerang": {
              const phase = (t % (duration * 2)) / duration;
              const linear = phase <= 1 ? phase : 2 - phase;
              mappedTime = (3 * linear * linear - 2 * linear * linear * linear) * duration;
              break;
            }
            case "sinus": {
              mappedTime =
                ((Math.sin((t / duration) * Math.PI * 2 - Math.PI / 2) + 1) / 2) * duration;
              break;
            }
            case "triangle": {
              const triPhase = (t % (duration * 2)) / duration;
              mappedTime = (triPhase <= 1 ? triPhase : 2 - triPhase) * duration;
              break;
            }
            default:
              mappedTime = t % duration;
          }

          mixerRef.current.setTime(mappedTime);
        } else {
          // Normal ramp playback — pausing is handled via action.paused
          mixerRef.current.update(delta * speed);
        }
      }

      // ── Compare mode: per-model auto-rotation + compare mixer ──
      if (isCompareRef.current) {
        const rotSpeed = ((2 * Math.PI) / 60) * 0.5 * delta;
        const autoRotQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotSpeed);
        if (modelGroupRef.current && !(dragStateRef.current.active && dragStateRef.current.target === modelGroupRef.current)) {
          modelGroupRef.current.quaternion.premultiply(autoRotQ);
        }
        if (compareGroupRef.current && !(dragStateRef.current.active && dragStateRef.current.target === compareGroupRef.current)) {
          compareGroupRef.current.quaternion.premultiply(autoRotQ);
        }

        if (compareMixerRef.current) {
          const speed = devAnimSpeedRef.current;
          const mode = animModeRef.current;
          if (mode !== "ramp" && devAnimPlayingRef.current) {
            const duration = maxCompareClipDurationRef.current || 1;
            const t = animTimeAccum.current;
            let mappedTime: number;
            switch (mode) {
              case "boomerang": {
                const phase = (t % (duration * 2)) / duration;
                const linear = phase <= 1 ? phase : 2 - phase;
                mappedTime = (3 * linear * linear - 2 * linear * linear * linear) * duration;
                break;
              }
              case "sinus":
                mappedTime = ((Math.sin((t / duration) * Math.PI * 2 - Math.PI / 2) + 1) / 2) * duration;
                break;
              case "triangle": {
                const triPhase = (t % (duration * 2)) / duration;
                mappedTime = (triPhase <= 1 ? triPhase : 2 - triPhase) * duration;
                break;
              }
              default:
                mappedTime = t % duration;
            }
            compareMixerRef.current.setTime(mappedTime);
          } else {
            compareMixerRef.current.update(delta * speed);
          }
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    clock.start();
    animate();

    // ── Responsive resize ──
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // ── Cleanup ──
    return () => {
      disposed = true;
      resizeObserver.disconnect();
      cancelAnimationFrame(frameRef.current);
      gsap.ticker.add(gsap.updateRoot); // restore GSAP's default ticker
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      if (hoverThrottleId !== null) clearTimeout(hoverThrottleId);
      controls.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      const disposeGroup = (group: THREE.Group | null) => {
        if (!group) return;
        group.traverse((node) => {
          const mesh = node as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => m.dispose());
          }
        });
      };
      disposeGroup(modelGroupRef.current);
      disposeGroup(compareGroupRef.current);
      compareGroupRef.current = null;
      compareMixerRef.current = null;
      compareActionsRef.current = [];

      dracoLoader.dispose();
      envTexture.dispose();
    };
    // Re-initialise only when the model URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl, compareModelUrl]);

  // ── Reactive updates (dev state is always the source of truth) ──

  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.intensity = devAmbientIntensity;
      ambientRef.current.color.set(devAmbientColor);
    }
    if (directRef.current) {
      directRef.current.intensity = devDirectIntensity;
      directRef.current.color.set(devDirectColor);
    }
  }, [devAmbientIntensity, devAmbientColor, devDirectIntensity, devDirectColor]);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (devTransparentBg) {
      sceneRef.current.background = null;
    } else {
      sceneRef.current.background = new THREE.Color(devBgColor);
    }
  }, [devBgColor, devTransparentBg]);

  useEffect(() => {
    if (controlsRef.current && !isCompareRef.current) controlsRef.current.autoRotate = devAutoRotate;
  }, [devAutoRotate]);

  useEffect(() => {
    if (!compareModelUrl) return;
    const f = framingRef.current;
    const cam = cameraRef.current;
    const controls = controlsRef.current;
    const model = modelGroupRef.current;
    const compare = compareGroupRef.current;
    if (!f || !cam || !controls || !model || !compare) return;
    if (compareMode) {
      model.position.copy(f.compare.modelPos);
      compare.position.copy(f.compare.comparePos);
      compare.visible = true;
      cam.position.copy(f.compare.camPos);
      cam.near = f.compare.near;
      cam.far = f.compare.far;
      cam.updateProjectionMatrix();
      controls.target.copy(f.compare.target);
      controls.enableRotate = false;
      controls.autoRotate = false;
    } else {
      model.position.copy(f.single.modelPos);
      compare.visible = false;
      cam.position.copy(f.single.camPos);
      cam.near = f.single.near;
      cam.far = f.single.far;
      cam.updateProjectionMatrix();
      controls.target.copy(f.single.target);
      controls.enableRotate = true;
      controls.autoRotate = isPlayingRef.current;
    }
    controls.update();
  }, [compareMode, compareModelUrl]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.enableZoom = devEnableZoom;
  }, [devEnableZoom]);

  useEffect(() => {
    if (rendererRef.current) rendererRef.current.toneMappingExposure = devExposure;
  }, [devExposure]);

  // ── Reset animation time accumulator when mode changes ──
  useEffect(() => {
    animTimeAccum.current = 0;
  }, [devAnimMode]);

  // ── Re-apply simple materials when toggled from dev panel ──
  useEffect(() => {
    const model = modelGroupRef.current;
    if (model) applySimpleMaterials(model, annotationsRef.current);
    const compareModel = compareGroupRef.current;
    if (compareModel) applySimpleMaterials(compareModel, compareAnnotationsRef.current);
  }, [applySimpleMaterials]);

  // ── Annotation popup animation ──

  useEffect(() => {
    const el = annotationRef.current;
    if (!el) return;

    if (activeAnnotation) {
      setShowAnnotation(true);
      // Animate in — matches PopText slideIn with back.out bounce
      gsap.fromTo(
        el,
        { x: -60, opacity: 0, scale: 0.95 },
        {
          duration: 0.35,
          x: 0,
          opacity: 1,
          scale: 1,
          ease: "back.out(1.7)",
          clearProps: "x,scale",
        },
      );
    } else {
      // Animate out — matches PopText slideOut with back.in
      gsap.to(el, {
        duration: 0.25,
        x: -40,
        opacity: 0,
        scale: 0.95,
        ease: "back.in(1.7)",
        onComplete: () => setShowAnnotation(false),
      });
    }
  }, [activeAnnotation]);

  // ── Close annotation with fade-out ──

  const closeAnnotation = useCallback(() => {
    const el = annotationRef.current;
    if (el) {
      gsap.killTweensOf(el);
      gsap.to(el, {
        duration: 0.25,
        x: -40,
        opacity: 0,
        scale: 0.95,
        ease: "back.in(1.7)",
        onComplete: () => {
          setActiveAnnotation(null);
          setShowAnnotation(false);
        },
      });
    } else {
      setActiveAnnotation(null);
      setShowAnnotation(false);
    }

    // Suppress hover re-highlighting for 500ms
    suppressHoverUntil.current = Date.now() + 500;

    // Restore click highlight
    if (previousHighlight.current) {
      const mat = previousHighlight.current.mesh.material as THREE.MeshStandardMaterial;
      restoreHighlight(mat, previousHighlight.current.originalEmissive, previousHighlight.current.originalColor);
      previousHighlight.current = null;
    }

    // Restore mirror highlight
    if (mirrorHighlight.current) {
      const mMat = mirrorHighlight.current.mesh.material as THREE.MeshStandardMaterial;
      restoreHighlight(mMat, mirrorHighlight.current.originalEmissive, mirrorHighlight.current.originalColor);
      mirrorHighlight.current = null;
    }

    // Restore hover highlight + mirror hover
    if (hoverHighlight.current) {
      const mat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
      restoreHighlight(mat, hoverHighlight.current.originalEmissive, hoverHighlight.current.originalColor);
      hoverHighlight.current = null;
    }
    if (mirrorHoverHighlight.current) {
      const mhMat = mirrorHoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
      restoreHighlight(mhMat, mirrorHoverHighlight.current.originalEmissive, mirrorHoverHighlight.current.originalColor);
      mirrorHoverHighlight.current = null;
    }
  }, [restoreHighlight]);

  // ── Copy to clipboard helper ──
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  // ── Dev animation play / pause ──
  const handleDevAnimPlay = useCallback(() => {
    const actions = actionsRef.current;
    if (actions.length === 0) return;
    actions.forEach((a) => {
      if (a.paused) {
        a.paused = false;
      } else if (!a.isRunning()) {
        a.play();
      }
    });
    setDevAnimPlaying(true);
  }, []);

  const handleDevAnimPause = useCallback(() => {
    const actions = actionsRef.current;
    actions.forEach((a) => {
      a.paused = true;
    });
    setDevAnimPlaying(false);
  }, []);

  // ── Shake / Explode handler ──
  const handleShake = useCallback(() => {
    const model = modelGroupRef.current;
    if (!model || shakeAnimatingRef.current) return;
    shakeAnimatingRef.current = true;

    // Find the actual sub-objects to explode. The GLB hierarchy is typically:
    // Scene → GroupNode → [Atoms_Epitope, bonds, mtl, ...]
    // We need the deepest group's children that have meshes, not the top-level single group.
    // GLTFLoader creates Object3D (not Group), so we check for non-mesh nodes with children.
    let target: THREE.Object3D = model;
    while (
      target.children.length === 1 &&
      !(target.children[0] as THREE.Mesh).isMesh
    ) {
      target = target.children[0];
    }

    // Only pick children that actually contain geometry (skip empty nodes like "mtl")
    const children = target.children.filter((c) => {
      if (!c.visible) return false;
      let hasMesh = false;
      c.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) hasMesh = true;
      });
      return hasMesh;
    });

    if (children.length === 0) {
      shakeAnimatingRef.current = false;
      return;
    }

    if (!isShaken) {
      // Save original transforms and explode
      originalTransforms.current.clear();

      children.forEach((child) => {
        originalTransforms.current.set(child.uuid, {
          position: child.position.clone(),
          rotation: child.rotation.clone(),
        });
      });

      // Compute bounding box in LOCAL space of the target parent
      // (children positions are in this local space, which may be scaled)
      const localBox = new THREE.Box3();
      children.forEach((child) => {
        const cBox = new THREE.Box3().setFromObject(child);
        // Convert world-space box corners into target's local space
        const min = target.worldToLocal(cBox.min.clone());
        const max = target.worldToLocal(cBox.max.clone());
        localBox.expandByPoint(min);
        localBox.expandByPoint(max);
      });
      const localCenter = localBox.getCenter(new THREE.Vector3());
      const localSize = localBox.getSize(new THREE.Vector3());
      const localMaxDim = Math.max(localSize.x, localSize.y, localSize.z);

      // Calculate outward directions from center for each child
      children.forEach((child, i) => {
        // Direction from local center to child's local position
        const dir = child.position.clone().sub(localCenter);

        // If the child overlaps the center, spread evenly
        if (dir.length() < 0.001) {
          dir.set(
            Math.cos((i * Math.PI * 2) / children.length),
            Math.random() * 0.5 - 0.25,
            Math.sin((i * Math.PI * 2) / children.length),
          );
        }
        dir.normalize();

        // Add chaotic randomness so they don't fly in perfectly symmetric directions
        dir.x += (Math.random() - 0.5) * 0.5;
        dir.y += (Math.random() - 0.5) * 0.5;
        dir.z += (Math.random() - 0.5) * 0.5;
        dir.normalize();

        // Half the previous distance
        const distance = localMaxDim * (1.5 + Math.random() * 1.0);

        const targetPos = child.position
          .clone()
          .add(dir.multiplyScalar(distance));

        // Heavy chaotic spin — multiple full rotations
        const targetRot = {
          x: child.rotation.x + (Math.random() - 0.5) * Math.PI * 6,
          y: child.rotation.y + (Math.random() - 0.5) * Math.PI * 6,
          z: child.rotation.z + (Math.random() - 0.5) * Math.PI * 6,
        };

        const duration = 3.0 + Math.random() * 1.0;

        gsap.to(child.position, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          duration,
          ease: "power1.out",
        });

        gsap.to(child.rotation, {
          x: targetRot.x,
          y: targetRot.y,
          z: targetRot.z,
          duration,
          ease: "none",
          onComplete:
            i === 0
              ? () => {
                  shakeAnimatingRef.current = false;
                }
              : undefined,
        });

        // Fade out opacity as pieces fly away
        child.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            const materials = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];
            materials.forEach((mat) => {
              mat.transparent = true;
              mat.needsUpdate = true;
              gsap.to(mat, {
                opacity: 0,
                duration,
                ease: "power1.in",
                onUpdate: () => {
                  mat.needsUpdate = true;
                },
              });
            });
          }
        });
      });

      setIsShaken(true);
    } else {
      // Reassemble — animate back to original positions
      children.forEach((child, i) => {
        const orig = originalTransforms.current.get(child.uuid);
        if (!orig) return;

        const duration = 1.2 + Math.random() * 0.3;

        gsap.to(child.position, {
          x: orig.position.x,
          y: orig.position.y,
          z: orig.position.z,
          duration,
          ease: "power2.inOut",
        });

        gsap.to(child.rotation, {
          x: orig.rotation.x,
          y: orig.rotation.y,
          z: orig.rotation.z,
          duration,
          ease: "power2.inOut",
          onComplete:
            i === 0
              ? () => {
                  shakeAnimatingRef.current = false;
                }
              : undefined,
        });

        // Fade back in
        child.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            const materials = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];
            materials.forEach((mat) => {
              mat.transparent = true;
              mat.needsUpdate = true;
              gsap.to(mat, {
                opacity: 1,
                duration,
                ease: "power2.inOut",
                onUpdate: () => {
                  mat.needsUpdate = true;
                },
              });
            });
          }
        });
      });

      setIsShaken(false);
    }
  }, [isShaken]);

  // ── Device shake detection (mobile) ──
  const handleShakeRef = useRef(handleShake);
  handleShakeRef.current = handleShake;

  // motionPermission: "unknown" (not yet asked), "granted", "denied", "not-needed" (Android/desktop)
  const [motionPermission, setMotionPermission] = useState<"unknown" | "granted" | "denied" | "not-needed">("unknown");
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );
  const motionCleanupRef = useRef<(() => void) | null>(null);

  // Detect mobile layout via screen width (responsive, works with browser resize)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      isMobileRef.current = e.matches;
    };
    onChange(mq);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Detect device motion permission (user-agent based, only on actual mobile devices)
  useEffect(() => {
    const isDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isDevice) return;

    const DME = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    const needsPermission = typeof DME.requestPermission === "function";

    if (!needsPermission) {
      // Android — no permission needed, start listening right away
      setMotionPermission("not-needed");
    }
  }, []);

  // Start listening to devicemotion once permission is granted or not needed
  useEffect(() => {
    if (motionPermission !== "granted" && motionPermission !== "not-needed") return;

    let lastShakeTime = 0;
    let lastX = 0, lastY = 0, lastZ = 0;
    const SHAKE_THRESHOLD = 15;
    const SHAKE_COOLDOWN = 2000;

    const onDeviceMotion = (e: DeviceMotionEvent) => {
      const acc = e.acceleration ?? e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

      const deltaX = Math.abs(acc.x - lastX);
      const deltaY = Math.abs(acc.y - lastY);
      const deltaZ = Math.abs(acc.z - lastZ);

      if (deltaX + deltaY + deltaZ > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - lastShakeTime > SHAKE_COOLDOWN) {
          lastShakeTime = now;
          handleShakeRef.current();
        }
      }

      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    };

    window.addEventListener("devicemotion", onDeviceMotion);
    motionCleanupRef.current = () => window.removeEventListener("devicemotion", onDeviceMotion);

    return () => {
      window.removeEventListener("devicemotion", onDeviceMotion);
      motionCleanupRef.current = null;
    };
  }, [motionPermission]);

  // Called from the "Enable Shake" button — must be triggered by user gesture
  const requestMotionPermission = useCallback(async () => {
    const DME = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };

    if (typeof DME.requestPermission === "function") {
      // iOS — must be called during a user gesture (tap/click)
      try {
        const result = await DME.requestPermission();
        if (result === "granted") {
          setMotionPermission("granted");
        } else {
          setMotionPermission("denied");
        }
      } catch {
        setMotionPermission("denied");
      }
    } else {
      // Android / others — no permission needed
      setMotionPermission("not-needed");
    }
  }, []);

  // ── Select element from Elements dropdown ──
  const handleElementSelect = useCallback(
    (annotation: MeshAnnotation) => {
      const roots = [modelGroupRef.current, compareGroupRef.current].filter(Boolean) as THREE.Object3D[];
      if (roots.length === 0) return;

      // Restore all previous highlights
      if (hoverHighlight.current) {
        const hMat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(hMat, hoverHighlight.current.originalEmissive, hoverHighlight.current.originalColor);
        hoverHighlight.current = null;
      }
      if (mirrorHoverHighlight.current) {
        const mhMat = mirrorHoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(mhMat, mirrorHoverHighlight.current.originalEmissive, mirrorHoverHighlight.current.originalColor);
        mirrorHoverHighlight.current = null;
      }
      if (previousHighlight.current) {
        const prevMat = previousHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(prevMat, previousHighlight.current.originalEmissive, previousHighlight.current.originalColor);
        previousHighlight.current = null;
      }
      if (mirrorHighlight.current) {
        const mMat = mirrorHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(mMat, mirrorHighlight.current.originalEmissive, mirrorHighlight.current.originalColor);
        mirrorHighlight.current = null;
      }

      // Find and highlight matching mesh in EACH model root
      let highlightedFirst = false;
      for (const r of roots) {
        let matchedNode: THREE.Object3D | null = null;

        // Try direct children first
        for (const child of r.children) {
          if (
            child.name === annotation.meshName ||
            child.name.startsWith(annotation.meshName) ||
            annotation.meshName.startsWith(child.name)
          ) {
            matchedNode = child;
            break;
          }
        }

        // Fallback: traverse entire tree
        if (!matchedNode) {
          r.traverse((node) => {
            if (
              !matchedNode &&
              (node.name === annotation.meshName ||
                node.name.startsWith(annotation.meshName) ||
                annotation.meshName.startsWith(node.name))
            ) {
              matchedNode = node;
            }
          });
        }

        if (!matchedNode) continue;

        // Find first mesh in matched node
        let targetMesh: THREE.Mesh | null = null;
        if ((matchedNode as THREE.Mesh).isMesh) {
          targetMesh = matchedNode as THREE.Mesh;
        } else {
          matchedNode.traverse((child) => {
            if (!targetMesh && (child as THREE.Mesh).isMesh) {
              targetMesh = child as THREE.Mesh;
            }
          });
        }

        if (targetMesh) {
          const tMat = (targetMesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (!highlightedFirst) {
            previousHighlight.current = captureHighlightState(targetMesh);
            highlightedFirst = true;
          } else {
            mirrorHighlight.current = captureHighlightState(targetMesh);
          }
          applyHighlight(tMat, highlightColorRef.current, false);
        }
      }

      // Open annotation popup
      setActiveAnnotation(annotation);

      // Open the elements dropdown to show the selection
      setElementsOpen(true);
    },
    [],
  );

  // ── Render ──

  return (
    <div
      className={`relative w-full overflow-hidden border-2 border-white ${className || ""}`}
      style={{ aspectRatio: isMobile ? (compareModelUrl && compareMode ? "1 / 2" : "3 / 5") : "16 / 9" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Three.js canvas mounts here */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {isLoading && <LoadingOverlay loadProgress={loadProgress} />}

      {/* Error overlay */}
      {error && <ErrorOverlay error={error} />}

      {/* ─── DEV MODE PANEL (hidden on mobile) ─── */}
      {devMode && !isMobile && !isLoading && !error && (
        <DevPanel
          devPanelOpen={devPanelOpen}
          setDevPanelOpen={setDevPanelOpen}
          selectedObject={selectedObject}
          copyToClipboard={copyToClipboard}
          devAmbientIntensity={devAmbientIntensity}
          setDevAmbientIntensity={setDevAmbientIntensity}
          devAmbientColor={devAmbientColor}
          setDevAmbientColor={setDevAmbientColor}
          devDirectIntensity={devDirectIntensity}
          setDevDirectIntensity={setDevDirectIntensity}
          devDirectColor={devDirectColor}
          setDevDirectColor={setDevDirectColor}
          devExposure={devExposure}
          setDevExposure={setDevExposure}
          devTransparentBg={devTransparentBg}
          setDevTransparentBg={setDevTransparentBg}
          devBgColor={devBgColor}
          setDevBgColor={setDevBgColor}
          devAutoRotate={devAutoRotate}
          setDevAutoRotate={setDevAutoRotate}
          devEnableZoom={devEnableZoom}
          setDevEnableZoom={setDevEnableZoom}
          devSimpleMaterials={devSimpleMaterials}
          setDevSimpleMaterials={setDevSimpleMaterials}
          devHighlightColor={devHighlightColor}
          setDevHighlightColor={setDevHighlightColor}
          devHighlightBlend={devHighlightBlend}
          setDevHighlightBlend={setDevHighlightBlend}
          devHighlightOpacity={devHighlightOpacity}
          setDevHighlightOpacity={setDevHighlightOpacity}
          hasAnimations={hasAnimations}
          devAnimPlaying={devAnimPlaying}
          onAnimPlay={handleDevAnimPlay}
          onAnimPause={handleDevAnimPause}
          devAnimMode={devAnimMode}
          setDevAnimMode={setDevAnimMode}
          devAnimSpeed={devAnimSpeed}
          setDevAnimSpeed={setDevAnimSpeed}
          sceneGraph={compareSceneGraph.length > 0 ? [...sceneGraph, "── Compare Model ──", ...compareSceneGraph] : sceneGraph}
          annotations={annotations}
        />
      )}

      {/* ─── TOP-LEFT: ELEMENTS (EPITOPES) + ANNOTATION POPUP ─── */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-col gap-3">
        {!isLoading && !error && (
          <TopLeftElements
            title={title}
            annotations={annotations}
            activeAnnotation={activeAnnotation}
            open={elementsOpen}
            setOpen={setElementsOpen}
            onSelect={handleElementSelect}
            onCloseAnnotation={closeAnnotation}
          />
        )}
        <AnnotationPopup
          showAnnotation={showAnnotation}
          activeAnnotation={activeAnnotation}
          annotationRef={annotationRef}
          closeAnnotation={closeAnnotation}
          className="relative max-w-sm"
        />
      </div>

      {/* ─── BOTTOM-LEFT CONTROLS ─── */}
      {!isLoading && !error && (
        <BottomControls
          controlsRef={controlsRef}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onShake={handleShake}
          isShaken={isShaken}
          isMobile={isMobile}
          motionPermission={motionPermission}
          onRequestMotionPermission={requestMotionPermission}
          hasCompare={!!compareModelUrl}
          compareMode={compareMode}
          onToggleCompareMode={() => setCompareMode((v) => !v)}
        />
      )}
    </div>
  );
};

export default ModelViewer;
