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
  EditorSegmentConfig,
  TransportType,
  TRANSPORT_OPTIONS,
  LineStyleMode,
  EditRoutingMode,
  TrackSortOption,
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

const STORAGE_TRACKS_KEY = 'my_footprints_tracks_v3';
const STORAGE_SETTINGS_KEY = 'my_footprints_settings_v3';

export default function App() {
  // Load saved display settings (Requirement 3)
  const savedSettings = useMemo<Partial<SavedAppSettings>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse saved settings:', e);
    }
    return {};
  }, []);

  // Tracks state (Requirement 4: Instant persistence, never lost on reload)
  const [tracks, setTracks] = useState<GpxTrack[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRACKS_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load tracks from localStorage:', e);
    }
    // First time initialization with demo tracks
    const demo = getDemoTracks();
    try {
      localStorage.setItem(STORAGE_TRACKS_KEY, JSON.stringify(demo));
    } catch (e) {
      console.warn('Failed to save initial demo tracks:', e);
    }
    return demo;
  });

  // Synchronous persistence helper
  const updateTracksAndPersist = useCallback((updater: (prev: GpxTrack[]) => GpxTrack[]) => {
    setTracks((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_TRACKS_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist tracks to localStorage:', e);
      }
      return next;
    });
  }, []);

  // Extract all custom transport names from tracks
  const customTransportNames = useMemo(() => {
    const names = new Set<string>();
    tracks.forEach((t) => {
      if (t.transportType === 'custom' && t.customTransportName?.trim()) {
        names.add(t.customTransportName.trim());
      }
    });
    return Array.from(names);
  }, [tracks]);

  // Display filter states (Requirement 8: 'single' = 單獨足跡)
  const [filterMode, setFilterMode] = useState<DisplayFilterMode>(
    savedSettings.filterMode || 'all'
  );
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (savedSettings.selectedDate) return savedSettings.selectedDate;
    const dates = tracks.map((t) => t.recordedDate).filter(Boolean);
    return dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0];
  });

  // Transportation filters (Requirement 6: hide unselected modes)
  const [activeTransportFilters, setActiveTransportFilters] = useState<string[]>(() => {
    if (savedSettings.activeTransportFilters && savedSettings.activeTransportFilters.length > 0) {
      return savedSettings.activeTransportFilters;
    }
    const standard = TRANSPORT_OPTIONS.map((t) => t.type as string);
    const customs = customTransportNames.map((n) => `custom:${n}`);
    return [...standard, ...customs];
  });

  // Map settings (Default: 衛星 satellite, 街道 street, 白晝 daylight, 夜晚 night)
  const [mapStyle, setMapStyle] = useState<MapStyleType>(() => {
    if (savedSettings.mapStyle) {
      if ((savedSettings.mapStyle as string) === 'clean_light') return 'street';
      if ((savedSettings.mapStyle as string) === 'clean_dark') return 'night';
      return savedSettings.mapStyle;
    }
    return 'satellite';
  });
  const [showLabels, setShowLabels] = useState<boolean>(
    savedSettings.showLabels !== undefined ? savedSettings.showLabels : true
  );
  const [showLegend, setShowLegend] = useState<boolean>(
    savedSettings.showLegend !== undefined ? savedSettings.showLegend : false
  );

  // Requirement 5: Line style mode (default: monochrome_white)
  const [lineStyleMode, setLineStyleMode] = useState<LineStyleMode>(
    savedSettings.lineStyleMode || 'monochrome_white'
  );

  // Fog settings (default: 50m, 5m-500m)
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

  // Requirement 2: Sorting and Grouping
  const [sortBy, setSortBy] = useState<TrackSortOption>(
    savedSettings.sortBy || 'recorded_time'
  );
  const [groupByTransport, setGroupByTransport] = useState<boolean>(
    savedSettings.groupByTransport !== undefined ? savedSettings.groupByTransport : false
  );

  // Fast locate trigger
  const [locateTrigger, setLocateTrigger] = useState<number>(1);

  // Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Requirement 9: Mixed Planning Editor State
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSegmentMode, setCurrentSegmentMode] = useState<EditRoutingMode>('road_snap');
  const [editWaypoints, setEditWaypoints] = useState<EditorWaypoint[]>([]);
  const [segmentConfigs, setSegmentConfigs] = useState<EditorSegmentConfig[]>([]);
  const [editRouteCoords, setEditRouteCoords] = useState<[number, number][]>([]);
  const [editTotalDistance, setEditTotalDistance] = useState(0);
  const [editTotalDuration, setEditTotalDuration] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [activeEditTransportType, setActiveEditTransportType] = useState<TransportType>('car');

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
      sortBy,
      groupByTransport,
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
    sortBy,
    groupByTransport,
  ]);

  // Auto-sync custom transport options into filter list
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

  // Requirement 6 & 10: Filtered tracks for map display
  const displayedTracks = useMemo(() => {
    return tracks.map((track) => {
      let isVisible = track.visible;

      // Transport mode filter (Requirement 6: hide unselected mode)
      let isTransportAllowed = false;
      if (track.transportType === 'custom' && track.customTransportName?.trim()) {
        isTransportAllowed =
          activeTransportFilters.includes(`custom:${track.customTransportName.trim()}`) ||
          activeTransportFilters.includes('custom');
      } else {
        isTransportAllowed = activeTransportFilters.includes(track.transportType);
      }
      if (!isTransportAllowed) {
        isVisible = false;
      }

      // Display filter mode (Requirement 10: hide other dates when in 'date' mode)
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

  // Requirement 9: Mixed Route Calculation (segment by segment)
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

    let isCancelled = false;
    setIsLoadingRoute(true);

    const calculateMixedRoute = async () => {
      const allCoords: [number, number][] = [];
      let totalDist = 0;
      let totalDur = 0;

      for (let i = 0; i < editWaypoints.length - 1; i++) {
        const p1 = editWaypoints[i];
        const p2 = editWaypoints[i + 1];
        const segConfig = segmentConfigs[i];
        const mode = segConfig ? segConfig.mode : 'road_snap';

        if (mode === 'straight_line') {
          // Direct straight line
          const dist = calculateHaversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);
          totalDist += dist;

          let speedMps = 1.2;
          if (activeEditTransportType === 'bicycle') speedMps = 4.2;
          else if (activeEditTransportType === 'motorcycle') speedMps = 10;
          else if (activeEditTransportType === 'car') speedMps = 14;
          totalDur += dist / speedMps;

          if (i === 0) {
            allCoords.push([p1.lat, p1.lon]);
          }
          allCoords.push([p2.lat, p2.lon]);
        } else {
          // Road Snap via OSRM
          try {
            const res = await fetchRoadRoute([p1, p2], activeEditTransportType);
            totalDist += res.distanceMeters;
            totalDur += res.durationSeconds;

            if (res.coordinates.length > 0) {
              if (i === 0) {
                allCoords.push(...res.coordinates);
              } else {
                allCoords.push(...res.coordinates.slice(1));
              }
            } else {
              allCoords.push([p2.lat, p2.lon]);
            }
          } catch (e) {
            // Fallback straight line
            const dist = calculateHaversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);
            totalDist += dist;
            totalDur += dist / 10;
            allCoords.push([p2.lat, p2.lon]);
          }
        }
      }

      if (!isCancelled) {
        setEditRouteCoords(allCoords);
        setEditTotalDistance(Math.round(totalDist));
        setEditTotalDuration(Math.round(totalDur));
        setIsLoadingRoute(false);
      }
    };

    calculateMixedRoute();

    return () => {
      isCancelled = true;
    };
  }, [isEditMode, editWaypoints, segmentConfigs, activeEditTransportType]);

  // Requirement 9: Adding waypoints & initializing segment configs
  const handleAddEditWaypoint = useCallback(
    (lat: number, lon: number) => {
      setEditWaypoints((prev) => {
        const role: EditorWaypoint['role'] = prev.length === 0 ? 'start' : 'waypoint';
        const newWp: EditorWaypoint = {
          id: 'wp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          lat,
          lon,
          role,
        };

        if (prev.length >= 1) {
          // Add segment config connecting prev point to this new point
          setSegmentConfigs((prevSegs) => [
            ...prevSegs,
            {
              fromIndex: prev.length - 1,
              toIndex: prev.length,
              mode: currentSegmentMode,
            },
          ]);
        }

        return [...prev, newWp];
      });
    },
    [currentSegmentMode]
  );

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
    setSegmentConfigs((prev) => prev.filter((_, i) => i !== index && i !== index - 1));
  }, []);

  const handleClearEditWaypoints = useCallback(() => {
    setEditWaypoints([]);
    setSegmentConfigs([]);
    setEditRouteCoords([]);
    setEditTotalDistance(0);
    setEditTotalDuration(0);
  }, []);

  // Requirement 9: Toggle segment mode (road_snap <-> straight_line)
  const handleToggleSegmentMode = useCallback((segmentIndex: number) => {
    setSegmentConfigs((prev) => {
      const next = [...prev];
      if (next[segmentIndex]) {
        next[segmentIndex] = {
          ...next[segmentIndex],
          mode: next[segmentIndex].mode === 'road_snap' ? 'straight_line' : 'road_snap',
        };
      }
      return next;
    });
  }, []);

  // Requirement 4: Synchronous instant storage on import
  const handleImportSuccess = (newTrack: GpxTrack) => {
    updateTracksAndPersist((prev) => [newTrack, ...prev]);
    if (filterMode === 'single') {
      setSelectedTrackId(newTrack.id);
    }
    setLocateTrigger((c) => c + 1);
  };

  const handleToggleTrackVisibility = (trackId: string) => {
    updateTracksAndPersist((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t))
    );
  };

  const handleDeleteTrack = (trackId: string) => {
    updateTracksAndPersist((prev) => prev.filter((t) => t.id !== trackId));
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

  const handleRestoreBackup = (importedTracks: GpxTrack[], mode: 'merge' | 'replace') => {
    updateTracksAndPersist((prev) => {
      if (mode === 'replace') return importedTracks;
      const existingIds = new Set(prev.map((t) => t.id));
      const newOnes = importedTracks.filter((t) => !existingIds.has(t.id));
      return [...newOnes, ...prev];
    });
    setLocateTrigger((c) => c + 1);
  };

  const handleLoadDemoTracks = () => {
    const demos = getDemoTracks();
    updateTracksAndPersist(() => demos);
    setSelectedTrackId(null);
    setLocateTrigger((c) => c + 1);
  };

  const handleSaveAndImportRoute = (newTrack: GpxTrack) => {
    updateTracksAndPersist((prev) => [newTrack, ...prev]);
    if (filterMode === 'single') {
      setSelectedTrackId(newTrack.id);
    }
    setIsEditMode(false);
    handleClearEditWaypoints();
    setLocateTrigger((c) => c + 1);
  };

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
        sortBy={sortBy}
        onChangeSortBy={setSortBy}
        groupByTransport={groupByTransport}
        onToggleGroupByTransport={() => setGroupByTransport(!groupByTransport)}
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
          segmentConfigs={segmentConfigs}
          onToggleSegmentMode={handleToggleSegmentMode}
          currentSegmentMode={currentSegmentMode}
          onChangeCurrentSegmentMode={setCurrentSegmentMode}
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
