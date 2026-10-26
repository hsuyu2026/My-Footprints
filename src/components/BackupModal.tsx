/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  Upload,
  HardDrive,
  Check,
  X,
  AlertTriangle,
  FileJson,
  Sparkles,
} from 'lucide-react';
import { BackupData, GpxTrack } from '../types/footprint';
import { getDemoTracks } from '../utils/demoData';

interface BackupModalProps {
  isOpen: boolean;
  tracks: GpxTrack[];
  onClose: () => void;
  onRestoreBackup: (tracks: GpxTrack[], mode: 'merge' | 'replace') => void;
  onLoadDemoTracks: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  tracks,
  onClose,
  onRestoreBackup,
  onLoadDemoTracks,
}) => {
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [backupFileContent, setBackupFileContent] = useState<BackupData | null>(null);
  const [backupFileName, setBackupFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Export current tracks as JSON
  const handleExportBackup = () => {
    const backup: BackupData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      tracks,
    };

    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `my_footprints_backup_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('備份檔案已順利匯出');
  };

  const handleBackupFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setBackupFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as BackupData;
        if (!parsed.tracks || !Array.isArray(parsed.tracks)) {
          throw new Error('備份檔案格式無效：缺少 tracks 陣列');
        }
        setBackupFileContent(parsed);
      } catch (err: any) {
        setErrorMsg('讀取或解析備份檔失敗：' + (err.message || '無效 JSON'));
      }
    };
    reader.readAsText(file);
  };

  const handleApplyRestore = () => {
    if (!backupFileContent || !backupFileContent.tracks) return;
    onRestoreBackup(backupFileContent.tracks, importMode);
    setSuccessMsg(`已成功還原 ${backupFileContent.tracks.length} 筆足跡紀錄！`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-white" />
            <h2 className="text-base font-semibold text-white tracking-wide">
              足跡備份與跨裝置轉移
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Section 1: Export */}
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white">匯出備份檔案</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  將本機所有已匯入與創建的 GPX 資料打包為單一檔案 ({tracks.length} 筆)
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={tracks.length === 0}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出備份</span>
              </button>
            </div>
          </div>

          {/* Section 2: Import / Restore */}
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-white">還原 / 轉移備份至此裝置</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                選取從其他裝置匯出的 .json 備份檔以還原所有足跡
              </p>
            </div>

            <div className="border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg p-4 text-center cursor-pointer relative bg-zinc-900/50">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleBackupFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileJson className="w-6 h-6 text-zinc-400 mx-auto mb-1" />
              <div className="text-xs font-medium text-zinc-200">
                {backupFileName ? backupFileName : '選擇備份檔 (.json)'}
              </div>
              {backupFileContent && (
                <div className="text-[11px] text-zinc-400 mt-1">
                  共偵測到 {backupFileContent.tracks?.length || 0} 筆足跡紀錄
                </div>
              )}
            </div>

            {backupFileContent && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-300">還原模式</div>
                <div className="flex space-x-3">
                  <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="restore_mode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="accent-white"
                    />
                    <span>合併（保留現有，加入新檔案）</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="restore_mode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-white"
                    />
                    <span>覆蓋（完全替換為此備份）</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleApplyRestore}
                  className="w-full mt-2 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>確認執行還原</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Sample Demo footprints */}
          <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/20 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white">載入示範足跡資料</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                包含象山步道、日月潭自行車、捷運紅線與北海岸自駕等示範航跡
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onLoadDemoTracks();
                setSuccessMsg('已成功載入示範足跡！');
              }}
              className="px-3 py-1.5 border border-zinc-700 hover:bg-zinc-800 text-xs text-zinc-200 rounded-lg transition-colors flex items-center space-x-1"
            >
              <span>載入示範</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-zinc-900 border border-zinc-600 text-xs text-white rounded-lg flex items-center space-x-2">
              <Check className="w-4 h-4 text-white" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-800 bg-zinc-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
