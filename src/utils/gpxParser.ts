/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GpxTrack, TrackPoint, TransportCategory, TransportType } from '../types/footprint';

/**
 * Calculates distance between two coordinates in meters using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function parseGpxXml(
  xmlContent: string,
  fileName: string,
  category: TransportCategory,
  transportType: TransportType,
  customTransportName?: string
): GpxTrack {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

  // Check parsing errors
  const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
  if (parseError) {
    throw new Error('GPX 格式解析錯誤：' + parseError.textContent);
  }

  // Extract track name
  const nameNode = xmlDoc.querySelector('gpx > trk > name') ||
                   xmlDoc.querySelector('gpx > metadata > name') ||
                   xmlDoc.querySelector('name');
  const trackName = nameNode?.textContent?.trim() || fileName.replace(/\.gpx$/i, '');

  const points: TrackPoint[] = [];

  // Look for trkpt elements first
  const trkpts = xmlDoc.getElementsByTagName('trkpt');
  if (trkpts.length > 0) {
    for (let i = 0; i < trkpts.length; i++) {
      const el = trkpts[i];
      const lat = parseFloat(el.getAttribute('lat') || '');
      const lon = parseFloat(el.getAttribute('lon') || '');
      if (isNaN(lat) || isNaN(lon)) continue;

      const eleEl = el.getElementsByTagName('ele')[0];
      const ele = eleEl && eleEl.textContent ? parseFloat(eleEl.textContent) : undefined;

      const timeEl = el.getElementsByTagName('time')[0];
      const time = timeEl?.textContent?.trim();

      points.push({ lat, lon, ele, time });
    }
  } else {
    // Fallback to rtept
    const rtepts = xmlDoc.getElementsByTagName('rtept');
    if (rtepts.length > 0) {
      for (let i = 0; i < rtepts.length; i++) {
        const el = rtepts[i];
        const lat = parseFloat(el.getAttribute('lat') || '');
        const lon = parseFloat(el.getAttribute('lon') || '');
        if (isNaN(lat) || isNaN(lon)) continue;
        const eleEl = el.getElementsByTagName('ele')[0];
        const ele = eleEl && eleEl.textContent ? parseFloat(eleEl.textContent) : undefined;
        const timeEl = el.getElementsByTagName('time')[0];
        const time = timeEl?.textContent?.trim();
        points.push({ lat, lon, ele, time });
      }
    } else {
      // Fallback to wpt
      const wpts = xmlDoc.getElementsByTagName('wpt');
      for (let i = 0; i < wpts.length; i++) {
        const el = wpts[i];
        const lat = parseFloat(el.getAttribute('lat') || '');
        const lon = parseFloat(el.getAttribute('lon') || '');
        if (isNaN(lat) || isNaN(lon)) continue;
        const eleEl = el.getElementsByTagName('ele')[0];
        const ele = eleEl && eleEl.textContent ? parseFloat(eleEl.textContent) : undefined;
        const timeEl = el.getElementsByTagName('time')[0];
        const time = timeEl?.textContent?.trim();
        points.push({ lat, lon, ele, time });
      }
    }
  }

  if (points.length === 0) {
    throw new Error('未在此 GPX 檔案中偵測到任何有效的經緯度座標點');
  }

  // Calculate bounding box and distance
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;
  let totalDistanceMeters = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;

    if (i > 0) {
      const prev = points[i - 1];
      totalDistanceMeters += calculateHaversineDistance(prev.lat, prev.lon, p.lat, p.lon);
    }
  }

  // Determine date and time
  const metaTimeEl = xmlDoc.querySelector('metadata > time');
  const firstPointWithTime = points.find((p) => p.time);
  const lastPointWithTime = [...points].reverse().find((p) => p.time);

  let recordedDate = '';
  let startTime = firstPointWithTime?.time;
  let endTime = lastPointWithTime?.time;

  if (startTime) {
    const d = new Date(startTime);
    if (!isNaN(d.getTime())) {
      recordedDate = d.toISOString().split('T')[0];
    }
  }

  if (!recordedDate && metaTimeEl?.textContent) {
    const d = new Date(metaTimeEl.textContent.trim());
    if (!isNaN(d.getTime())) {
      recordedDate = d.toISOString().split('T')[0];
    }
  }

  if (!recordedDate) {
    recordedDate = new Date().toISOString().split('T')[0];
  }

  let totalDurationSeconds = 0;
  if (startTime && endTime) {
    const tStart = new Date(startTime).getTime();
    const tEnd = new Date(endTime).getTime();
    if (!isNaN(tStart) && !isNaN(tEnd) && tEnd >= tStart) {
      totalDurationSeconds = Math.round((tEnd - tStart) / 1000);
    }
  }

  // Estimate duration if missing timestamps (based on standard speeds)
  if (totalDurationSeconds === 0 && totalDistanceMeters > 0) {
    let speedMps = 1.2; // default walking ~4.3 km/h
    if (transportType === 'bicycle') speedMps = 4.2;
    else if (transportType === 'motorcycle') speedMps = 10;
    else if (transportType === 'car') speedMps = 14;
    else if (['bus', 'mrt', 'light_rail'].includes(transportType)) speedMps = 11;
    else if (transportType === 'railway') speedMps = 20;
    else if (transportType === 'hsr') speedMps = 65;
    else if (transportType === 'plane') speedMps = 220;
    else if (transportType === 'ship') speedMps = 8;

    totalDurationSeconds = Math.round(totalDistanceMeters / speedMps);
  }

  return {
    id: 'track_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    name: trackName,
    fileName,
    category,
    transportType,
    customTransportName: transportType === 'custom' ? customTransportName : undefined,
    recordedDate,
    startTime,
    endTime,
    totalDistanceMeters: Math.round(totalDistanceMeters),
    totalDurationSeconds,
    points,
    rawGpxXml: xmlContent,
    bounds: { minLat, maxLat, minLon, maxLon },
    visible: true,
    createdAt: Date.now(),
  };
}
