/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransportCategory = 'walking' | 'self_drive' | 'transit' | 'other';

export type TransportType =
  | 'walking'
  // 自駕
  | 'bicycle'
  | 'motorcycle'
  | 'car'
  // 大眾運輸
  | 'bus'
  | 'mrt'
  | 'railway'
  | 'hsr'
  | 'light_rail'
  // 其他
  | 'plane'
  | 'ship'
  | 'custom';

export type LineStyleMode = 'monochrome_white' | 'category_colors';

export type EditRoutingMode = 'road_snap' | 'straight_line';

export interface TransportOption {
  type: TransportType;
  category: TransportCategory;
  label: string;
  categoryLabel: string;
  iconName: string;
  color: string; // distinct clean color for category_colors mode
  dashPattern?: string;
  lineWeight?: number;
}

export const TRANSPORT_OPTIONS: TransportOption[] = [
  // 步行
  {
    type: 'walking',
    category: 'walking',
    label: '步行',
    categoryLabel: '步行',
    iconName: 'Footprints',
    color: '#4ade80', // green-400
    lineWeight: 3.5,
  },
  // 自駕
  {
    type: 'bicycle',
    category: 'self_drive',
    label: '腳踏車',
    categoryLabel: '自駕',
    iconName: 'Bike',
    color: '#06b6d4', // cyan-500
    lineWeight: 3.5,
  },
  {
    type: 'motorcycle',
    category: 'self_drive',
    label: '機車',
    categoryLabel: '自駕',
    iconName: 'Gauge',
    color: '#f59e0b', // amber-500
    lineWeight: 4,
  },
  {
    type: 'car',
    category: 'self_drive',
    label: '汽車',
    categoryLabel: '自駕',
    iconName: 'Car',
    color: '#3b82f6', // blue-500
    lineWeight: 4,
  },
  // 大眾運輸
  {
    type: 'bus',
    category: 'transit',
    label: '公車',
    categoryLabel: '大眾運輸',
    iconName: 'Bus',
    color: '#fb923c', // orange-400
    lineWeight: 4,
  },
  {
    type: 'mrt',
    category: 'transit',
    label: '捷運',
    categoryLabel: '大眾運輸',
    iconName: 'TrainTrack',
    color: '#10b981', // emerald-500
    lineWeight: 4.5,
  },
  {
    type: 'railway',
    category: 'transit',
    label: '鐵路',
    categoryLabel: '大眾運輸',
    iconName: 'TrainFront',
    color: '#a855f7', // purple-500
    lineWeight: 4.5,
  },
  {
    type: 'hsr',
    category: 'transit',
    label: '高鐵',
    categoryLabel: '大眾運輸',
    iconName: 'Zap',
    color: '#f43f5e', // rose-500
    lineWeight: 5,
  },
  {
    type: 'light_rail',
    category: 'transit',
    label: '輕軌',
    categoryLabel: '大眾運輸',
    iconName: 'TramFront',
    color: '#14b8a6', // teal-500
    lineWeight: 4,
  },
  // 其他
  {
    type: 'plane',
    category: 'other',
    label: '飛機',
    categoryLabel: '其他',
    iconName: 'Plane',
    color: '#38bdf8', // sky-400
    lineWeight: 3.5,
  },
  {
    type: 'ship',
    category: 'other',
    label: '船隻',
    categoryLabel: '其他',
    iconName: 'Ship',
    color: '#6366f1', // indigo-500
    lineWeight: 3.5,
  },
  {
    type: 'custom',
    category: 'other',
    label: '其他（自訂）',
    categoryLabel: '其他',
    iconName: 'Navigation',
    color: '#eab308', // yellow-500
    lineWeight: 3.5,
  },
];

export interface TrackPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
}

export interface GpxTrack {
  id: string;
  name: string;
  fileName: string;
  category: TransportCategory;
  transportType: TransportType;
  customTransportName?: string;
  recordedDate: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  points: TrackPoint[];
  rawGpxXml: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  visible: boolean;
  createdAt: number;
}

export type DisplayFilterMode = 'all' | 'single' | 'date';

export type MapStyleType = 'satellite' | 'clean_light' | 'clean_dark';

export interface FogSettings {
  enabled: boolean;
  opacity: number; // 0.1 to 0.95 (default 0.75)
  bufferRadiusMeters: number; // 5 to 500 (default 50)
}

export interface EditorWaypoint {
  id: string;
  lat: number;
  lon: number;
  role: 'start' | 'waypoint' | 'end';
}

export interface BackupData {
  version: string;
  exportTime: string;
  tracks: GpxTrack[];
}

export interface SavedAppSettings {
  mapStyle: MapStyleType;
  showLabels: boolean;
  showLegend: boolean;
  lineStyleMode: LineStyleMode;
  fogSettings: FogSettings;
  filterMode: DisplayFilterMode;
  selectedDate: string;
  activeTransportFilters: string[]; // can include custom transport names!
}
