/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Upload,
  FileCode,
  Check,
  Footprints,
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
} from 'lucide-react';
import {
  TransportCategory,
  TransportType,
  TRANSPORT_OPTIONS,
} from '../types/footprint';
import { parseGpxXml } from '../utils/gpxParser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (parsedTrack: ReturnType<typeof parseGpxXml>) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [selectedCategory, setSelectedCategory] = useState<TransportCategory>('walking');
  const [selectedType, setSelectedType] = useState<TransportType>('walking');
  const [customTransportName, setCustomTransportName] = useState('');
  const [trackNameOverride, setTrackNameOverride] = useState('');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [applyDouglasPeucker, setApplyDouglasPeucker] = useState(false);
  const [peuckerEpsilon, setPeuckerEpsilon] = useState<number>(5);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
    };
    reader.onerror = () => {
      setErrorMessage('讀取檔案失敗，請重新嘗試');
    };
    reader.readAsText(file);
  };

  const handleCategoryChange = (cat: TransportCategory) => {
    setSelectedCategory(cat);
    const firstOption = TRANSPORT_OPTIONS.find((t) => t.category === cat);
    if (firstOption) {
      setSelectedType(firstOption.type);
    }
  };

  const handleSubmit = () => {
    if (!fileContent.trim()) {
      setErrorMessage('請先選擇或貼上 GPX 檔案內容');
      return;
    }

    try {
      setErrorMessage(null);
      const parsed = parseGpxXml(
        fileContent,
        fileName || 'imported_track.gpx',
        selectedCategory,
        selectedType,
        customTransportName.trim(),
        applyDouglasPeucker,
        peuckerEpsilon
      );

      if (trackNameOverride.trim()) {
        parsed.name = trackNameOverride.trim();
      }

      onImportSuccess(parsed);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'GPX 檔案解析失敗，請確認檔案內容格式');
    }
  };

  const getIcon = (type: TransportType) => {
    switch (type) {
      case 'walking': return <Footprints className="w-4 h-4" />;
      case 'bicycle': return <Bike className="w-4 h-4" />;
      case 'motorcycle': return <Gauge className="w-4 h-4" />;
      case 'car': return <Car className="w-4 h-4" />;
      case 'bus': return <Bus className="w-4 h-4" />;
      case 'mrt': return <TrainTrack className="w-4 h-4" />;
      case 'railway': return <TrainFront className="w-4 h-4" />;
      case 'hsr': return <Zap className="w-4 h-4" />;
      case 'light_rail': return <TramFront className="w-4 h-4" />;
      case 'plane': return <Plane className="w-4 h-4" />;
      case 'ship': return <Ship className="w-4 h-4" />;
      default: return <Navigation className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-zinc-100" />
            <h2 className="text-base font-semibold text-white tracking-wide">匯入 GPX 足跡</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Source Tab */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setActiveTab('file')}
              className={`pb-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'file'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              檔案上傳 (.gpx)
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`pb-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'text'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              直接貼上 XML 原始碼
            </button>
          </div>

          {activeTab === 'file' ? (
            <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-600 transition-colors rounded-lg p-6 text-center cursor-pointer relative bg-zinc-900/30">
              <input
                type="file"
                accept=".gpx,application/gpx+xml,text/xml"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileCode className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-200">
                {fileName ? fileName : '點擊或拖曳 GPX 檔案至此處'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">支援標準 GPX 1.0 與 1.1 航跡格式</p>
            </div>
          ) : (
            <div>
              <textarea
                value={fileContent}
                onChange={(e) => {
                  setFileContent(e.target.value);
                  setFileName('custom_input.gpx');
                }}
                placeholder="在此貼上 <?xml ... <gpx>...</gpx> 內容"
                className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 placeholder-zinc-600 resize-none"
              />
            </div>
          )}

          {/* Optional Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              自訂足跡名稱（選填）
            </label>
            <input
              type="text"
              value={trackNameOverride}
              onChange={(e) => setTrackNameOverride(e.target.value)}
              placeholder="留空將自動讀取 GPX 檔內標題"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
            />
          </div>

          {/* Transportation Category Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              選擇交通分類
            </label>
            <div className="grid grid-cols-4 gap-2">
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
                  className={`py-2 px-2 text-xs rounded-lg border text-center transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Subtype Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              具體交通方式
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TRANSPORT_OPTIONS.filter((t) => t.category === selectedCategory).map((opt) => {
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelectedType(opt.type)}
                    className={`flex items-center space-x-2 py-2 px-3 rounded-lg border text-xs text-left transition-all ${
                      isSelected
                        ? 'bg-zinc-100 text-black border-zinc-100 font-semibold shadow'
                        : 'bg-zinc-900/60 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
                    }`}
                  >
                    <span>{getIcon(opt.type)}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom transport input if other/custom */}
          {selectedType === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                請輸入交通工具名稱
              </label>
              <input
                type="text"
                value={customTransportName}
                onChange={(e) => setCustomTransportName(e.target.value)}
                placeholder="例如：直升機、纜車、溜冰鞋、馬車"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
              />
            </div>
          )}

          {/* Requirement 4: Douglas-Peucker Algorithm noise & drift cleaning toggle */}
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
            <div
              onClick={() => setApplyDouglasPeucker(!applyDouglasPeucker)}
              className="flex items-start space-x-2.5 cursor-pointer select-none"
            >
              <div className="pt-0.5">
                {applyDouglasPeucker ? (
                  <div className="w-3.5 h-3.5 bg-white border border-white rounded-[2px] shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 bg-transparent border border-zinc-500 rounded-[2px] shrink-0" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white">
                  以 Douglas-Peucker Algorithm 清理小型飄移與雜訊
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  過濾 GPS 定位微幅跳動與靜止漂移雜訊，保留關鍵折點並使軌跡更加平順精確
                </div>
              </div>
            </div>

            {applyDouglasPeucker && (
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">容差半徑閾值：</span>
                <div className="flex space-x-1.5">
                  {[
                    { label: '3 公尺 (精緻)', val: 3 },
                    { label: '5 公尺 (建議)', val: 5 },
                    { label: '10 公尺 (平滑)', val: 10 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setPeuckerEpsilon(opt.val)}
                      className={`px-2.5 py-1 rounded text-[10px] transition-colors ${
                        peuckerEpsilon === opt.val
                          ? 'bg-white text-black font-semibold'
                          : 'bg-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-lg transition-colors flex items-center space-x-1.5 shadow"
          >
            <Check className="w-4 h-4" />
            <span>確認匯入</span>
          </button>
        </div>
      </div>
    </div>
  );
};
