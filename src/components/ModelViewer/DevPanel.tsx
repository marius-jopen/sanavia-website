import React, { useState } from "react";
import type { SelectedObjectInfo, AnimationMode, HighlightBlendMode, MeshAnnotation } from "./types";

// ── Predefined colors for Prismic copy-paste ──

const PRISMIC_COLORS = [
  { label: "Cyan", value: "#26FBFF" },
  { label: "Orange", value: "#FF7F1F" },
  { label: "Blue", value: "#54A0FF" },
];

// ── Collapsible Section ──

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2 bg-transparent border-none cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs uppercase tracking-[0.08em] font-semibold text-gray-400">
          {title}
        </span>
        <svg
          className={`w-3 h-3 text-gray-300 transition-transform ${open ? "" : "-rotate-90"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-3 space-y-1.5">{children}</div>}
    </div>
  );
}

// ── Primitive Controls ──

export function DevSlider({
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
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-[80px] shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-[3px] appearance-none bg-gray-200 rounded cursor-pointer accent-gray-600"
      />
      <span className="text-xs text-gray-500 w-[36px] text-right tabular-nums">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

export function DevColor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-[80px] shrink-0">{label}</span>
      <div className="flex-1" />
      <span className="text-xs text-gray-500 tabular-nums">{value}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 rounded cursor-pointer border border-gray-200 bg-transparent p-0"
      />
    </div>
  );
}

export function DevToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-[80px] shrink-0">{label}</span>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-7 h-4 rounded-full cursor-pointer transition-colors border-none ${
          value ? "bg-gray-700" : "bg-gray-200"
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full bg-white transition-transform ${
            value ? "translate-x-[13px]" : "translate-x-[1px]"
          }`}
        />
      </button>
    </div>
  );
}

export function DevSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-[80px] shrink-0">{label}</span>
      <div className="flex-1" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-gray-50 border border-gray-200 text-gray-600 text-xs font-mono rounded px-2 py-0.5 cursor-pointer outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Compact key-value row ──

function InfoRow({
  label,
  value,
  copyable,
  onCopy,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex justify-between items-start gap-2 leading-tight">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      {copyable ? (
        <button
          onClick={onCopy}
          className="text-right text-xs text-blue-500 hover:text-blue-400 cursor-pointer break-all bg-transparent border-none p-0 font-mono leading-tight"
          title="Click to copy"
        >
          {value}
        </button>
      ) : (
        <span className="text-xs text-gray-600 text-right break-all leading-tight">
          {value}
        </span>
      )}
    </div>
  );
}

// ── DevPanel Props ──

export interface DevPanelProps {
  devPanelOpen: boolean;
  setDevPanelOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  selectedObject: SelectedObjectInfo | null;
  copyToClipboard: (text: string) => void;

  // Lighting
  devAmbientIntensity: number;
  setDevAmbientIntensity: (v: number) => void;
  devAmbientColor: string;
  setDevAmbientColor: (v: string) => void;
  devDirectIntensity: number;
  setDevDirectIntensity: (v: number) => void;
  devDirectColor: string;
  setDevDirectColor: (v: string) => void;
  devExposure: number;
  setDevExposure: (v: number) => void;

  // Display
  devTransparentBg: boolean;
  setDevTransparentBg: (v: boolean) => void;
  devBgColor: string;
  setDevBgColor: (v: string) => void;
  devAutoRotate: boolean;
  setDevAutoRotate: (v: boolean) => void;
  devEnableZoom: boolean;
  setDevEnableZoom: (v: boolean) => void;
  devSimpleMaterials: boolean;
  setDevSimpleMaterials: (v: boolean) => void;
  devHighlightColor: string;
  setDevHighlightColor: (v: string) => void;
  devHighlightBlend: HighlightBlendMode;
  setDevHighlightBlend: (v: HighlightBlendMode) => void;
  devHighlightOpacity: number;
  setDevHighlightOpacity: (v: number) => void;

  // Animation
  hasAnimations: boolean;
  devAnimPlaying: boolean;
  onAnimPlay: () => void;
  onAnimPause: () => void;
  devAnimMode: AnimationMode;
  setDevAnimMode: (v: AnimationMode) => void;
  devAnimSpeed: number;
  setDevAnimSpeed: (v: number) => void;

  // Scene graph
  sceneGraph: string[];

  // Annotations (from Prismic)
  annotations: MeshAnnotation[];
}

// ── DevPanel Component ──

export function DevPanel({
  devPanelOpen,
  setDevPanelOpen,
  selectedObject,
  copyToClipboard,
  devAmbientIntensity,
  setDevAmbientIntensity,
  devAmbientColor,
  setDevAmbientColor,
  devDirectIntensity,
  setDevDirectIntensity,
  devDirectColor,
  setDevDirectColor,
  devExposure,
  setDevExposure,
  devTransparentBg,
  setDevTransparentBg,
  devBgColor,
  setDevBgColor,
  devAutoRotate,
  setDevAutoRotate,
  devEnableZoom,
  setDevEnableZoom,
  devSimpleMaterials,
  setDevSimpleMaterials,
  devHighlightColor,
  setDevHighlightColor,
  devHighlightBlend,
  setDevHighlightBlend,
  devHighlightOpacity,
  setDevHighlightOpacity,
  hasAnimations,
  devAnimPlaying,
  onAnimPlay,
  onAnimPause,
  devAnimMode,
  setDevAnimMode,
  devAnimSpeed,
  setDevAnimSpeed,
  sceneGraph,
  annotations,
}: DevPanelProps) {
  // Extract mesh names from scene graph
  const meshNames = sceneGraph
    .filter((line) => line.includes('Mesh:'))
    .map((line) => {
      const match = line.match(/Mesh:\s*"([^"]+)"/);
      return match ? match[1] : null;
    })
    .filter(Boolean) as string[];

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setDevPanelOpen((v: boolean) => !v)}
        className={`absolute top-4 right-4 z-40 flex items-center justify-center rounded-full px-5 py-2.5 text-base font-medium transition-all border border-transparent cursor-pointer ${
          devPanelOpen
            ? "bg-gray-800 text-white hover:bg-gray-700"
            : "bg-white text-gray-800 hover:bg-white/30 hover:backdrop-blur-sm hover:border-white"
        }`}
      >
        {devPanelOpen ? "Close" : "Dev"}
      </button>

      {/* Panel */}
      {devPanelOpen && (
        <div className="absolute top-16 right-4 z-40 w-80 max-h-[calc(100%-80px)] overflow-y-auto bg-white/80 backdrop-blur-md text-gray-700 text-xs font-mono rounded-2xl border border-transparent scrollbar-thin">

          {/* ── Prismic Setup ── */}
          <Section title="Prismic Setup" defaultOpen={true}>
            <div className="space-y-3">
              {/* Mesh names */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">
                  Copy these mesh names into the Prismic repeater field:
                </p>
                <div className="space-y-1">
                  {meshNames.length > 0 ? (
                    meshNames.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => copyToClipboard(name)}
                        className="flex items-center gap-2 w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-1.5 border-none cursor-pointer transition-colors group"
                        title="Click to copy"
                      >
                        <span className="text-xs font-mono text-gray-700 flex-1">{name}</span>
                        <span className="text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors">copy</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-300 italic">Loading scene...</p>
                  )}
                </div>
              </div>

              {/* Preset colors */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">
                  Available colors for the Mesh Color field:
                </p>
                <div className="space-y-1">
                  {PRISMIC_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => copyToClipboard(color.value)}
                      className="flex items-center gap-2.5 w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-1.5 border-none cursor-pointer transition-colors group"
                      title="Click to copy"
                    >
                      <div
                        className="w-5 h-5 rounded-full shrink-0 border border-gray-200"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs font-mono text-gray-700">{color.value}</span>
                      <span className="text-xs text-gray-400">{color.label}</span>
                      <span className="text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors ml-auto">copy</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currently configured annotations */}
              {annotations.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">
                    Currently configured in Prismic:
                  </p>
                  <div className="space-y-1">
                    {annotations.map((a, i) => (
                      <div
                        key={`${a.meshName}-${i}`}
                        className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-1.5"
                      >
                        {a.color && (
                          <div
                            className="w-4 h-4 rounded-full shrink-0 border border-gray-200"
                            style={{ backgroundColor: a.color }}
                          />
                        )}
                        <span className="text-xs font-mono text-gray-700">{a.meshName}</span>
                        <span className="text-xs text-gray-400">{a.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ── Inspector ── */}
          <Section title="Inspector" defaultOpen={!!selectedObject}>
            {selectedObject ? (
              <div className="space-y-0.5">
                <InfoRow
                  label="Name"
                  value={selectedObject.name}
                  copyable
                  onCopy={() => copyToClipboard(selectedObject.name)}
                />
                <InfoRow label="Type" value={selectedObject.type} />
                <InfoRow label="UUID" value={`${selectedObject.uuid.slice(0, 8)}…`} />
                <InfoRow label="Parent" value={selectedObject.parentName} />
                <InfoRow
                  label="Pos"
                  value={`${selectedObject.position.x}, ${selectedObject.position.y}, ${selectedObject.position.z}`}
                />
                <InfoRow label="Material" value={selectedObject.materialName} />
                <InfoRow label="Mat Type" value={selectedObject.materialType} />
                <InfoRow label="Verts" value={selectedObject.vertexCount.toLocaleString()} />
                <InfoRow
                  label="Tris"
                  value={Math.round(selectedObject.triangleCount).toLocaleString()}
                />
                {Object.keys(selectedObject.userData).length > 0 && (
                  <pre className="mt-1 pt-1 border-t border-gray-100 text-[10px] text-gray-400 whitespace-pre-wrap break-all leading-tight">
                    {JSON.stringify(selectedObject.userData, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-300 italic">Click a mesh to inspect</p>
            )}
          </Section>

          {/* ── Lighting ── */}
          <Section title="Lighting">
            <DevSlider
              label="Ambient"
              value={devAmbientIntensity}
              min={0} max={3} step={0.05}
              onChange={setDevAmbientIntensity}
            />
            <DevColor label="Amb Color" value={devAmbientColor} onChange={setDevAmbientColor} />
            <DevSlider
              label="Direct"
              value={devDirectIntensity}
              min={0} max={5} step={0.05}
              onChange={setDevDirectIntensity}
            />
            <DevColor label="Dir Color" value={devDirectColor} onChange={setDevDirectColor} />
            <DevSlider
              label="Exposure"
              value={devExposure}
              min={0} max={3} step={0.05}
              onChange={setDevExposure}
            />
          </Section>

          {/* ── Display ── */}
          <Section title="Display">
            <DevToggle label="Transparent" value={devTransparentBg} onChange={setDevTransparentBg} />
            {!devTransparentBg && (
              <DevColor label="BG Color" value={devBgColor} onChange={setDevBgColor} />
            )}
            <DevToggle label="Auto Rotate" value={devAutoRotate} onChange={setDevAutoRotate} />
            <DevToggle label="Zoom" value={devEnableZoom} onChange={setDevEnableZoom} />
            <DevToggle label="Simple Mat" value={devSimpleMaterials} onChange={setDevSimpleMaterials} />
            <DevColor label="Highlight" value={devHighlightColor} onChange={setDevHighlightColor} />
            <DevSelect<HighlightBlendMode>
              label="Blend"
              value={devHighlightBlend}
              options={[
                { value: "screen", label: "Screen" },
                { value: "normal", label: "Normal" },
                { value: "multiply", label: "Multiply" },
                { value: "difference", label: "Difference" },
              ]}
              onChange={setDevHighlightBlend}
            />
            <DevSlider
              label="Opacity"
              value={devHighlightOpacity}
              min={0} max={1} step={0.05}
              onChange={setDevHighlightOpacity}
            />
          </Section>

          {/* ── Animation ── */}
          {hasAnimations && (
            <Section title="Animation">
              <button
                type="button"
                onClick={devAnimPlaying ? onAnimPause : onAnimPlay}
                className="w-full text-xs font-mono py-1.5 rounded-lg cursor-pointer border transition-colors bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
              >
                {devAnimPlaying ? "Pause" : "Play"}
              </button>
              <DevSlider
                label="Speed"
                value={devAnimSpeed}
                min={0.1} max={3} step={0.1}
                onChange={setDevAnimSpeed}
              />
              <DevSelect<AnimationMode>
                label="Mode"
                value={devAnimMode}
                options={[
                  { value: "ramp", label: "Ramp" },
                  { value: "boomerang", label: "Boomerang" },
                  { value: "sinus", label: "Sinus" },
                  { value: "triangle", label: "Triangle" },
                ]}
                onChange={setDevAnimMode}
              />
            </Section>
          )}

          {/* ── Scene Graph ── */}
          <Section title="Scene Graph" defaultOpen={false}>
            {sceneGraph.length > 0 ? (
              <pre className="text-[10px] text-gray-400 whitespace-pre overflow-x-auto max-h-40 overflow-y-auto leading-tight">
                {sceneGraph.join("\n")}
              </pre>
            ) : (
              <p className="text-xs text-gray-300 italic">Loading...</p>
            )}
          </Section>

          {/* ── Export ── */}
          <div className="p-4">
            <button
              type="button"
              onClick={() => {
                const settings = {
                  autoplay: true,
                  autoRotate: devAutoRotate,
                  transparentBackground: devTransparentBg,
                  backgroundColor: devBgColor,
                  ambientLightIntensity: devAmbientIntensity,
                  ambientLightColor: devAmbientColor,
                  directLightIntensity: devDirectIntensity,
                  directLightColor: devDirectColor,
                  exposure: devExposure,
                  enableZoom: devEnableZoom,
                  simpleMaterials: devSimpleMaterials,
                  highlightColor: devHighlightColor,
                  highlightBlendMode: devHighlightBlend,
                  highlightOpacity: devHighlightOpacity,
                  animationMode: devAnimMode,
                  animationSpeed: devAnimSpeed,
                  devMode: false,
                };
                copyToClipboard(JSON.stringify(settings, null, 2));
              }}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white text-xs font-mono py-2 px-3 rounded-lg cursor-pointer border-none transition-colors"
            >
              Copy Settings JSON
            </button>
          </div>
        </div>
      )}
    </>
  );
}
