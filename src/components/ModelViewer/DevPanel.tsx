import React, { useState } from "react";
import type { SelectedObjectInfo, AnimationMode } from "./types";

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
        className="w-full flex items-center justify-between px-2.5 py-1.5 bg-transparent border-none cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <span className="text-[9px] uppercase tracking-[0.08em] font-semibold text-gray-400">
          {title}
        </span>
        <svg
          className={`w-2.5 h-2.5 text-gray-300 transition-transform ${open ? "" : "-rotate-90"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-2.5 pb-2 space-y-1">{children}</div>}
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
      <span className="text-[10px] text-gray-400 w-[72px] shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-[3px] appearance-none bg-gray-200 rounded cursor-pointer accent-gray-600"
      />
      <span className="text-[10px] text-gray-500 w-[32px] text-right tabular-nums">
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
      <span className="text-[10px] text-gray-400 w-[72px] shrink-0">{label}</span>
      <div className="flex-1" />
      <span className="text-[10px] text-gray-500 tabular-nums">{value}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-4 h-4 rounded cursor-pointer border border-gray-200 bg-transparent p-0"
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
      <span className="text-[10px] text-gray-400 w-[72px] shrink-0">{label}</span>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-6 h-3.5 rounded-full cursor-pointer transition-colors border-none ${
          value ? "bg-gray-700" : "bg-gray-200"
        }`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
            value ? "translate-x-[11px]" : "translate-x-[1px]"
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
      <span className="text-[10px] text-gray-400 w-[72px] shrink-0">{label}</span>
      <div className="flex-1" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-mono rounded px-1.5 py-0.5 cursor-pointer outline-none"
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
      <span className="text-[10px] text-gray-400 shrink-0">{label}</span>
      {copyable ? (
        <button
          onClick={onCopy}
          className="text-right text-[10px] text-blue-500 hover:text-blue-400 cursor-pointer break-all bg-transparent border-none p-0 font-mono leading-tight"
          title="Click to copy"
        >
          {value}
        </button>
      ) : (
        <span className="text-[10px] text-gray-600 text-right break-all leading-tight">
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
  hasAnimations,
  devAnimPlaying,
  onAnimPlay,
  onAnimPause,
  devAnimMode,
  setDevAnimMode,
  devAnimSpeed,
  setDevAnimSpeed,
  sceneGraph,
}: DevPanelProps) {
  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setDevPanelOpen((v: boolean) => !v)}
        className="absolute top-2.5 right-2.5 z-40 bg-white/90 hover:bg-white text-gray-600 text-[10px] font-mono px-2.5 py-1 rounded-md cursor-pointer backdrop-blur-sm border border-gray-200/50 shadow-sm transition-colors"
      >
        {devPanelOpen ? "Close" : "Dev"}
      </button>

      {/* Panel */}
      {devPanelOpen && (
        <div className="absolute top-10 right-2.5 z-40 w-64 max-h-[calc(100%-48px)] overflow-y-auto bg-white/95 backdrop-blur-md text-gray-700 text-[10px] font-mono rounded-lg border border-gray-200/50 shadow-xl scrollbar-thin">
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
                  <pre className="mt-1 pt-1 border-t border-gray-100 text-[9px] text-gray-400 whitespace-pre-wrap break-all leading-tight">
                    {JSON.stringify(selectedObject.userData, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-gray-300 italic">Click a mesh to inspect</p>
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
          </Section>

          {/* ── Animation ── */}
          {hasAnimations && (
            <Section title="Animation">
              <button
                type="button"
                onClick={devAnimPlaying ? onAnimPause : onAnimPlay}
                className="w-full text-[10px] font-mono py-1 rounded cursor-pointer border transition-colors bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
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
              <pre className="text-[9px] text-gray-400 whitespace-pre overflow-x-auto max-h-32 overflow-y-auto leading-tight">
                {sceneGraph.join("\n")}
              </pre>
            ) : (
              <p className="text-[10px] text-gray-300 italic">Loading…</p>
            )}
          </Section>

          {/* ── Export ── */}
          <div className="p-2.5">
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
                  animationMode: devAnimMode,
                  animationSpeed: devAnimSpeed,
                  devMode: false,
                };
                copyToClipboard(JSON.stringify(settings, null, 2));
              }}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white text-[10px] font-mono py-1.5 px-2 rounded cursor-pointer border-none transition-colors"
            >
              Copy Settings JSON
            </button>
          </div>
        </div>
      )}
    </>
  );
}
