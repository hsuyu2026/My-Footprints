/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrackPoint } from '../types/footprint';
import { calculateHaversineDistance } from './gpxParser';

/**
 * Calculates perpendicular distance in meters from point P to line segment (A, B)
 */
function perpendicularDistanceMeters(
  p: TrackPoint,
  a: TrackPoint,
  b: TrackPoint
): number {
  // If line segment is effectively a single point
  const segmentLength = calculateHaversineDistance(a.lat, a.lon, b.lat, b.lon);
  if (segmentLength < 0.1) {
    return calculateHaversineDistance(p.lat, p.lon, a.lat, a.lon);
  }

  // Convert to local Cartesian approximation around point A
  const latMid = ((a.lat + b.lat) / 2 * Math.PI) / 180;
  const mPerDegLat = 111139;
  const mPerDegLon = 111139 * Math.cos(latMid);

  const x = (p.lon - a.lon) * mPerDegLon;
  const y = (p.lat - a.lat) * mPerDegLat;

  const dx = (b.lon - a.lon) * mPerDegLon;
  const dy = (b.lat - a.lat) * mPerDegLat;

  // Project point P onto line AB: t = ((P - A) . (B - A)) / |B - A|^2
  const t = Math.max(0, Math.min(1, (x * dx + y * dy) / (dx * dx + dy * dy)));

  const projX = t * dx;
  const projY = t * dy;

  const distX = x - projX;
  const distY = y - projY;

  return Math.sqrt(distX * distX + distY * distY);
}

/**
 * Douglas-Peucker simplification algorithm
 * @param points Array of TrackPoints
 * @param epsilon Tolerance distance in meters (e.g. 5m - 10m)
 * @returns Filtered points array with noise/drift removed
 */
export function douglasPeucker(
  points: TrackPoint[],
  epsilon: number = 5
): TrackPoint[] {
  if (points.length <= 2) {
    return [...points];
  }

  // Find the point with maximum distance from line between first and last point
  let maxDistance = 0;
  let maxIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistanceMeters(points[i], first, last);
    if (d > maxDistance) {
      maxDistance = d;
      maxIndex = i;
    }
  }

  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    // Combine left and right (avoid duplicate point at maxIndex)
    return [...left.slice(0, -1), ...right];
  } else {
    // All intermediate points are within tolerance, keep only endpoints
    return [first, last];
  }
}
