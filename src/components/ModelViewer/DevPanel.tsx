import React from "react";
import type { SelectedObjectInfo } from "./types";

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
  sceneGraph,
}: DevPanelProps) {
  return (
    <>
      {/* Toggle button — always visible */}
      <button
        type="button"
        onClick={() => setDevPanelOpen((v: boolean) => !v)}
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
  );
}
