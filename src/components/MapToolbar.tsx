/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Globe,
  Sun,
  Moon,
  Type,
  Layers,
  CloudFog,
  Sliders,
  ChevronDown,
  Palette,
  Minus,
} from 'lucide-react';
import { MapStyleType, FogSettings, LineStyleMode } from '../types/footprint';

interface MapToolbarProps {
  mapStyle: MapStyleType;
  onChangeMapStyle: (style: MapStyleType) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  lineStyleMode: LineStyleMode;
  onChangeLineStyleMode: (mode: LineStyleMode) => void;
  fogSettings: FogSettings;
  onChangeFogSettings: (newSettings: FogSettings) => void;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  mapStyle,
  onChangeMapStyle,
  showLabels,
  onToggleLabels,
  showLegend,
  onToggleLegend,
  lineStyleMode,
  onChangeLineStyleMode,
  fogSettings,
  onChangeFogSettings,
}) => {
  const [showFogPopover, setShowFogPopover] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);

  const styleOptions: { id: MapStyleType; label: string; icon: React.ReactNode }[] = [
    { id: 'satellite', label: '衛星 (預設)', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'clean_light', label: '簡潔亮', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'clean_dark', label: '簡潔暗', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  const currentStyle = styleOptions.find((s) => s.id === mapStyle) || styleOptions[0];

  return (
    <div className="absolute top-4 right-4 z-[450] flex flex-wrap items-center justify-end gap-2">
      {/* Map Style Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowStyleMenu(!showStyleMenu);
            setShowFogPopover(false);
            setShowLineMenu(false);
          }}
          className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 text-white rounded-lg text-xs font-medium backdrop-blur-md transition-colors shadow-lg"
        >
          {currentStyle.icon}
          <span>{currentStyle.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {showStyleMenu && (
          <div className="absolute right-0 mt-1.5 w-36 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl py-1 z-50 text-xs">
            {styleOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChangeMapStyle(opt.id);
                  setShowStyleMenu(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-left transition-colors ${
                  mapStyle === opt.id
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Line Style Mode Switcher (全白直線 / 交通分色) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowLineMenu(!showLineMenu);
            setShowStyleMenu(false);
            setShowFogPopover(false);
          }}
          className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 text-white rounded-lg text-xs font-medium backdrop-blur-md transition-colors shadow-lg"
          title="切換線段顏色顯示方式"
        >
          {lineStyleMode === 'monochrome_white' ? (
            <Minus className="w-3.5 h-3.5 text-white" />
          ) : (
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>{lineStyleMode === 'monochrome_white' ? '全白直線' : '交通分色'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {showLineMenu && (
          <div className="absolute right-0 mt-1.5 w-44 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl py-1 z-50 text-xs">
            <button
              type="button"
              onClick={() => {
                onChangeLineStyleMode('monochrome_white');
                setShowLineMenu(false);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-left transition-colors ${
                lineStyleMode === 'monochrome_white'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
              <span>全白直線 (預設)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeLineStyleMode('category_colors');
                setShowLineMenu(false);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-left transition-colors ${
                lineStyleMode === 'category_colors'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>交通分色直線</span>
            </button>
          </div>
        )}
      </div>

      {/* Toggle Map Text / Labels */}
      <button
        type="button"
        onClick={onToggleLabels}
        title="切換地圖文字與地名標籤"
        className={`flex items-center space-x-1.5 px-3 py-2 border rounded-lg text-xs font-medium backdrop-blur-md transition-colors shadow-lg ${
          showLabels
            ? 'bg-white text-black border-white'
            : 'bg-zinc-950/90 text-zinc-400 border-zinc-800 hover:text-white'
        }`}
      >
        <Type className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">文字標籤</span>
      </button>

      {/* Toggle Legend */}
      <button
        type="button"
        onClick={onToggleLegend}
        title="顯示/隱藏圖例"
        className={`flex items-center space-x-1.5 px-3 py-2 border rounded-lg text-xs font-medium backdrop-blur-md transition-colors shadow-lg ${
          showLegend
            ? 'bg-white text-black border-white'
            : 'bg-zinc-950/90 text-zinc-400 border-zinc-800 hover:text-white'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">圖例</span>
      </button>

      {/* Fog of War Mode (迷霧模式) Toggle & Controls */}
      <div className="relative">
        <div className="flex items-center bg-zinc-950/90 border border-zinc-800 rounded-lg shadow-lg backdrop-blur-md overflow-hidden">
          <button
            type="button"
            onClick={() => {
              onChangeFogSettings({ ...fogSettings, enabled: !fogSettings.enabled });
            }}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium transition-colors ${
              fogSettings.enabled
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CloudFog className="w-3.5 h-3.5" />
            <span>迷霧模式</span>
          </button>

          {fogSettings.enabled && (
            <button
              type="button"
              onClick={() => {
                setShowFogPopover(!showFogPopover);
                setShowStyleMenu(false);
                setShowLineMenu(false);
              }}
              title="調整迷霧參數"
              className="px-2 py-2 border-l border-zinc-800 text-zinc-400 hover:text-white bg-zinc-900/60 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Fog Adjustment Popover: 5m to 500m */}
        {showFogPopover && fogSettings.enabled && (
          <div className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-4 z-50 text-xs text-zinc-200 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-white">迷霧模式參數設定</span>
              <span className="text-[10px] text-zinc-400 font-mono">5m - 500m</span>
            </div>

            {/* Opacity Slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">迷霧不透明度</span>
                <span className="font-mono text-white">
                  {Math.round(fogSettings.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={fogSettings.opacity}
                onChange={(e) =>
                  onChangeFogSettings({ ...fogSettings, opacity: parseFloat(e.target.value) })
                }
                className="w-full accent-white cursor-pointer"
              />
            </div>

            {/* Buffer Radius Slider (5m to 500m) */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">環域擴張半徑</span>
                <span className="font-mono text-white">
                  {fogSettings.bufferRadiusMeters} m
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={fogSettings.bufferRadiusMeters}
                onChange={(e) =>
                  onChangeFogSettings({
                    ...fogSettings,
                    bufferRadiusMeters: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <button
                  type="button"
                  onClick={() => onChangeFogSettings({ ...fogSettings, bufferRadiusMeters: 5 })}
                  className="hover:text-white"
                >
                  5m
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFogSettings({ ...fogSettings, bufferRadiusMeters: 50 })}
                  className="hover:text-white text-zinc-300 font-semibold"
                >
                  50m (預設)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFogSettings({ ...fogSettings, bufferRadiusMeters: 200 })}
                  className="hover:text-white"
                >
                  200m
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFogSettings({ ...fogSettings, bufferRadiusMeters: 500 })}
                  className="hover:text-white"
                >
                  500m
                </button>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-2">
              開啟迷霧模式後，地圖路徑線條將隱藏，僅露出環域所揭示的真實底圖。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
