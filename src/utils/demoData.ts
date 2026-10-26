/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GpxTrack } from '../types/footprint';
import { generateGpxXml } from './gpxGenerator';
import { parseGpxXml } from './gpxParser';

// 示範 1: 台北象山親山步道 (步行)
const elephantMountainPoints = [
  { lat: 25.0326, lon: 121.5701, ele: 28 },
  { lat: 25.0319, lon: 121.5708, ele: 45 },
  { lat: 25.0311, lon: 121.5716, ele: 72 },
  { lat: 25.0305, lon: 121.5724, ele: 110 },
  { lat: 25.0298, lon: 121.5732, ele: 146 },
  { lat: 25.0291, lon: 121.5741, ele: 172 },
  { lat: 25.0287, lon: 121.5750, ele: 183 }, // 六巨石
  { lat: 25.0282, lon: 121.5762, ele: 181 },
  { lat: 25.0276, lon: 121.5775, ele: 170 },
  { lat: 25.0270, lon: 121.5788, ele: 154 },
  { lat: 25.0265, lon: 121.5801, ele: 132 },
  { lat: 25.0258, lon: 121.5815, ele: 98 },
];

// 示範 2: 日月潭環潭環湖路線 (自駕 - 腳踏車)
const sunMoonLakePoints = [
  { lat: 23.8682, lon: 120.9135, ele: 760 }, // 水社碼頭
  { lat: 23.8645, lon: 120.9162, ele: 762 },
  { lat: 23.8592, lon: 120.9198, ele: 765 },
  { lat: 23.8524, lon: 120.9221, ele: 768 },
  { lat: 23.8471, lon: 120.9255, ele: 772 }, // 向山遊客中心
  { lat: 23.8428, lon: 120.9213, ele: 774 },
  { lat: 23.8465, lon: 120.9142, ele: 770 },
  { lat: 23.8542, lon: 120.9085, ele: 765 },
  { lat: 23.8621, lon: 120.9062, ele: 763 },
  { lat: 23.8679, lon: 120.9101, ele: 761 },
  { lat: 23.8682, lon: 120.9135, ele: 760 },
];

// 示範 3: 台北捷運淡水信義線局部 (大眾運輸 - 捷運)
const metroPoints = [
  { lat: 25.0421, lon: 121.5199, ele: 12 }, // 台北車站
  { lat: 25.0392, lon: 121.5191, ele: 14 }, // 台大醫院
  { lat: 25.0354, lon: 121.5182, ele: 15 }, // 中正紀念堂
  { lat: 25.0326, lon: 121.5273, ele: 16 }, // 東門
  { lat: 25.0331, lon: 121.5358, ele: 18 }, // 大安森林公園
  { lat: 25.0335, lon: 121.5435, ele: 20 }, // 大安
  { lat: 25.0334, lon: 121.5512, ele: 22 }, // 信義安和
  { lat: 25.0332, lon: 121.5645, ele: 25 }, // 台北101/世貿
  { lat: 25.0328, lon: 121.5702, ele: 28 }, // 象山站
];

// 示範 4: 北海岸公路自駕旅行 (自駕 - 汽車)
const northCoastDrivePoints = [
  { lat: 25.1764, lon: 121.4429, ele: 8 }, // 淡水
  { lat: 25.2154, lon: 121.4648, ele: 15 }, // 三芝
  { lat: 25.2536, lon: 121.5034, ele: 22 }, // 石門
  { lat: 25.2974, lon: 121.5385, ele: 35 }, // 富貴角
  { lat: 25.2285, lon: 121.6421, ele: 18 }, // 金山
  { lat: 25.2045, lon: 121.6895, ele: 12 }, // 野柳
];

export function getDemoTracks(): GpxTrack[] {
  const tracks: GpxTrack[] = [];

  // Track 1
  const xml1 = generateGpxXml({
    name: '台北象山景觀親山步道',
    category: 'walking',
    transportType: 'walking',
    startDateTime: '2026-10-20T08:30:00Z',
    points: elephantMountainPoints,
  });
  tracks.push(
    parseGpxXml(xml1, 'taipei_elephant_mountain.gpx', 'walking', 'walking')
  );

  // Track 2
  const xml2 = generateGpxXml({
    name: '日月潭環湖單車踩踏之旅',
    category: 'self_drive',
    transportType: 'bicycle',
    startDateTime: '2026-10-22T14:15:00Z',
    points: sunMoonLakePoints,
  });
  tracks.push(
    parseGpxXml(xml2, 'sun_moon_lake_bike.gpx', 'self_drive', 'bicycle')
  );

  // Track 3
  const xml3 = generateGpxXml({
    name: '台北捷運紅線市區通勤紀錄',
    category: 'transit',
    transportType: 'mrt',
    startDateTime: '2026-10-24T09:00:00Z',
    points: metroPoints,
  });
  tracks.push(
    parseGpxXml(xml3, 'taipei_mrt_red_line.gpx', 'transit', 'mrt')
  );

  // Track 4
  const xml4 = generateGpxXml({
    name: '北海岸海岸公路馳騁路線',
    category: 'self_drive',
    transportType: 'car',
    startDateTime: '2026-10-25T11:20:00Z',
    points: northCoastDrivePoints,
  });
  tracks.push(
    parseGpxXml(xml4, 'north_coast_drive.gpx', 'self_drive', 'car')
  );

  return tracks;
}
