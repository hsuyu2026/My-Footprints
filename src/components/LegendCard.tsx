/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, X, Minus, Palette } from 'lucide-react';
import { TRANSPORT_OPTIONS, TransportType, LineStyleMode } from '../types/footprint';

interface LegendCardProps {
  isOpen: boolean;
  onClose: () => void;
  activeTransportFilters: string[];
  lineStyleMode: LineStyleMode;
  onChangeLineStyleMode: (mode: LineStyleMode) => void;
  customTransportNames: string[];
}

export const LegendCard: React.FC<LegendCardProps> = ({
  isOpen,
  onClose,
  activeTransportFilters,
  lineStyleMode,
  onChangeLineStyleMode,
  customTransportNames,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-6 right-4 z-[450] w-80 bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden text-zinc-100">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-xs font-semibold tracking-wide">地圖圖例說明</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3.5 space-y-3 max-h-84 overflow-y-auto text-xs">
        {/* Style Mode Switcher inside Legend */}
        <div className="bg-zinc-900/80 p-1.5 rounded-lg border border-zinc-800/80 space-y-1.5">
          <div className="text-[11px] text-zinc-400 font-medium">圖例與線段樣式</div>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => onChangeLineStyleMode('monochrome_white')}
              className={`py-1.5 px-2 rounded flex items-center justify-center space-x-1 transition-colors ${
                lineStyleMode === 'monochrome_white'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Minus className="w-3 h-3" />
              <span>全白直線 (預設)</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeLineStyleMode('category_colors')}
              className={`py-1.5 px-2 rounded flex items-center justify-center space-x-1 transition-colors ${
                lineStyleMode === 'category_colors'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Palette className="w-3 h-3 text-cyan-500" />
              <span>交通分色直線</span>
            </button>
          </div>
        </div>

        {/* Markers info */}
        <div>
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
            節點標記
          </div>
          <div className="grid grid-cols-2 gap-2 text-zinc-300">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-black inline-block shadow" />
              <span>起點 (Start)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-black border border-white inline-block shadow" />
              <span>終點 (End)</span>
            </div>
          </div>
        </div>

        {/* Transportation Line Styles */}
        <div className="border-t border-zinc-800/80 pt-2.5">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
            交通方式線條
          </div>
          <div className="space-y-2">
            {TRANSPORT_OPTIONS.filter((t) => t.type !== 'custom').map((opt) => {
              const isFilteredIn = activeTransportFilters.includes(opt.type);
              const color = lineStyleMode === 'category_colors' ? opt.color : '#ffffff';

              return (
                <div
                  key={opt.type}
                  className={`flex items-center justify-between ${
                    isFilteredIn ? 'text-zinc-200' : 'text-zinc-600'
                  }`}
                >
                  <span className="text-[11px] truncate">{opt.label}</span>
                  <div className="w-24 flex items-center justify-end">
                    <svg className="w-20 h-2.5 overflow-visible">
                      <line
                        x1="0"
                        y1="5"
                        x2="80"
                        y2="5"
                        stroke={isFilteredIn ? color : '#3f3f46'}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}

            {/* Custom Transport Options */}
            {customTransportNames.map((customName) => {
              const filterKey = `custom:${customName}`;
              const isFilteredIn = activeTransportFilters.includes(filterKey);
              const color = lineStyleMode === 'category_colors' ? '#eab308' : '#ffffff';

              return (
                <div
                  key={filterKey}
                  className={`flex items-center justify-between ${
                    isFilteredIn ? 'text-zinc-200' : 'text-zinc-600'
                  }`}
                >
                  <span className="text-[11px] truncate">其他（{customName}）</span>
                  <div className="w-24 flex items-center justify-end">
                    <svg className="w-20 h-2.5 overflow-visible">
                      <line
                        x1="0"
                        y1="5"
                        x2="80"
                        y2="5"
                        stroke={isFilteredIn ? color : '#3f3f46'}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
