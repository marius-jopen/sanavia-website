"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import type { SelectedObjectInfo, MeshAnnotation, ModelViewerProps } from "./types";
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
  ambientLightIntensity = 0.5,
  ambientLightColor = "#FFFFFF",
  directLightIntensity = 1.5,
  directLightColor = "#FFFFFF",
  enableZoom = true,
  simpleMaterials = true,
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
  } | null>(null);
  const hoverHighlight = useRef<{
    mesh: THREE.Mesh;
    originalEmissive: THREE.Color;
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
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SelectedObjectInfo | null>(null);
  const [devBgColor, setDevBgColor] = useState(backgroundColor);
  const [devAmbientIntensity, setDevAmbientIntensity] = useState(ambientLightIntensity);
  const [devAmbientColor, setDevAmbientColor] = useState(ambientLightColor);
  const [devDirectIntensity, setDevDirectIntensity] = useState(directLightIntensity);
  const [devDirectColor, setDevDirectColor] = useState(directLightColor);
  const [devAutoRotate, setDevAutoRotate] = useState(autoRotate);
  const [devEnableZoom, setDevEnableZoom] = useState(enableZoom);
  const [devExposure, setDevExposure] = useState(1.0);
  const [devHighlightColor, setDevHighlightColor] = useState("#ff0000");
  const highlightColorRef = useRef("#ff0000");
  highlightColorRef.current = devHighlightColor;
  const [devTransparentBg, setDevTransparentBg] = useState(true);
  const [devSimpleMaterials, setDevSimpleMaterials] = useState(true);
  const originalMaterials = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());
  const [sceneGraph, setSceneGraph] = useState<string[]>([]);

  // Elements dropdown state
  const [elementsOpen, setElementsOpen] = useState(false);

  // ── Helper: apply or revert simple materials ──
  const applySimpleMaterials = useCallback((model: THREE.Group) => {
    const shouldApply = devMode ? devSimpleMaterials : simpleMaterials;

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
  }, [devMode, devSimpleMaterials, simpleMaterials]);

  // ───────────────────────────────────────────────
  // Initialise Three.js scene & load model
  // ───────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(devMode ? devBgColor : backgroundColor);
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
    renderer.toneMappingExposure = devMode ? devExposure : 1.0;
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
    controls.enableZoom = devMode ? devEnableZoom : enableZoom;
    controls.autoRotate = devMode ? devAutoRotate : autoRotate;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // ── Lights ──
    const ambient = new THREE.AmbientLight(
      devMode ? devAmbientColor : ambientLightColor,
      devMode ? devAmbientIntensity : ambientLightIntensity,
    );
    scene.add(ambient);
    ambientRef.current = ambient;

    const direct = new THREE.DirectionalLight(
      devMode ? devDirectColor : directLightColor,
      devMode ? devDirectIntensity : directLightIntensity,
    );
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

          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;

          const actions = clips.map((clip) => mixer.clipAction(clip));
          actionsRef.current = actions;

          if (autoplay) {
            actions.forEach((a) => a.play());
            setIsPlaying(true);
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
      if (!devMode && !hasAnnotations) return;

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
        if (mat.emissive) mat.emissive.copy(previousHighlight.current.originalEmissive);
        previousHighlight.current = null;
      }

      // Clear hover highlight — restore its true original emissive first
      // so that the click highlight captures the correct base color
      if (hoverHighlight.current) {
        const hMat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        if (hMat.emissive) {
          gsap.killTweensOf(hMat.emissive);
          hMat.emissive.copy(hoverHighlight.current.originalEmissive);
        }
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
        if (mat.emissive) {
          previousHighlight.current = {
            mesh: hit,
            originalEmissive: mat.emissive.clone(),
          };
          mat.emissive.set(highlightColorRef.current);
        }

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
        if (devMode) {
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
      if (!devMode && !hasAnnotations) {
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
          if (prevMat.emissive) {
            gsap.killTweensOf(prevMat.emissive);
            const orig = hoverHighlight.current.originalEmissive;
            prevMat.emissive.set(orig);
          }
          hoverHighlight.current = null;
        }

        // Apply hover highlight
        const mat = hit.material as THREE.MeshStandardMaterial;
        if (mat.emissive) {
          hoverHighlight.current = {
            mesh: hit,
            originalEmissive: mat.emissive.clone(),
          };
          hoverTargetColor.set(highlightColorRef.current);
          gsap.killTweensOf(mat.emissive);
          gsap.to(mat.emissive, {
            r: hoverTargetColor.r,
            g: hoverTargetColor.g,
            b: hoverTargetColor.b,
            duration: 0.4,
            ease: "power2.out",
          });
        }

        renderer.domElement.style.cursor = "pointer";
      } else {
        // Restore hover highlight
        if (hoverHighlight.current) {
          const prevMat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
          if (prevMat.emissive) {
            gsap.killTweensOf(prevMat.emissive);
            const orig = hoverHighlight.current.originalEmissive;
            prevMat.emissive.set(orig);
          }
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
      if (mixerRef.current) mixerRef.current.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
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

  // ── Reactive prop updates (non-dev mode) ──

  useEffect(() => {
    if (devMode) return; // dev mode controls its own values
    if (ambientRef.current) {
      ambientRef.current.intensity = ambientLightIntensity;
      ambientRef.current.color.set(ambientLightColor);
    }
    if (directRef.current) {
      directRef.current.intensity = directLightIntensity;
      directRef.current.color.set(directLightColor);
    }
  }, [devMode, ambientLightIntensity, ambientLightColor, directLightIntensity, directLightColor]);

  useEffect(() => {
    if (devMode) return;
    if (sceneRef.current && sceneRef.current.background instanceof THREE.Color) {
      sceneRef.current.background.set(backgroundColor);
    }
  }, [devMode, backgroundColor]);

  useEffect(() => {
    if (devMode) return;
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [devMode, autoRotate]);

  useEffect(() => {
    if (devMode) return;
    if (controlsRef.current) controlsRef.current.enableZoom = enableZoom;
  }, [devMode, enableZoom]);

  // ── Dev mode reactive updates ──

  useEffect(() => {
    if (!devMode) return;
    if (ambientRef.current) {
      ambientRef.current.intensity = devAmbientIntensity;
      ambientRef.current.color.set(devAmbientColor);
    }
    if (directRef.current) {
      directRef.current.intensity = devDirectIntensity;
      directRef.current.color.set(devDirectColor);
    }
  }, [devMode, devAmbientIntensity, devAmbientColor, devDirectIntensity, devDirectColor]);

  useEffect(() => {
    if (!devMode) return;
    if (!sceneRef.current) return;
    if (devTransparentBg) {
      sceneRef.current.background = null;
    } else {
      sceneRef.current.background = new THREE.Color(devBgColor);
    }
  }, [devMode, devBgColor, devTransparentBg]);

  useEffect(() => {
    if (!devMode) return;
    if (controlsRef.current) controlsRef.current.autoRotate = devAutoRotate;
  }, [devMode, devAutoRotate]);

  useEffect(() => {
    if (!devMode) return;
    if (controlsRef.current) controlsRef.current.enableZoom = devEnableZoom;
  }, [devMode, devEnableZoom]);

  useEffect(() => {
    if (!devMode) return;
    if (rendererRef.current) rendererRef.current.toneMappingExposure = devExposure;
  }, [devMode, devExposure]);

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
      const mat = previousHighlight.current.mesh
        .material as THREE.MeshStandardMaterial;
      if (mat.emissive) {
        gsap.killTweensOf(mat.emissive);
        mat.emissive.copy(previousHighlight.current.originalEmissive);
      }
      previousHighlight.current = null;
    }

    // Restore hover highlight
    if (hoverHighlight.current) {
      const mat = hoverHighlight.current.mesh
        .material as THREE.MeshStandardMaterial;
      if (mat.emissive) {
        gsap.killTweensOf(mat.emissive);
        mat.emissive.copy(hoverHighlight.current.originalEmissive);
      }
      hoverHighlight.current = null;
    }
  }, []);

  // ── Copy to clipboard helper ──
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  // ── Select element from Elements dropdown ──
  const handleElementSelect = useCallback(
    (annotation: MeshAnnotation) => {
      const root = modelGroupRef.current;
      if (!root) return;

      // Restore hover highlight to true original first
      if (hoverHighlight.current) {
        const hMat = hoverHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        if (hMat.emissive) {
          gsap.killTweensOf(hMat.emissive);
          hMat.emissive.copy(hoverHighlight.current.originalEmissive);
        }
        hoverHighlight.current = null;
      }

      // Restore previous click highlight
      if (previousHighlight.current) {
        const prevMat = previousHighlight.current.mesh.material as THREE.MeshStandardMaterial;
        if (prevMat.emissive) {
          gsap.killTweensOf(prevMat.emissive);
          prevMat.emissive.copy(previousHighlight.current.originalEmissive);
        }
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
        if (mat.emissive) {
          previousHighlight.current = {
            mesh: targetMesh,
            originalEmissive: mat.emissive.clone(),
          };
          mat.emissive.set(highlightColorRef.current);
        }
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
