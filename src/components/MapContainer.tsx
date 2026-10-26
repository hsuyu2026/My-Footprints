/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  GpxTrack,
  MapStyleType,
  FogSettings,
  EditorWaypoint,
  TransportType,
  TRANSPORT_OPTIONS,
  LineStyleMode,
  DisplayFilterMode,
} from '../types/footprint';

interface MapContainerProps {
  tracks: GpxTrack[];
  filterMode: DisplayFilterMode;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  mapStyle: MapStyleType;
  showLabels: boolean;
  lineStyleMode: LineStyleMode;
  fogSettings: FogSettings;
  isEditMode: boolean;
  editWaypoints: EditorWaypoint[];
  onAddEditWaypoint: (lat: number, lon: number) => void;
  onUpdateEditWaypoint: (index: number, lat: number, lon: number) => void;
  editRouteCoords: [number, number][];
  activeTransportType: TransportType;
  locateTrigger: number; // incremented whenever user triggers a locate action (e.g. date locate or all locate)
}

export const MapContainer: React.FC<MapContainerProps> = ({
  tracks,
  filterMode,
  selectedTrackId,
  onSelectTrack,
  mapStyle,
  showLabels,
  lineStyleMode,
  fogSettings,
  isEditMode,
  editWaypoints,
  onAddEditWaypoint,
  onUpdateEditWaypoint,
  editRouteCoords,
  activeTransportType,
  locateTrigger,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelTileLayerRef = useRef<L.TileLayer | null>(null);
  const trackLayersRef = useRef<Map<string, L.LayerGroup>>(new Map());
  const editMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const editRouteLineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [24.0, 121.0],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Map Tile Layers & Labels
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (labelTileLayerRef.current) {
      map.removeLayer(labelTileLayerRef.current);
      labelTileLayerRef.current = null;
    }

    let baseTileUrl = '';
    let labelTileUrl = '';
    const subdomains = ['a', 'b', 'c', 'd'];

    if (mapStyle === 'satellite') {
      baseTileUrl =
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      labelTileUrl =
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
    } else if (mapStyle === 'clean_dark') {
      baseTileUrl = showLabels
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
      labelTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png';
    } else {
      // clean_light
      baseTileUrl = showLabels
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
      labelTileUrl = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png';
    }

    const baseLayer = L.tileLayer(baseTileUrl, {
      maxZoom: 19,
      subdomains,
    }).addTo(map);
    baseTileLayerRef.current = baseLayer;

    if (showLabels && mapStyle === 'satellite') {
      const labelLayer = L.tileLayer(labelTileUrl, {
        maxZoom: 19,
        pane: 'overlayPane',
      }).addTo(map);
      labelTileLayerRef.current = labelLayer;
    }
  }, [mapStyle, showLabels]);

  // Click on map for Edit Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isEditMode) return;
      onAddEditWaypoint(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isEditMode, onAddEditWaypoint]);

  // Render Tracks
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old layers
    trackLayersRef.current.forEach((layerGroup) => {
      map.removeLayer(layerGroup);
    });
    trackLayersRef.current.clear();

    // REQUIREMENT 1: "開啟此模式（迷霧模式）後不顯示路徑線條"
    if (fogSettings.enabled) {
      return;
    }

    const bounds = L.latLngBounds([]);

    tracks.forEach((track) => {
      if (!track.visible || track.points.length === 0) return;

      const layerGroup = L.layerGroup();
      const latlngs: L.LatLngExpression[] = track.points.map((p) => [p.lat, p.lon]);

      // Selection only highlights in 'single' mode
      const isSelected = filterMode === 'single' && track.id === selectedTrackId;

      const transportInfo = TRANSPORT_OPTIONS.find((t) => t.type === track.transportType);
      const weight = isSelected ? 6 : transportInfo?.lineWeight || 4;

      // Color determining: all white vs category colors
      let lineColor = '#ffffff';
      if (lineStyleMode === 'category_colors') {
        lineColor = transportInfo?.color || '#eab308';
      }

      // Halo backing line for contrast
      const haloLine = L.polyline(latlngs, {
        color: '#000000',
        weight: weight + 3,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      });
      layerGroup.addLayer(haloLine);

      // Main line: always solid straight segments (no dash patterns, clean straight lines)
      const mainLine = L.polyline(latlngs, {
        color: isSelected ? '#ffffff' : lineColor,
        weight: weight,
        opacity: isSelected ? 1 : 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Tooltip with track info
      const displayLabel =
        track.transportType === 'custom' && track.customTransportName
          ? track.customTransportName
          : transportInfo?.label || '足跡';

      const tooltipContent = `
        <div style="font-family: sans-serif; font-size: 12px; color: #ffffff; background: #09090b; padding: 6px 10px; border: 1px solid #3f3f46; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          <div style="font-weight: 600; margin-bottom: 2px;">${track.name}</div>
          <div style="color: #a1a1aa; font-size: 11px;">${track.recordedDate} | ${displayLabel}</div>
          <div style="color: #d4d4d8; font-size: 11px; margin-top: 2px;">距離: ${(track.totalDistanceMeters / 1000).toFixed(2)} km</div>
        </div>
      `;

      mainLine.bindTooltip(tooltipContent, {
        sticky: true,
        className: 'custom-leaflet-tooltip',
      });

      mainLine.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectTrack(track.id);
      });

      layerGroup.addLayer(mainLine);

      // Add Start & End Markers
      if (track.points.length > 1) {
        const startPt = track.points[0];
        const endPt = track.points[track.points.length - 1];

        // Start marker
        const startColor = lineStyleMode === 'category_colors' ? lineColor : '#ffffff';
        const startIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="width: 12px; height: 12px; background: ${startColor}; border: 2px solid #000000; border-radius: 50%; box-shadow: 0 0 6px rgba(255,255,255,0.8);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        const startMarker = L.marker([startPt.lat, startPt.lon], { icon: startIcon });
        layerGroup.addLayer(startMarker);

        // End marker
        const endIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="width: 12px; height: 12px; background: #000000; border: 2px solid ${startColor}; border-radius: 2px; box-shadow: 0 0 6px rgba(0,0,0,0.8);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        const endMarker = L.marker([endPt.lat, endPt.lon], { icon: endIcon });
        layerGroup.addLayer(endMarker);
      }

      layerGroup.addTo(map);
      trackLayersRef.current.set(track.id, layerGroup);

      latlngs.forEach((pt) => {
        bounds.extend(pt);
      });
    });
  }, [tracks, filterMode, selectedTrackId, onSelectTrack, lineStyleMode, fogSettings.enabled]);

  // Fit bounds when locateTrigger or single track selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (filterMode === 'single' && selectedTrackId) {
      const selected = tracks.find((t) => t.id === selectedTrackId);
      if (selected && selected.points.length > 0) {
        const b = L.latLngBounds(selected.points.map((p) => [p.lat, p.lon]));
        map.fitBounds(b, { padding: [60, 60], maxZoom: 16 });
        return;
      }
    }

    // Locate visible tracks (e.g. on date change or initial locate trigger)
    const visibleTracks = tracks.filter((t) => t.visible && t.points.length > 0);
    if (visibleTracks.length > 0) {
      const b = L.latLngBounds([]);
      visibleTracks.forEach((t) => {
        t.points.forEach((p) => b.extend([p.lat, p.lon]));
      });
      map.fitBounds(b, { padding: [60, 60], maxZoom: 16 });
    }
  }, [locateTrigger, filterMode, selectedTrackId]);

  // Edit Mode Waypoints & Snapped Route Render
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!editMarkersLayerRef.current) {
      editMarkersLayerRef.current = L.layerGroup().addTo(map);
    }
    editMarkersLayerRef.current.clearLayers();

    if (!isEditMode) {
      if (editRouteLineRef.current) {
        map.removeLayer(editRouteLineRef.current);
        editRouteLineRef.current = null;
      }
      return;
    }

    // Render Edit Markers
    editWaypoints.forEach((wp, index) => {
      let label = (index + 1).toString();
      let bg = '#27272a';
      let border = '#ffffff';

      if (index === 0) {
        label = '起';
        bg = '#ffffff';
        border = '#000000';
      } else if (index === editWaypoints.length - 1 && editWaypoints.length > 1) {
        label = '終';
        bg = '#000000';
        border = '#ffffff';
      }

      const textColor = index === 0 ? '#000000' : '#ffffff';

      const icon = L.divIcon({
        className: 'custom-edit-marker',
        html: `
          <div style="width: 24px; height: 24px; background: ${bg}; border: 2px solid ${border}; color: ${textColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.6); cursor: grab;">
            ${label}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([wp.lat, wp.lon], {
        icon,
        draggable: true,
      });

      marker.on('dragend', (e) => {
        const target = e.target as L.Marker;
        const pos = target.getLatLng();
        onUpdateEditWaypoint(index, pos.lat, pos.lng);
      });

      editMarkersLayerRef.current?.addLayer(marker);
    });

    // Render Snapped Route
    if (editRouteCoords.length > 1) {
      if (!editRouteLineRef.current) {
        editRouteLineRef.current = L.polyline(editRouteCoords, {
          color: '#ffffff',
          weight: 4,
          opacity: 0.95,
        }).addTo(map);
      } else {
        editRouteLineRef.current.setLatLngs(editRouteCoords);
      }
    } else if (editRouteLineRef.current) {
      map.removeLayer(editRouteLineRef.current);
      editRouteLineRef.current = null;
    }
  }, [isEditMode, editWaypoints, editRouteCoords, onUpdateEditWaypoint]);

  // Fog of War (迷霧模式) Canvas Rendering Engine
  useEffect(() => {
    const map = mapInstanceRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    if (!fogSettings.enabled) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const renderFog = () => {
      const width = mapContainerRef.current?.clientWidth || window.innerWidth;
      const height = mapContainerRef.current?.clientHeight || window.innerHeight;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Fill entire canvas with dark fog layer
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(5, 5, 8, ${fogSettings.opacity})`;
      ctx.fillRect(0, 0, width, height);

      // 2. Switch to destination-out to carve out the buffer around track points
      ctx.globalCompositeOperation = 'destination-out';

      // Calculate pixel radius for buffer at current map center and zoom level (5m - 500m)
      const center = map.getCenter();
      const pCenter = map.latLngToContainerPoint(center);
      const latDelta = fogSettings.bufferRadiusMeters / 111139;
      const pEdge = map.latLngToContainerPoint([center.lat + latDelta, center.lng]);
      const pixelRadius = Math.max(2, Math.abs(pEdge.y - pCenter.y));

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Render visible tracks into the fog mask
      const activeTracks =
        isEditMode && editRouteCoords.length > 0
          ? [
              ...tracks.filter((t) => t.visible),
              {
                id: 'edit_preview',
                points: editRouteCoords.map((c) => ({ lat: c[0], lon: c[1] })),
              },
            ]
          : tracks.filter((t) => t.visible);

      activeTracks.forEach((track) => {
        if (track.points.length === 0) return;

        const screenPoints: [number, number][] = [];
        for (let i = 0; i < track.points.length; i++) {
          const pt = track.points[i];
          const sp = map.latLngToContainerPoint([pt.lat, pt.lon]);
          screenPoints.push([sp.x, sp.y]);
        }

        // Draw clear buffer stroke along path
        if (screenPoints.length > 1) {
          ctx.beginPath();
          ctx.moveTo(screenPoints[0][0], screenPoints[0][1]);
          for (let i = 1; i < screenPoints.length; i++) {
            ctx.lineTo(screenPoints[i][0], screenPoints[i][1]);
          }
          ctx.lineWidth = pixelRadius * 2;
          ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
          ctx.stroke();
        }

        // Draw circles at waypoints for clean buffer envelope
        for (let i = 0; i < screenPoints.length; i++) {
          const [sx, sy] = screenPoints[i];
          if (
            sx < -pixelRadius ||
            sx > width + pixelRadius ||
            sy < -pixelRadius ||
            sy > height + pixelRadius
          ) {
            continue;
          }
          ctx.beginPath();
          ctx.arc(sx, sy, pixelRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.fill();
        }
      });

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
    };

    renderFog();

    map.on('move', renderFog);
    map.on('zoom', renderFog);
    map.on('resize', renderFog);

    return () => {
      map.off('move', renderFog);
      map.off('zoom', renderFog);
      map.off('resize', renderFog);
    };
  }, [fogSettings, tracks, isEditMode, editRouteCoords]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 cursor-crosshair" />

      {/* Fog of War Canvas Layer */}
      {fogSettings.enabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-[400] pointer-events-none transition-opacity duration-300"
        />
      )}

      {/* Edit Mode Top Banner Instruction */}
      {isEditMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-black/90 border border-zinc-700 text-white px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center space-x-3 text-xs tracking-wide">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span>點擊地圖添加路徑點（起點、途經點、終點可拖曳調整）</span>
        </div>
      )}
    </div>
  );
};
