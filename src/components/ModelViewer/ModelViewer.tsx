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
import { LoadingOverlay, ErrorOverlay } from "./Overlays";

const ModelViewer: React.FC<ModelViewerProps> = ({
  modelUrl,
  autoplay = true,
  autoRotate = false,
  backgroundColor = "#191919",
  transparentBackground = true,
  ambientLightIntensity = 0.5,
  ambientLightColor = "#FFFFFF",
  directLightIntensity = 1.5,
  directLightColor = "#FFFFFF",
  exposure = 1.0,
  enableZoom = false,
  simpleMaterials = true,
  highlightColor = "#ff0000",
  highlightBlendMode = "screen",
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
  const suppressHoverUntil = useRef(0);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoRotate);
  const [hasAnimations, setHasAnimations] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Annotation popup state
  const [activeAnnotation, setActiveAnnotation] = useState<MeshAnnotation | null>(null);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const annotationRef = useRef<HTMLDivElement>(null);
  const annotationsRef = useRef<MeshAnnotation[]>(annotations);
  annotationsRef.current = annotations;

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
  const applySimpleMaterials = useCallback((model: THREE.Group) => {
    const shouldApply = devSimpleMaterials;

    if (shouldApply) {
      // Build a map: meshName → color from annotations
      const annotationColorMap = new Map<string, string>();
      annotationsRef.current.forEach((a) => {
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
            roughness: std.roughness ?? 0.6,
            metalness: 0.0,
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
    controls.autoRotateSpeed = 2.0;
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

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // ── Auto-frame: centre model and fit to camera ──
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        model.position.sub(center); // centre at origin

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = (maxDim / (2 * Math.tan(fov / 2))) * 0.9;

        camera.position.set(0, size.y * 0.15, cameraZ);
        camera.near = cameraZ / 100;
        camera.far = cameraZ * 100;
        camera.updateProjectionMatrix();

        controls.target.set(0, 0, 0);
        controls.update();

        scene.add(model);
        modelGroupRef.current = model;

        // ── Build scene graph ──
        const names: string[] = [];
        model.traverse((node) => {
          const indent = "  ".repeat(getDepth(node, model));
          const type = (node as THREE.Mesh).isMesh
            ? "Mesh"
            : node.type;
          names.push(`${indent}${type}: "${node.name || "(unnamed)"}"`);
        });
        setSceneGraph(names);

        // ── Apply simple materials immediately on load ──
        applySimpleMaterials(model);

        // ── Animations ──
        const clips = gltf.animations;
        if (clips && clips.length > 0) {
          setHasAnimations(true);
          maxClipDurationRef.current = Math.max(...clips.map((c) => c.duration));

          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;

          const actions = clips.map((clip) => mixer.clipAction(clip));
          actionsRef.current = actions;

          if (autoplay) {
            actions.forEach((a) => {
              a.loop = THREE.LoopRepeat;
              a.clampWhenFinished = false;
              a.play();
            });
            setDevAnimPlaying(true);
          }
        }

        setIsLoading(false);
      },
      (progress) => {
        if (progress.total > 0) {
          setLoadProgress(Math.round((progress.loaded / progress.total) * 100));
        }
      },
      (err) => {
        console.error("Error loading 3D model:", err);
        setError("Failed to load 3D model");
        setIsLoading(false);
      },
    );

    // ── Raycasting click handler (dev mode + annotation popups) ──
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const hasAnnotations = annotationsRef.current.length > 0;
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

      if (!modelGroupRef.current) return;
      const intersects = raycaster.intersectObjects(
        modelGroupRef.current.children,
        true,
      );

      // Restore previous click highlight
      if (previousHighlight.current) {
        const mat = previousHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(mat, previousHighlight.current.originalEmissive, previousHighlight.current.originalColor);
        previousHighlight.current = null;
      }

      // Clear hover highlight — restore its true original first
      // so that the click highlight captures the correct base color
      if (hoverHighlight.current) {
        const hMat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(hMat, hoverHighlight.current.originalEmissive, hoverHighlight.current.originalColor);
        hoverHighlight.current = null;
      }

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;

        // Collect ALL names from the hit mesh up through the parent chain
        const hitNames: string[] = [];
        let current: THREE.Object3D | null = hit;
        while (current && current !== modelGroupRef.current) {
          if (current.name) hitNames.push(current.name);
          current = current.parent;
        }

        // Highlight clicked mesh
        const mat = hit.material as THREE.MeshStandardMaterial;
        previousHighlight.current = captureHighlightState(hit);
        applyHighlight(mat, highlightColorRef.current, false);

        // ── Annotation popup ──
        if (hasAnnotations && hitNames.length > 0) {
          const match = annotationsRef.current.find((a) =>
            hitNames.some(
              (n) => n === a.meshName || n.startsWith(a.meshName) || a.meshName.startsWith(n),
            ),
          );

          setActiveAnnotation(match ?? null);
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

      const hasAnnotations = annotationsRef.current.length > 0;
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

      if (!modelGroupRef.current) return;
      const intersects = raycaster.intersectObjects(
        modelGroupRef.current.children,
        true,
      );

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

        // Restore previous hover
        if (hoverHighlight.current) {
          const prevMat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
          restoreHighlight(prevMat, hoverHighlight.current.originalEmissive, hoverHighlight.current.originalColor);
          hoverHighlight.current = null;
        }

        // Apply hover highlight (animated)
        const mat = hit.material as THREE.MeshStandardMaterial;
        hoverHighlight.current = captureHighlightState(hit);
        applyHighlight(mat, highlightColorRef.current, true);

        renderer.domElement.style.cursor = "pointer";
      } else {
        // Restore hover highlight
        if (hoverHighlight.current) {
          const prevMat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
          restoreHighlight(prevMat, hoverHighlight.current.originalEmissive, hoverHighlight.current.originalColor);
          hoverHighlight.current = null;
        }
        renderer.domElement.style.cursor = "";
      }
    };

    const onPointerMove = (e: PointerEvent) => {
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

    // ── Render loop ──
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
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
      resizeObserver.disconnect();
      cancelAnimationFrame(frameRef.current);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      if (hoverThrottleId !== null) clearTimeout(hoverThrottleId);
      controls.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      if (modelGroupRef.current) {
        modelGroupRef.current.traverse((node) => {
          const mesh = node as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => m.dispose());
          }
        });
      }

      dracoLoader.dispose();
      envTexture.dispose();
    };
    // Re-initialise only when the model URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl]);

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
    if (controlsRef.current) controlsRef.current.autoRotate = devAutoRotate;
  }, [devAutoRotate]);

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
    if (!model) return;
    applySimpleMaterials(model);
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

    // Restore hover highlight
    if (hoverHighlight.current) {
      const mat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
      restoreHighlight(mat, hoverHighlight.current.originalEmissive, hoverHighlight.current.originalColor);
      hoverHighlight.current = null;
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

  // ── Select element from Elements dropdown ──
  const handleElementSelect = useCallback(
    (annotation: MeshAnnotation) => {
      const root = modelGroupRef.current;
      if (!root) return;

      // Restore hover highlight to true original first
      if (hoverHighlight.current) {
        const hMat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(hMat, hoverHighlight.current.originalEmissive, hoverHighlight.current.originalColor);
        hoverHighlight.current = null;
      }

      // Restore previous click highlight
      if (previousHighlight.current) {
        const prevMat = previousHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        restoreHighlight(prevMat, previousHighlight.current.originalEmissive, previousHighlight.current.originalColor);
        previousHighlight.current = null;
      }

      // Find the matching 3D object by annotation meshName
      let matchedNode: THREE.Object3D | null = null;

      // Try direct children first
      for (const child of root.children) {
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
        root.traverse((node) => {
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

      if (!matchedNode) return;

      // Highlight the first mesh found in the matched node
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
        const mat = (targetMesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
        previousHighlight.current = captureHighlightState(targetMesh);
        applyHighlight(mat, highlightColorRef.current, false);
      }

      // Open annotation popup
      setActiveAnnotation(annotation);

      // Close the elements dropdown
      setElementsOpen(false);
    },
    [],
  );

  // ── Render ──

  return (
    <div
      className={`relative w-full overflow-hidden border-2 border-white ${className || ""}`}
      style={{ aspectRatio: "16 / 9" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Three.js canvas mounts here */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {isLoading && <LoadingOverlay loadProgress={loadProgress} />}

      {/* Error overlay */}
      {error && <ErrorOverlay error={error} />}

      {/* ─── DEV MODE PANEL ─── */}
      {devMode && !isLoading && !error && (
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
          sceneGraph={sceneGraph}
        />
      )}

      {/* ─── ANNOTATION POPUP ─── */}
      <AnnotationPopup
        showAnnotation={showAnnotation}
        activeAnnotation={activeAnnotation}
        annotationRef={annotationRef}
        closeAnnotation={closeAnnotation}
      />

      {/* ─── BOTTOM-LEFT CONTROLS ─── */}
      {!isLoading && !error && (
        <BottomControls
          annotations={annotations}
          elementsOpen={elementsOpen}
          setElementsOpen={setElementsOpen}
          handleElementSelect={handleElementSelect}
          activeAnnotation={activeAnnotation}
          controlsRef={controlsRef}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      )}
    </div>
  );
};

export default ModelViewer;
