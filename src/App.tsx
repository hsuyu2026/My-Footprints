/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GpxTrack,
  DisplayFilterMode,
  MapStyleType,
  FogSettings,
  EditorWaypoint,
  TransportType,
  TRANSPORT_OPTIONS,
  LineStyleMode,
  EditRoutingMode,
  SavedAppSettings,
} from './types/footprint';
import { getDemoTracks } from './utils/demoData';
import { fetchRoadRoute } from './utils/routing';
import { calculateHaversineDistance } from './utils/gpxParser';
import { MapContainer } from './components/MapContainer';
import { TrackListSidebar } from './components/TrackListSidebar';
import { MapToolbar } from './components/MapToolbar';
import { ImportModal } from './components/ImportModal';
import { EditRouteModal } from './components/EditRouteModal';
import { BackupModal } from './components/BackupModal';
import { LegendCard } from './components/LegendCard';

const STORAGE_TRACKS_KEY = 'my_footprints_tracks_v2';
const STORAGE_SETTINGS_KEY = 'my_footprints_settings_v2';

export default function App() {
  // Load saved display settings if any (Requirement 3)
  const savedSettings = useMemo<Partial<SavedAppSettings>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse saved settings:', e);
    }
    return {};
  }, []);

  // Tracks state
  const [tracks, setTracks] = useState<GpxTrack[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRACKS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load tracks from localStorage:', e);
    }
    return getDemoTracks();
  });

  // Extract custom transport names from tracks
  const customTransportNames = useMemo(() => {
    const names = new Set<string>();
    tracks.forEach((t) => {
      if (t.transportType === 'custom' && t.customTransportName?.trim()) {
        names.add(t.customTransportName.trim());
      }
    });
    return Array.from(names);
  }, [tracks]);

  // Display filter states (Requirement 3: Persisted)
  const [filterMode, setFilterMode] = useState<DisplayFilterMode>(
    savedSettings.filterMode || 'all'
  );
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (savedSettings.selectedDate) return savedSettings.selectedDate;
    const dates = tracks.map((t) => t.recordedDate).filter(Boolean);
    return dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0];
  });

  // Transportation filters (string keys: standard types + custom:Name)
  const [activeTransportFilters, setActiveTransportFilters] = useState<string[]>(() => {
    if (savedSettings.activeTransportFilters && savedSettings.activeTransportFilters.length > 0) {
      return savedSettings.activeTransportFilters;
    }
    const standard = TRANSPORT_OPTIONS.map((t) => t.type as string);
    const customs = customTransportNames.map((n) => `custom:${n}`);
    return [...standard, ...customs];
  });

  // Map settings (Default: 衛星 satellite)
  const [mapStyle, setMapStyle] = useState<MapStyleType>(
    savedSettings.mapStyle || 'satellite'
  );
  const [showLabels, setShowLabels] = useState<boolean>(
    savedSettings.showLabels !== undefined ? savedSettings.showLabels : true
  );
  const [showLegend, setShowLegend] = useState<boolean>(
    savedSettings.showLegend !== undefined ? savedSettings.showLegend : false
  );

  // Requirement 4: Line style mode (default: monochrome_white)
  const [lineStyleMode, setLineStyleMode] = useState<LineStyleMode>(
    savedSettings.lineStyleMode || 'monochrome_white'
  );

  // Requirement 1: Fog settings (default: 50m, 5m-500m)
  const [fogSettings, setFogSettings] = useState<FogSettings>(() => {
    if (savedSettings.fogSettings) {
      return {
        ...savedSettings.fogSettings,
        bufferRadiusMeters: Math.min(
          500,
          Math.max(5, savedSettings.fogSettings.bufferRadiusMeters || 50)
        ),
      };
    }
    return {
      enabled: false,
      opacity: 0.75,
      bufferRadiusMeters: 50,
    };
  });

  // Locate trigger (Requirement 6: Fast locating)
  const [locateTrigger, setLocateTrigger] = useState<number>(1);

  // Modal open states
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Editor Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  // Requirement 2: Routing mode ('road_snap' | 'straight_line')
  const [editRoutingMode, setEditRoutingMode] = useState<EditRoutingMode>('road_snap');
  const [editWaypoints, setEditWaypoints] = useState<EditorWaypoint[]>([]);
  const [editRouteCoords, setEditRouteCoords] = useState<[number, number][]>([]);
  const [editTotalDistance, setEditTotalDistance] = useState(0);
  const [editTotalDuration, setEditTotalDuration] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [activeEditTransportType, setActiveEditTransportType] = useState<TransportType>('car');

  // Save tracks to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRACKS_KEY, JSON.stringify(tracks));
    } catch (e) {
      console.warn('Failed to save tracks to localStorage:', e);
    }
  }, [tracks]);

  // Requirement 3: Save user display and filter settings to localStorage on change
  useEffect(() => {
    const settingsToSave: SavedAppSettings = {
      mapStyle,
      showLabels,
      showLegend,
      lineStyleMode,
      fogSettings,
      filterMode,
      selectedDate,
      activeTransportFilters,
    };
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settingsToSave));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }, [
    mapStyle,
    showLabels,
    showLegend,
    lineStyleMode,
    fogSettings,
    filterMode,
    selectedDate,
    activeTransportFilters,
  ]);

  // Make sure new custom transports are automatically added to activeTransportFilters
  useEffect(() => {
    setActiveTransportFilters((prev) => {
      let changed = false;
      const next = [...prev];
      customTransportNames.forEach((n) => {
        const key = `custom:${n}`;
        if (!next.includes(key)) {
          next.push(key);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [customTransportNames]);

  // Filtered tracks for map display
  const displayedTracks = useMemo(() => {
    return tracks.map((track) => {
      let isVisible = track.visible;

      // Transport mode filter (supports built-in & custom:Name)
      let isFilteredIn = false;
      if (track.transportType === 'custom' && track.customTransportName?.trim()) {
        isFilteredIn =
          activeTransportFilters.includes(`custom:${track.customTransportName.trim()}`) ||
          activeTransportFilters.includes('custom');
      } else {
        isFilteredIn = activeTransportFilters.includes(track.transportType);
      }

      if (!isFilteredIn) {
        isVisible = false;
      }

      // Display filter mode
      if (filterMode === 'single') {
        if (selectedTrackId) {
          isVisible = isVisible && track.id === selectedTrackId;
        }
      } else if (filterMode === 'date') {
        isVisible = isVisible && track.recordedDate === selectedDate;
      }

      return {
        ...track,
        visible: isVisible,
      };
    });
  }, [tracks, filterMode, selectedTrackId, selectedDate, activeTransportFilters]);

  // Requirement 2: Calculate road snapping OR straight line route
  useEffect(() => {
    if (!isEditMode || editWaypoints.length < 2) {
      if (editWaypoints.length === 1) {
        setEditRouteCoords([[editWaypoints[0].lat, editWaypoints[0].lon]]);
      } else {
        setEditRouteCoords([]);
      }
      setEditTotalDistance(0);
      setEditTotalDuration(0);
      return;
    }

    // Straight line mode
    if (editRoutingMode === 'straight_line') {
      const coords: [number, number][] = editWaypoints.map((w) => [w.lat, w.lon]);
      setEditRouteCoords(coords);

      let totalDist = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        totalDist += calculateHaversineDistance(
          coords[i][0],
          coords[i][1],
          coords[i + 1][0],
          coords[i + 1][1]
        );
      }
      setEditTotalDistance(Math.round(totalDist));

      // Speed estimate based on active transport
      let speedMps = 1.2;
      if (activeEditTransportType === 'bicycle') speedMps = 4.2;
      else if (activeEditTransportType === 'motorcycle') speedMps = 10;
      else if (activeEditTransportType === 'car') speedMps = 14;
      setEditTotalDuration(Math.round(totalDist / speedMps));
      setIsLoadingRoute(false);
      return;
    }

    // Road Snap mode: calls OSRM
    let isCancelled = false;
    setIsLoadingRoute(true);

    const timer = setTimeout(() => {
      fetchRoadRoute(
        editWaypoints.map((w) => ({ lat: w.lat, lon: w.lon })),
        activeEditTransportType
      )
        .then((res) => {
          if (!isCancelled) {
            setEditRouteCoords(res.coordinates);
            setEditTotalDistance(res.distanceMeters);
            setEditTotalDuration(res.durationSeconds);
            setIsLoadingRoute(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setIsLoadingRoute(false);
          }
        });
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isEditMode, editWaypoints, activeEditTransportType, editRoutingMode]);

  // Handlers for Edit Waypoints
  const handleAddEditWaypoint = useCallback((lat: number, lon: number) => {
    setEditWaypoints((prev) => {
      const role: EditorWaypoint['role'] = prev.length === 0 ? 'start' : 'waypoint';
      const newWp: EditorWaypoint = {
        id: 'wp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        lat,
        lon,
        role,
      };
      return [...prev, newWp];
    });
  }, []);

  const handleUpdateEditWaypoint = useCallback(
    (index: number, lat: number, lon: number) => {
      setEditWaypoints((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index], lat, lon };
        }
        return next;
      });
    },
    []
  );

  const handleRemoveEditWaypoint = useCallback((index: number) => {
    setEditWaypoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearEditWaypoints = useCallback(() => {
    setEditWaypoints([]);
    setEditRouteCoords([]);
    setEditTotalDistance(0);
    setEditTotalDuration(0);
  }, []);

  // Track manipulation handlers
  const handleImportSuccess = (newTrack: GpxTrack) => {
    setTracks((prev) => [newTrack, ...prev]);
    if (filterMode === 'single') {
      setSelectedTrackId(newTrack.id);
    }
    setLocateTrigger((c) => c + 1);
  };

  const handleToggleTrackVisibility = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t))
    );
  };

  const handleDeleteTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
    }
  };

  const handleDownloadTrack = (track: GpxTrack) => {
    const blob = new Blob([track.rawGpxXml], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = track.fileName.endsWith('.gpx') ? track.fileName : `${track.fileName}.gpx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Requirement 8: Transportation filter toggles
  const handleToggleTransportFilter = (filterKey: string) => {
    setActiveTransportFilters((prev) =>
      prev.includes(filterKey) ? prev.filter((t) => t !== filterKey) : [...prev, filterKey]
    );
  };

  const handleSelectAllTransportFilters = () => {
    const standard = TRANSPORT_OPTIONS.map((t) => t.type as string);
    const customs = customTransportNames.map((n) => `custom:${n}`);
    setActiveTransportFilters([...standard, ...customs]);
  };

  const handleClearAllTransportFilters = () => {
    setActiveTransportFilters([]);
  };

  // Backup handlers
  const handleRestoreBackup = (importedTracks: GpxTrack[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setTracks(importedTracks);
    } else {
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newOnes = importedTracks.filter((t) => !existingIds.has(t.id));
        return [...newOnes, ...prev];
      });
    }
    setLocateTrigger((c) => c + 1);
  };

  const handleLoadDemoTracks = () => {
    setTracks(getDemoTracks());
    setSelectedTrackId(null);
    setLocateTrigger((c) => c + 1);
  };

  // Save from Edit Route Modal
  const handleSaveAndImportRoute = (newTrack: GpxTrack) => {
    setTracks((prev) => [newTrack, ...prev]);
    if (filterMode === 'single') {
      setSelectedTrackId(newTrack.id);
    }
    setIsEditMode(false);
    handleClearEditWaypoints();
    setLocateTrigger((c) => c + 1);
  };

  // Requirement 6: Quick locate current view (e.g. for specific date or all)
  const handleLocateCurrentView = useCallback(() => {
    setLocateTrigger((c) => c + 1);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black font-sans text-white select-none">
      {/* Left Sidebar */}
      <TrackListSidebar
        tracks={tracks}
        filterMode={filterMode}
        onChangeFilterMode={setFilterMode}
        selectedTrackId={selectedTrackId}
        onSelectTrack={setSelectedTrackId}
        selectedDate={selectedDate}
        onChangeSelectedDate={setSelectedDate}
        activeTransportFilters={activeTransportFilters}
        onToggleTransportFilter={handleToggleTransportFilter}
        onSelectAllTransportFilters={handleSelectAllTransportFilters}
        onClearAllTransportFilters={handleClearAllTransportFilters}
        onToggleTrackVisibility={handleToggleTrackVisibility}
        onDeleteTrack={handleDeleteTrack}
        onDownloadTrack={handleDownloadTrack}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        isEditMode={isEditMode}
        onToggleEditMode={() => {
          setIsEditMode(!isEditMode);
          if (isEditMode) {
            handleClearEditWaypoints();
          }
        }}
        onLocateCurrentView={handleLocateCurrentView}
      />

      {/* Main Map View Area */}
      <main className="relative flex-1 h-full overflow-hidden bg-zinc-950">
        <MapContainer
          tracks={displayedTracks}
          filterMode={filterMode}
          selectedTrackId={selectedTrackId}
          onSelectTrack={setSelectedTrackId}
          mapStyle={mapStyle}
          showLabels={showLabels}
          lineStyleMode={lineStyleMode}
          fogSettings={fogSettings}
          isEditMode={isEditMode}
          editWaypoints={editWaypoints}
          onAddEditWaypoint={handleAddEditWaypoint}
          onUpdateEditWaypoint={handleUpdateEditWaypoint}
          editRouteCoords={editRouteCoords}
          activeTransportType={activeEditTransportType}
          locateTrigger={locateTrigger}
        />

        {/* Top-Right Map Toolbar */}
        <MapToolbar
          mapStyle={mapStyle}
          onChangeMapStyle={setMapStyle}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels(!showLabels)}
          showLegend={showLegend}
          onToggleLegend={() => setShowLegend(!showLegend)}
          lineStyleMode={lineStyleMode}
          onChangeLineStyleMode={setLineStyleMode}
          fogSettings={fogSettings}
          onChangeFogSettings={setFogSettings}
        />

        {/* Map Legend Overlay */}
        <LegendCard
          isOpen={showLegend}
          onClose={() => setShowLegend(false)}
          activeTransportFilters={activeTransportFilters}
          lineStyleMode={lineStyleMode}
          onChangeLineStyleMode={setLineStyleMode}
          customTransportNames={customTransportNames}
        />

        {/* Edit Route Floating Modal / Panel */}
        <EditRouteModal
          isOpen={isEditMode}
          waypoints={editWaypoints}
          routeCoords={editRouteCoords}
          totalDistanceMeters={editTotalDistance}
          totalDurationSeconds={editTotalDuration}
          isLoadingRoute={isLoadingRoute}
          onRemoveWaypoint={handleRemoveEditWaypoint}
          onClearWaypoints={handleClearEditWaypoints}
          onCancel={() => {
            setIsEditMode(false);
            handleClearEditWaypoints();
          }}
          onSaveAndImport={handleSaveAndImportRoute}
          activeTransportType={activeEditTransportType}
          onChangeTransportType={setActiveEditTransportType}
          routingMode={editRoutingMode}
          onChangeRoutingMode={setEditRoutingMode}
        />
      </main>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Backup & Transfer Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        tracks={tracks}
        onClose={() => setIsBackupOpen(false)}
        onRestoreBackup={handleRestoreBackup}
        onLoadDemoTracks={handleLoadDemoTracks}
      />
    </div>
  );
}
