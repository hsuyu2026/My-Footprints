/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Route,
  Trash2,
  Save,
  Download,
  Calendar,
  Clock,
  Check,
  X,
  Compass,
  CornerDownRight,
  Loader2,
  GitCommit,
  Navigation,
  ArrowRight,
} from 'lucide-react';
import {
  TransportCategory,
  TransportType,
  TRANSPORT_OPTIONS,
  EditorWaypoint,
  GpxTrack,
  EditRoutingMode,
  EditorSegmentConfig,
} from '../types/footprint';
import { generateGpxXml } from '../utils/gpxGenerator';
import { parseGpxXml } from '../utils/gpxParser';

interface EditRouteModalProps {
  isOpen: boolean;
  waypoints: EditorWaypoint[];
  segmentConfigs: EditorSegmentConfig[];
  onToggleSegmentMode: (segmentIndex: number) => void;
  currentSegmentMode: EditRoutingMode;
  onChangeCurrentSegmentMode: (mode: EditRoutingMode) => void;
  routeCoords: [number, number][];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  isLoadingRoute: boolean;
  onRemoveWaypoint: (index: number) => void;
  onClearWaypoints: () => void;
  onCancel: () => void;
  onSaveAndImport: (newTrack: GpxTrack) => void;
  activeTransportType: TransportType;
  onChangeTransportType: (type: TransportType) => void;
}

export const EditRouteModal: React.FC<EditRouteModalProps> = ({
  isOpen,
  waypoints,
  segmentConfigs,
  onToggleSegmentMode,
  currentSegmentMode,
  onChangeCurrentSegmentMode,
  routeCoords,
  totalDistanceMeters,
  totalDurationSeconds,
  isLoadingRoute,
  onRemoveWaypoint,
  onClearWaypoints,
  onCancel,
  onSaveAndImport,
  activeTransportType,
  onChangeTransportType,
}) => {
  const [trackName, setTrackName] = useState('新建混合軌跡');
  const [selectedCategory, setSelectedCategory] = useState<TransportCategory>('self_drive');
  const [selectedType, setSelectedType] = useState<TransportType>(activeTransportType || 'car');
  const [customTransportName, setCustomTransportName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });

  if (!isOpen) return null;

  const handleCategoryChange = (cat: TransportCategory) => {
    setSelectedCategory(cat);
    const firstOption = TRANSPORT_OPTIONS.find((t) => t.category === cat);
    if (firstOption) {
      setSelectedType(firstOption.type);
      onChangeTransportType(firstOption.type);
    }
  };

  const handleTypeChange = (type: TransportType) => {
    setSelectedType(type);
    onChangeTransportType(type);
  };

  const buildGpx = () => {
    setValidationError(null);
    if (routeCoords.length < 2) {
      setValidationError('請先在地圖上點擊至少兩點（起點與終點）以建立路徑');
      return null;
    }

    const gpxXml = generateGpxXml({
      name: trackName.trim() || '新建混合軌跡',
      category: selectedCategory,
      transportType: selectedType,
      customTransportName: selectedType === 'custom' ? customTransportName.trim() : undefined,
      startDateTime: dateTime,
      points: routeCoords.map((c) => ({ lat: c[0], lon: c[1] })),
    });

    const parsed = parseGpxXml(
      gpxXml,
      `${(trackName.trim() || 'route').replace(/\s+/g, '_')}.gpx`,
      selectedCategory,
      selectedType,
      customTransportName.trim()
    );

    return { gpxXml, parsed };
  };

  const handleSaveAndImport = () => {
    const res = buildGpx();
    if (!res) return;
    onSaveAndImport(res.parsed);
  };

  const handleDownloadOnly = () => {
    const res = buildGpx();
    if (!res) return;

    const blob = new Blob([res.gpxXml], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(trackName.trim() || 'route').replace(/\s+/g, '_')}.gpx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs} 小時 ${mins} 分鐘`;
    return `${Math.max(1, mins)} 分鐘`;
  };

  return (
    <div className="absolute top-16 right-4 z-[500] w-96 max-h-[calc(100vh-5rem)] bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center space-x-2">
          <Route className="w-4 h-4 text-white" />
          <h2 className="text-sm font-semibold tracking-wide">路徑規劃編輯器</h2>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 overflow-y-auto">
        {/* Next Point Default Mode */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-300">
              下一個點規劃模式 (Requirement 9: 可混合)
            </label>
            <span className="text-[10px] text-zinc-400">點擊地圖時採用</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => onChangeCurrentSegmentMode('road_snap')}
              className={`py-1.5 px-2 rounded flex items-center justify-center space-x-1.5 transition-colors ${
                currentSegmentMode === 'road_snap'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>導航吸附</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeCurrentSegmentMode('straight_line')}
              className={`py-1.5 px-2 rounded flex items-center justify-center space-x-1.5 transition-colors ${
                currentSegmentMode === 'straight_line'
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>點對點直線</span>
            </button>
          </div>
        </div>

        {/* Distance & Time Metric */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-900/80 border border-zinc-800 rounded-lg p-3">
          <div>
            <div className="text-[11px] text-zinc-400">總里程</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {(totalDistanceMeters / 1000).toFixed(2)} km
            </div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">預估耗時</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {formatDuration(totalDurationSeconds)}
            </div>
          </div>
          {isLoadingRoute && (
            <div className="col-span-2 flex items-center space-x-1.5 text-xs text-zinc-300 pt-1 border-t border-zinc-800">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>道路路網計算中...</span>
            </div>
          )}
        </div>

        {/* Waypoints & Mixed Segment Mode Control */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-300">
              節點與路段模式 ({waypoints.length} 點)
            </span>
            {waypoints.length > 0 && (
              <button
                type="button"
                onClick={onClearWaypoints}
                className="text-[11px] text-zinc-400 hover:text-white transition-colors"
              >
                全部清空
              </button>
            )}
          </div>
          {waypoints.length === 0 ? (
            <div className="p-4 border border-dashed border-zinc-800 rounded-lg text-center text-xs text-zinc-400">
              請在地圖上點擊以放置「起點」
            </div>
          ) : (
            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {waypoints.map((wp, idx) => {
                let badge = `${idx + 1}`;
                let label = `途經點 ${idx}`;
                if (idx === 0) {
                  badge = '起';
                  label = '起點';
                } else if (idx === waypoints.length - 1 && waypoints.length > 1) {
                  badge = '終';
                  label = '終點';
                }

                const segConfig = segmentConfigs[idx];

                return (
                  <React.Fragment key={wp.id}>
                    <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 rounded px-2.5 py-1.5 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[10px] flex items-center justify-center shrink-0">
                          {badge}
                        </span>
                        <span className="font-medium text-zinc-200">{label}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveWaypoint(idx)}
                        className="text-zinc-500 hover:text-white p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Segment connector toggle between wp[idx] and wp[idx+1] */}
                    {segConfig && (
                      <div className="flex items-center justify-center px-4 py-0.5">
                        <div className="flex items-center space-x-2 text-[10px] bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-0.5">
                          <span className="text-zinc-500">路段 {idx + 1}：</span>
                          <button
                            type="button"
                            onClick={() => onToggleSegmentMode(idx)}
                            className="font-semibold text-zinc-200 hover:text-white flex items-center space-x-1"
                            title="點擊切換此路段模式（導航吸附 / 直線）"
                          >
                            <span>
                              {segConfig.mode === 'road_snap' ? '導航吸附' : '點對點直線'}
                            </span>
                            <span className="text-zinc-400 text-[9px]">(點擊切換)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Track Title */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">足跡名稱</label>
          <input
            type="text"
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Date & Time */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">出發日期與時間</label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
          />
        </div>

        {/* Transportation Mode */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">交通方式</label>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {(
              [
                { id: 'walking', name: '步行' },
                { id: 'self_drive', name: '自駕' },
                { id: 'transit', name: '大眾運輸' },
                { id: 'other', name: '其他' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`py-1.5 text-[11px] rounded border transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {TRANSPORT_OPTIONS.filter((t) => t.category === selectedCategory).map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleTypeChange(opt.type)}
                className={`py-1.5 px-2 rounded border text-[11px] truncate transition-colors text-center ${
                  selectedType === opt.type
                    ? 'bg-zinc-200 text-black border-zinc-200 font-semibold'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {selectedType === 'custom' && (
            <div className="mt-2">
              <input
                type="text"
                value={customTransportName}
                onChange={(e) => setCustomTransportName(e.target.value)}
                placeholder="輸入自訂交通工具名稱"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
              />
            </div>
          )}
        </div>

        {validationError && (
          <div className="p-2.5 bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded-lg">
            {validationError}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 space-y-2">
        <button
          type="button"
          disabled={waypoints.length < 2 || isLoadingRoute}
          onClick={handleSaveAndImport}
          className="w-full py-2 px-3 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-lg transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow"
        >
          <Save className="w-3.5 h-3.5" />
          <span>儲存並匯入足跡列表</span>
        </button>

        <div className="flex space-x-2">
          <button
            type="button"
            disabled={waypoints.length < 2}
            onClick={handleDownloadOnly}
            className="flex-1 py-1.5 px-3 text-xs border border-zinc-700 hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center space-x-1 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下載 GPX 檔</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            退出編輯
          </button>
        </div>
      </div>
    </div>
  );
};
