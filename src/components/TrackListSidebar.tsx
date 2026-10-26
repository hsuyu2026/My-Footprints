/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Footprints,
  Plus,
  Upload,
  HardDrive,
  Route,
  Calendar,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Crosshair,
  Filter,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Bike,
  Gauge,
  Car,
  Bus,
  TrainTrack,
  TrainFront,
  Zap,
  TramFront,
  Plane,
  Ship,
  Navigation,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  GpxTrack,
  DisplayFilterMode,
  TransportType,
  TRANSPORT_OPTIONS,
} from '../types/footprint';

interface TrackListSidebarProps {
  tracks: GpxTrack[];
  filterMode: DisplayFilterMode;
  onChangeFilterMode: (mode: DisplayFilterMode) => void;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  selectedDate: string;
  onChangeSelectedDate: (date: string) => void;
  activeTransportFilters: string[]; // supports standard types and 'custom:Name'
  onToggleTransportFilter: (filterKey: string) => void;
  onSelectAllTransportFilters: () => void;
  onClearAllTransportFilters: () => void;
  onToggleTrackVisibility: (trackId: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onDownloadTrack: (track: GpxTrack) => void;
  onOpenImport: () => void;
  onOpenBackup: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onLocateCurrentView: () => void;
}

export const TrackListSidebar: React.FC<TrackListSidebarProps> = ({
  tracks,
  filterMode,
  onChangeFilterMode,
  selectedTrackId,
  onSelectTrack,
  selectedDate,
  onChangeSelectedDate,
  activeTransportFilters,
  onToggleTransportFilter,
  onSelectAllTransportFilters,
  onClearAllTransportFilters,
  onToggleTrackVisibility,
  onDeleteTrack,
  onDownloadTrack,
  onOpenImport,
  onOpenBackup,
  isEditMode,
  onToggleEditMode,
  onLocateCurrentView,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTransportFilterPanel, setShowTransportFilterPanel] = useState(false);
  // Safe in-UI track deletion state (replaces window.confirm which is blocked in iframes)
  const [trackPendingDelete, setTrackPendingDelete] = useState<GpxTrack | null>(null);

  // Available unique dates sorted descending
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(tracks.map((t) => t.recordedDate))).sort().reverse();
    return dates;
  }, [tracks]);

  // Requirement 8: Extract all custom transport names from imported tracks
  const customTransportOptions = useMemo(() => {
    const names = new Set<string>();
    tracks.forEach((t) => {
      if (t.transportType === 'custom' && t.customTransportName?.trim()) {
        names.add(t.customTransportName.trim());
      }
    });
    return Array.from(names);
  }, [tracks]);

  // Overall Statistics
  const totalStats = useMemo(() => {
    let distance = 0;
    let duration = 0;
    tracks.forEach((t) => {
      distance += t.totalDistanceMeters;
      duration += t.totalDurationSeconds;
    });
    return {
      count: tracks.length,
      distanceKm: (distance / 1000).toFixed(1),
    };
  }, [tracks]);

  const getTransportIcon = (type: TransportType) => {
    switch (type) {
      case 'walking': return <Footprints className="w-3.5 h-3.5" />;
      case 'bicycle': return <Bike className="w-3.5 h-3.5" />;
      case 'motorcycle': return <Gauge className="w-3.5 h-3.5" />;
      case 'car': return <Car className="w-3.5 h-3.5" />;
      case 'bus': return <Bus className="w-3.5 h-3.5" />;
      case 'mrt': return <TrainTrack className="w-3.5 h-3.5" />;
      case 'railway': return <TrainFront className="w-3.5 h-3.5" />;
      case 'hsr': return <Zap className="w-3.5 h-3.5" />;
      case 'light_rail': return <TramFront className="w-3.5 h-3.5" />;
      case 'plane': return <Plane className="w-3.5 h-3.5" />;
      case 'ship': return <Ship className="w-3.5 h-3.5" />;
      default: return <Navigation className="w-3.5 h-3.5" />;
    }
  };

  const getTransportLabel = (track: GpxTrack) => {
    if (track.transportType === 'custom' && track.customTransportName) {
      return track.customTransportName;
    }
    const opt = TRANSPORT_OPTIONS.find((t) => t.type === track.transportType);
    return opt?.label || '足跡';
  };

  const handleFilterModeChange = (mode: DisplayFilterMode) => {
    onChangeFilterMode(mode);
    if (mode !== 'single') {
      onSelectTrack(null);
    }
    // Auto locate on mode change
    setTimeout(onLocateCurrentView, 100);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="md:hidden fixed bottom-6 left-4 z-[500] p-3 bg-zinc-950 border border-zinc-700 text-white rounded-full shadow-2xl"
      >
        {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed md:relative top-0 left-0 h-full z-[480] bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-300 ${
          isCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'w-84 sm:w-96'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center shrink-0 font-bold">
              <Footprints className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-sm font-bold text-white tracking-wider flex items-center space-x-1.5">
                  <span>我的足跡</span>
                  <span className="text-[10px] text-zinc-400 font-normal">My Footprints</span>
                </h1>
                <p className="text-[10px] text-zinc-400 truncate">GPX 軌跡管理與道路規劃</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        {!isCollapsed && (
          <div className="p-3 border-b border-zinc-800 grid grid-cols-3 gap-2 bg-zinc-900/30">
            <button
              type="button"
              onClick={onOpenImport}
              className="py-2 px-2 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-lg transition-colors flex items-center justify-center space-x-1 shadow"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>匯入 GPX</span>
            </button>

            <button
              type="button"
              onClick={onToggleEditMode}
              className={`py-2 px-2 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center space-x-1 ${
                isEditMode
                  ? 'bg-zinc-100 text-black border-zinc-100 font-semibold'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>{isEditMode ? '編輯中' : '繪製路徑'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenBackup}
              className="py-2 px-2 text-xs font-medium text-zinc-300 bg-zinc-900 hover:text-white hover:border-zinc-700 border border-zinc-800 rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>備份轉移</span>
            </button>
          </div>
        )}

        {/* Filter Mode Controls */}
        {!isCollapsed && (
          <div className="p-3 border-b border-zinc-800 space-y-2.5">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              展示篩選模式 (1-2-a)
            </div>
            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => handleFilterModeChange('all')}
                className={`py-1.5 rounded transition-all text-center ${
                  filterMode === 'all'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                全部足跡
              </button>
              <button
                type="button"
                onClick={() => handleFilterModeChange('single')}
                className={`py-1.5 rounded transition-all text-center ${
                  filterMode === 'single'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                單獨一份
              </button>
              <button
                type="button"
                onClick={() => handleFilterModeChange('date')}
                className={`py-1.5 rounded transition-all text-center ${
                  filterMode === 'date'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                特定日期
              </button>
            </div>

            {/* Requirement 6: Quick locate and date selector if 'date' mode */}
            {filterMode === 'date' && (
              <div className="pt-1 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>選擇指定日期</span>
                  <button
                    type="button"
                    onClick={onLocateCurrentView}
                    className="flex items-center space-x-1 text-zinc-300 hover:text-white"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>快速定位此日軌跡</span>
                  </button>
                </div>
                <div className="flex space-x-1.5">
                  <div className="relative flex-1">
                    <select
                      value={selectedDate}
                      onChange={(e) => {
                        onChangeSelectedDate(e.target.value);
                        setTimeout(onLocateCurrentView, 100);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-zinc-600 appearance-none [color-scheme:dark]"
                    >
                      {availableDates.length === 0 ? (
                        <option value="">暫無任何足跡日期</option>
                      ) : (
                        availableDates.map((d) => {
                          const count = tracks.filter((t) => t.recordedDate === d).length;
                          return (
                            <option key={d} value={d}>
                              {d} ({count} 筆足跡)
                            </option>
                          );
                        })
                      )}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={onLocateCurrentView}
                    title="立即將地圖聚焦於此日所有足跡"
                    className="px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Crosshair className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Transportation Filter Accordion (Requirement 8 included) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTransportFilterPanel(!showTransportFilterPanel)}
                className="w-full flex items-center justify-between text-xs text-zinc-300 py-1 hover:text-white"
              >
                <div className="flex items-center space-x-1.5">
                  <Filter className="w-3 h-3 text-zinc-400" />
                  <span>
                    交通方式篩選 ({activeTransportFilters.length} 項啟用)
                  </span>
                </div>
                {showTransportFilterPanel ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </button>

              {showTransportFilterPanel && (
                <div className="mt-2 p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
                  <div className="flex justify-between text-[10px] text-zinc-400 border-b border-zinc-800 pb-1">
                    <button
                      type="button"
                      onClick={onSelectAllTransportFilters}
                      className="hover:text-white"
                    >
                      全部選取
                    </button>
                    <button
                      type="button"
                      onClick={onClearAllTransportFilters}
                      className="hover:text-white"
                    >
                      全部清除
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {/* Standard built-in transport options */}
                    {TRANSPORT_OPTIONS.filter((t) => t.type !== 'custom').map((opt) => {
                      const isChecked = activeTransportFilters.includes(opt.type);
                      return (
                        <label
                          key={opt.type}
                          className="flex items-center space-x-1.5 text-[11px] text-zinc-300 hover:text-white cursor-pointer py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleTransportFilter(opt.type)}
                            className="accent-white rounded"
                          />
                          <span className="truncate">{opt.label}</span>
                        </label>
                      );
                    })}

                    {/* Standard custom option fallback */}
                    <label className="flex items-center space-x-1.5 text-[11px] text-zinc-300 hover:text-white cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={activeTransportFilters.includes('custom')}
                        onChange={() => onToggleTransportFilter('custom')}
                        className="accent-white rounded"
                      />
                      <span className="truncate">其他（自訂通用）</span>
                    </label>

                    {/* Requirement 8: User-entered custom transport names */}
                    {customTransportOptions.map((customName) => {
                      const filterKey = `custom:${customName}`;
                      const isChecked = activeTransportFilters.includes(filterKey);
                      return (
                        <label
                          key={filterKey}
                          className="flex items-center space-x-1.5 text-[11px] text-zinc-200 hover:text-white cursor-pointer py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleTransportFilter(filterKey)}
                            className="accent-white rounded"
                          />
                          <span className="truncate font-medium">其他：{customName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tracks List Header */}
        {!isCollapsed && (
          <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-[11px] text-zinc-400">
            <span>
              已載入 {tracks.length} 份足跡 · {totalStats.distanceKm} km
            </span>
            {filterMode === 'single' && (
              <span className="text-zinc-300 font-mono">點擊單一足跡切換</span>
            )}
          </div>
        )}

        {/* Tracks Scrollable List */}
        {!isCollapsed ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tracks.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl space-y-3">
                <Footprints className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                  目前尚未匯入任何 GPX 足跡
                </p>
                <button
                  type="button"
                  onClick={onOpenImport}
                  className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  立即匯入 GPX
                </button>
              </div>
            ) : (
              tracks.map((track) => {
                // Requirement 5: Selection highlight only exists when in 'single' mode
                const isSelected = filterMode === 'single' && track.id === selectedTrackId;

                // Transport filter matching
                let isFilteredIn = false;
                if (track.transportType === 'custom' && track.customTransportName?.trim()) {
                  isFilteredIn =
                    activeTransportFilters.includes(`custom:${track.customTransportName.trim()}`) ||
                    activeTransportFilters.includes('custom');
                } else {
                  isFilteredIn = activeTransportFilters.includes(track.transportType);
                }

                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      if (filterMode === 'single') {
                        onSelectTrack(track.id);
                      }
                    }}
                    className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 border-white shadow-md'
                        : !isFilteredIn
                        ? 'bg-zinc-950/40 border-zinc-900 opacity-40 hover:opacity-75'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2.5 min-w-0">
                        {/* Transport Icon */}
                        <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-zinc-200">
                          {getTransportIcon(track.transportType)}
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate group-hover:text-zinc-100">
                            {track.name}
                          </h4>
                          <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mt-0.5">
                            <span>{track.recordedDate}</span>
                            <span>·</span>
                            <span>{getTransportLabel(track)}</span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-300 mt-1">
                            {(track.totalDistanceMeters / 1000).toFixed(2)} km
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {/* Visibility Toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTrackVisibility(track.id);
                          }}
                          title={track.visible ? '隱藏此足跡' : '顯示此足跡'}
                          className={`p-1 rounded text-zinc-400 hover:text-white transition-colors ${
                            track.visible ? 'text-zinc-300' : 'text-zinc-600'
                          }`}
                        >
                          {track.visible ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Focus / Select */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (filterMode !== 'single') {
                              onChangeFilterMode('single');
                            }
                            onSelectTrack(track.id);
                          }}
                          title="定位並查看此足跡"
                          className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                        </button>

                        {/* Download GPX */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadTrack(track);
                          }}
                          title="下載 GPX 檔案"
                          className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Requirement 7: Safe in-UI delete trigger (no window.confirm block) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackPendingDelete(track);
                          }}
                          title="刪除"
                          className="p-1 rounded text-zinc-500 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex-1 py-4 flex flex-col items-center space-y-4">
            <button
              onClick={onOpenImport}
              title="匯入 GPX"
              className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleEditMode}
              title="路徑編輯"
              className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
            >
              <Route className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenBackup}
              title="備份轉移"
              className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
            >
              <HardDrive className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Requirement 7: Safe in-UI Confirmation Dialog for Deleting Track */}
      {trackPendingDelete && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl text-zinc-100 space-y-4">
            <div className="flex items-center space-x-2 text-zinc-100 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 text-zinc-300" />
              <span>確認刪除足跡</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              確定要刪除「<span className="font-semibold text-white">{trackPendingDelete.name}</span>」嗎？此操作將自本機移除該紀錄。
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setTrackPendingDelete(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTrack(trackPendingDelete.id);
                  setTrackPendingDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-lg transition-colors shadow"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
