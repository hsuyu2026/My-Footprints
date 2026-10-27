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

export type TrackSortOption = 'recorded_time' | 'import_time';

export interface TransportOption {
  type: TransportType;
  category: TransportCategory;
  label: string;
  categoryLabel: string;
  iconName: string;
  // Specific required colors
  color: string;
  // Pattern style
  lineStyleType: 'solid' | 'blue_white' | 'black_white' | 'orange_white';
  lineWeight?: number;
}

export const TRANSPORT_OPTIONS: TransportOption[] = [
  // 步行：淺綠色
  {
    type: 'walking',
    category: 'walking',
    label: '步行',
    categoryLabel: '步行',
    iconName: 'Footprints',
    color: '#86efac', // 淺綠色 light green
    lineStyleType: 'solid',
    lineWeight: 4,
  },
  // 腳踏車：深綠色
  {
    type: 'bicycle',
    category: 'self_drive',
    label: '腳踏車',
    categoryLabel: '自駕',
    iconName: 'Bike',
    color: '#15803d', // 深綠色 dark green
    lineStyleType: 'solid',
    lineWeight: 4,
  },
  // 機車：淺藍色
  {
    type: 'motorcycle',
    category: 'self_drive',
    label: '機車',
    categoryLabel: '自駕',
    iconName: 'Gauge',
    color: '#38bdf8', // 淺藍色 light blue
    lineStyleType: 'solid',
    lineWeight: 4,
  },
  // 汽車：深藍色
  {
    type: 'car',
    category: 'self_drive',
    label: '汽車',
    categoryLabel: '自駕',
    iconName: 'Car',
    color: '#1d4ed8', // 深藍色 dark blue
    lineStyleType: 'solid',
    lineWeight: 4.5,
  },
  // 公車：亮橘色
  {
    type: 'bus',
    category: 'transit',
    label: '公車',
    categoryLabel: '大眾運輸',
    iconName: 'Bus',
    color: '#f97316', // 亮橘色 bright orange
    lineStyleType: 'solid',
    lineWeight: 4.5,
  },
  // 捷運：藍白相間
  {
    type: 'mrt',
    category: 'transit',
    label: '捷運',
    categoryLabel: '大眾運輸',
    iconName: 'TrainTrack',
    color: '#2563eb', // 藍白相間 base
    lineStyleType: 'blue_white',
    lineWeight: 5,
  },
  // 輕軌：淺棕色
  {
    type: 'light_rail',
    category: 'transit',
    label: '輕軌',
    categoryLabel: '大眾運輸',
    iconName: 'TramFront',
    color: '#c28b5b', // 淺棕色 light brown
    lineStyleType: 'solid',
    lineWeight: 4,
  },
  // 鐵路：黑白相間
  {
    type: 'railway',
    category: 'transit',
    label: '鐵路',
    categoryLabel: '大眾運輸',
    iconName: 'TrainFront',
    color: '#000000', // 黑白相間
    lineStyleType: 'black_white',
    lineWeight: 5,
  },
  // 高鐵：橘白相間
  {
    type: 'hsr',
    category: 'transit',
    label: '高鐵',
    categoryLabel: '大眾運輸',
    iconName: 'Zap',
    color: '#ea580c', // 橘白相間
    lineStyleType: 'orange_white',
    lineWeight: 5.5,
  },
  // 飛機：紫色
  {
    type: 'plane',
    category: 'other',
    label: '飛機',
    categoryLabel: '其他',
    iconName: 'Plane',
    color: '#a855f7', // 紫色 purple
    lineStyleType: 'solid',
    lineWeight: 4,
  },
  // 船：紅色
  {
    type: 'ship',
    category: 'other',
    label: '船隻',
    categoryLabel: '其他',
    iconName: 'Ship',
    color: '#ef4444', // 紅色 red
    lineStyleType: 'solid',
    lineWeight: 4,
  },
  // 其他：白色
  {
    type: 'custom',
    category: 'other',
    label: '其他（自訂）',
    categoryLabel: '其他',
    iconName: 'Navigation',
    color: '#ffffff', // 白色 white
    lineStyleType: 'solid',
    lineWeight: 4,
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

export type MapStyleType = 'satellite' | 'street' | 'daylight' | 'night';

export interface FogSettings {
  enabled: boolean;
  opacity: number;
  bufferRadiusMeters: number; // 5 to 500
}

export interface EditorWaypoint {
  id: string;
  lat: number;
  lon: number;
  role: 'start' | 'waypoint' | 'end';
}

export interface EditorSegmentConfig {
  fromIndex: number;
  toIndex: number;
  mode: EditRoutingMode; // 'road_snap' | 'straight_line'
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
  activeTransportFilters: string[];
  sortBy: TrackSortOption;
  groupByTransport: boolean;
}
