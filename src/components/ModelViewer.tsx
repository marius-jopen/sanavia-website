"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// ── Types ──

interface SelectedObjectInfo {
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

const FALLBACK_PALETTE = ["#bdd1ff", "#bdfffe", "#ffa34d"];

interface ModelViewerProps {
  modelUrl: string;
  autoplay?: boolean;
  autoRotate?: boolean;
  backgroundColor?: string;
  ambientLightIntensity?: number;
  ambientLightColor?: string;
  directLightIntensity?: number;
  directLightColor?: string;
  enableZoom?: boolean;
  simpleMaterials?: boolean;
  showControls?: boolean;
  devMode?: boolean;
  annotations?: MeshAnnotation[];
  className?: string;
}

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
        // so we can match annotations against any level of the hierarchy.
        // glTF files often have: Group("antibodyActiveLighter") > Mesh("antibodyActiveLighter_0")
        const hitNames: string[] = [];
        let current: THREE.Object3D | null = hit;
        while (current && current !== modelGroupRef.current) {
          if (current.name) hitNames.push(current.name);
          current = current.parent;
        }

        // Highlight clicked mesh — emissive is now at its true original
        // (hover was restored above) so the clone captures the correct base
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
          // Try exact match first, then startsWith, against all names in chain
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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm opacity-75">
              {loadProgress > 0 ? `Loading ${loadProgress}%` : "Loading model…"}
            </p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-white/80 text-sm">{error}</p>
        </div>
      )}

      {/* ─── DEV MODE PANEL ─── */}
      {devMode && !isLoading && !error && (
        <>
          {/* Toggle button — always visible */}
          <button
            type="button"
            onClick={() => setDevPanelOpen((v) => !v)}
            className="absolute top-3 right-3 z-40 bg-white/90 hover:bg-white text-gray-700 text-xs font-mono px-3 py-1.5 rounded-md cursor-pointer backdrop-blur-sm border border-gray-200/50 shadow-sm transition-colors"
          >
            {devPanelOpen ? "Close Dev" : "Dev Mode"}
          </button>

          {/* Panel */}
          {devPanelOpen && (
            <div className="absolute top-12 right-3 z-40 w-72 max-h-[calc(100%-60px)] overflow-y-auto bg-white/95 backdrop-blur-md text-gray-800 text-xs font-mono rounded-xl border border-gray-200/50 shadow-xl">
              {/* ── Object Inspector ── */}
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">
                  Object Inspector
                </h3>
                {selectedObject ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-400 shrink-0">Name</span>
                      <button
                        onClick={() => copyToClipboard(selectedObject.name)}
                        className="text-right text-blue-600 hover:text-blue-500 cursor-pointer break-all bg-transparent border-none p-0 text-xs font-mono"
                        title="Click to copy"
                      >
                        {selectedObject.name}
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type</span>
                      <span>{selectedObject.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">UUID</span>
                      <span className="text-gray-500">{selectedObject.uuid}…</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Parent</span>
                      <span>{selectedObject.parentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Position</span>
                      <span>
                        {selectedObject.position.x}, {selectedObject.position.y},{" "}
                        {selectedObject.position.z}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Material</span>
                      <span>{selectedObject.materialName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mat. Type</span>
                      <span>{selectedObject.materialType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vertices</span>
                      <span>{selectedObject.vertexCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Triangles</span>
                      <span>{Math.round(selectedObject.triangleCount).toLocaleString()}</span>
                    </div>
                    {Object.keys(selectedObject.userData).length > 0 && (
                      <div className="mt-1 pt-1 border-t border-gray-200">
                        <span className="text-gray-400">userData:</span>
                        <pre className="mt-1 text-[10px] text-gray-500 whitespace-pre-wrap break-all">
                          {JSON.stringify(selectedObject.userData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-300 italic">Click an object to inspect it</p>
                )}
              </div>

              {/* ── Lighting Controls ── */}
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">
                  Lighting
                </h3>
                <div className="space-y-2">
                  <DevSlider
                    label="Ambient Intensity"
                    value={devAmbientIntensity}
                    min={0} max={3} step={0.05}
                    onChange={setDevAmbientIntensity}
                  />
                  <DevColor
                    label="Ambient Color"
                    value={devAmbientColor}
                    onChange={setDevAmbientColor}
                  />
                  <DevSlider
                    label="Direct Intensity"
                    value={devDirectIntensity}
                    min={0} max={5} step={0.05}
                    onChange={setDevDirectIntensity}
                  />
                  <DevColor
                    label="Direct Color"
                    value={devDirectColor}
                    onChange={setDevDirectColor}
                  />
                  <DevSlider
                    label="Exposure"
                    value={devExposure}
                    min={0} max={3} step={0.05}
                    onChange={setDevExposure}
                  />
                </div>
              </div>

              {/* ── Display Controls ── */}
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">
                  Display
                </h3>
                <div className="space-y-2">
                  <DevToggle
                    label="Transparent BG"
                    value={devTransparentBg}
                    onChange={setDevTransparentBg}
                  />
                  {!devTransparentBg && (
                    <DevColor
                      label="Background"
                      value={devBgColor}
                      onChange={setDevBgColor}
                    />
                  )}
                  <DevToggle
                    label="Auto Rotate"
                    value={devAutoRotate}
                    onChange={setDevAutoRotate}
                  />
                  <DevToggle
                    label="Enable Zoom"
                    value={devEnableZoom}
                    onChange={setDevEnableZoom}
                  />
                  <DevToggle
                    label="Simple Materials"
                    value={devSimpleMaterials}
                    onChange={setDevSimpleMaterials}
                  />
                  <DevColor
                    label="Selection Highlight"
                    value={devHighlightColor}
                    onChange={setDevHighlightColor}
                  />
                </div>
              </div>

              {/* ── Scene Graph ── */}
              <div className="p-3">
                <h3 className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">
                  Scene Graph
                </h3>
                {sceneGraph.length > 0 ? (
                  <pre className="text-[10px] text-gray-500 whitespace-pre overflow-x-auto max-h-40 overflow-y-auto">
                    {sceneGraph.join("\n")}
                  </pre>
                ) : (
                  <p className="text-gray-300 italic">Loading…</p>
                )}
              </div>

              {/* ── Export Settings ── */}
              <div className="p-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    const settings = {
                      transparentBackground: devTransparentBg,
                      backgroundColor: devBgColor,
                      ambientLightIntensity: devAmbientIntensity,
                      ambientLightColor: devAmbientColor,
                      directLightIntensity: devDirectIntensity,
                      directLightColor: devDirectColor,
                      exposure: devExposure,
                      autoRotate: devAutoRotate,
                      enableZoom: devEnableZoom,
                      simpleMaterials: devSimpleMaterials,
                      highlightColor: devHighlightColor,
                    };
                    copyToClipboard(JSON.stringify(settings, null, 2));
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-mono py-1.5 px-3 rounded cursor-pointer border border-gray-200 transition-colors"
                >
                  Copy Settings as JSON
                </button>
              </div>
            </div>
          )}

        </>
      )}

      {/* ─── ANNOTATION POPUP ─── */}
      {(showAnnotation || activeAnnotation) && (
        <div
          ref={annotationRef}
          className="absolute top-4 left-4 z-30 max-w-sm"
          style={{ opacity: 0 }}
        >
          <div className="bg-white rounded-2xl  overflow-hidden">
            {/* Header with close button */}
            <div className="flex items-start justify-between gap-3 pt-5 pb-2 px-5 md:px-7">
              <h3 className="text-gray-800">
                {activeAnnotation?.title}
              </h3>
              <button
                type="button"
                onClick={closeAnnotation}
                className="shrink-0 mt-1 text-neutral-400 hover:text-neutral-700 cursor-pointer bg-transparent border-none p-0 transition-colors"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Body */}
            <div className="px-5 md:px-7 pb-5 text-neutral-500 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0">
              {activeAnnotation?.content}
            </div>
          </div>
        </div>
      )}

      {/* ─── BOTTOM-LEFT CONTROLS: Elements dropdown + Play/Pause auto-rotate ─── */}
      {!isLoading && !error && (
        <div className="absolute bottom-4 left-4 z-30 flex items-end gap-2">
          {/* Elements dropdown */}
          {annotations.length > 0 && (
            <div className="relative">
              {/* Dropdown menu (opens upward) */}
              {elementsOpen && (
                <div className="absolute bottom-full left-0 mb-2 min-w-[200px] bg-white rounded-xl overflow-hidden shadow-xl">
                  <div className="max-h-60 overflow-y-auto py-1">
                    {annotations.map((a, i) => (
                      <button
                        key={`${a.meshName}-${i}`}
                        type="button"
                        onClick={() => handleElementSelect(a)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer border-none bg-transparent hover:bg-gray-100 ${
                          activeAnnotation?.meshName === a.meshName
                            ? "text-gray-900 font-medium bg-gray-50"
                            : "text-gray-600"
                        }`}
                      >
                        {a.title || a.meshName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Elements toggle button */}
              <button
                type="button"
                onClick={() => setElementsOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 text-sm font-medium px-4 py-2.5 rounded-full cursor-pointer border border-gray-200/50 transition-all shadow-lg"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                Elements
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${elementsOpen ? "rotate-180" : ""}`}
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
            </div>
          )}

          {/* Auto-rotate toggle button */}
          <button
            type="button"
            onClick={() => {
              const controls = controlsRef.current;
              if (!controls) return;
              const next = !controls.autoRotate;
              controls.autoRotate = next;
              setIsPlaying(next);
            }}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 text-sm font-medium px-4 py-2.5 rounded-full cursor-pointer border border-gray-200/50 transition-all shadow-lg"
            aria-label={isPlaying ? "Turn off auto rotate" : "Turn on auto rotate"}
          >
            {isPlaying ? "Auto Rotate Off" : "Auto Rotate On"}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Helper: calculate depth of a node relative to root ──

function getDepth(node: THREE.Object3D, root: THREE.Object3D): number {
  let depth = 0;
  let current = node.parent;
  while (current && current !== root) {
    depth++;
    current = current.parent;
  }
  return depth;
}

// ── Dev Mode sub-components ──

function DevSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-600">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 appearance-none bg-gray-200 rounded cursor-pointer accent-gray-800"
      />
    </div>
  );
}

function DevColor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-5 h-5 rounded cursor-pointer border border-gray-300 bg-transparent p-0"
        />
      </div>
    </div>
  );
}

function DevToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-8 h-4 rounded-full cursor-pointer transition-colors border-none ${
          value ? "bg-gray-800" : "bg-gray-200"
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full bg-white transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default ModelViewer;
