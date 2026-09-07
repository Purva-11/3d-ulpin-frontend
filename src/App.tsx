import { Suspense, useState, useCallback, useMemo } from 'react';
import { Maximize2, Mouse, Info, Satellite, Building2 } from 'lucide-react';
import Building3D, { type BuildingConfig } from '@/components/Building3D';
import Header from '@/components/Header';
import ControlPanel from '@/components/ControlPanel';
import AdminPanel, { type AdminFormData } from '@/components/AdminPanel';
import {
  generateULPIN,
  lookupULPIN,
  fetchOSMBuildings,
  type ULPINResponse,
  type OSMBuilding,
} from '@/services/api';

function LoadingScreen() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="inline-block w-12 h-12 rounded-xl bg-gradient-to-br from-emerald to-cyber animate-pulse-glow mb-3" />
        <p className="text-sm text-slate-500 font-mono">Initializing 3D Registry...</p>
      </div>
    </div>
  );
}

function FloorSelectorBar({
  selectedFloor,
  totalFloors,
  onSelect,
}: {
  selectedFloor: number;
  totalFloors: number;
  onSelect: (i: number) => void;
}) {
  const floors = Array.from({ length: totalFloors }, (_, i) => i);
  const showAll = totalFloors <= 10;
  const visibleFloors = showAll ? floors : floors.filter((_, i) => {
    if (i === 0 || i === totalFloors - 1) return true;
    if (Math.abs(i - selectedFloor) <= 2) return true;
    return false;
  });

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 max-w-[90%]">
      <div className="glass-strong rounded-xl px-3 py-2 border border-cyber/20 flex items-center gap-1 flex-wrap justify-center">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2">Floors</span>
        {visibleFloors.map((i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-9 h-9 rounded-lg text-xs font-mono font-bold transition-all flex-shrink-0 ${
              selectedFloor === i
                ? 'bg-emerald/20 border border-emerald/50 text-emerald glow-emerald scale-110'
                : 'text-slate-400 hover:bg-slate-700/40 border border-transparent'
            }`}
          >
            F{i + 1}
          </button>
        ))}
        {!showAll && <span className="text-[10px] text-slate-600 px-1">...{totalFloors}F</span>}
      </div>
    </div>
  );
}

function CanvasOverlay({ selectedFloor, totalFloors, useOSM }: { selectedFloor: number; totalFloors: number; useOSM: boolean }) {
  return (
    <>
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="glass rounded-lg px-3 py-2 border border-cyber/20 flex items-center gap-2">
          <Satellite className="w-4 h-4 text-cyber" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Viewing</p>
            <p className="text-sm font-semibold text-emerald">Floor {selectedFloor + 1} of {totalFloors}</p>
          </div>
        </div>
        {useOSM && (
          <div className="glass rounded-lg px-3 py-2 border border-emerald/20 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald" />
            <p className="text-xs text-emerald font-mono">OSM Footprint Active</p>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10">
        <div className="glass rounded-lg px-3 py-2 border border-cyber/20 flex items-center gap-2 text-[11px] text-slate-400">
          <Mouse className="w-3.5 h-3.5 text-cyber" />
          <span>Drag to rotate · Scroll to zoom · Right-click to pan</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10">
        <div className="glass rounded-lg px-3 py-1.5 border border-emerald/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse-glow" />
          <span className="text-[11px] text-slate-300 font-mono">3D Render Active · 60fps</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <div className="glass rounded-lg w-9 h-9 border border-cyber/20 flex items-center justify-center cursor-pointer hover:border-emerald/40 transition-all">
          <Maximize2 className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </>
  );
}

function App() {
  const [selectedFloor, setSelectedFloor] = useState(3);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);

  // Quick panel form state
  const [state, setState] = useState('MH');
  const [district, setDistrict] = useState('NGP');
  const [surveyPlotNo, setSurveyPlotNo] = useState('402/A');
  const [floorLevel, setFloorLevel] = useState(4);
  const [flatUnit, setFlatUnit] = useState('Flat 402');

  // Admin panel form state
  const [adminData, setAdminData] = useState<AdminFormData>({
    ownerName: 'Rahul Sharma',
    surveyPlot: 'PLOT-402',
    latitude: 21.1458,
    longitude: 79.0882,
    totalFloors: 5,
    floorHeightM: 3.2,
    flatUnit: '402',
    taxStatus: 'PAID',
  });

  // OSM state
  const [useOSM, setUseOSM] = useState(false);
  const [osmLoading, setOsmLoading] = useState(false);
  const [osmBuildings, setOsmBuildings] = useState<OSMBuilding[]>([]);
  const [osmError, setOsmError] = useState<string | null>(null);
  const [osmFootprint, setOsmFootprint] = useState<number[][] | null>(null);

  // Generation state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ULPINResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Search state
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);

  // Building config for 3D canvas
  const buildingConfig: BuildingConfig = useMemo(
    () => ({
      totalFloors: adminData.totalFloors,
      floorHeightM: adminData.floorHeightM,
      footprint: osmFootprint,
      osmLevels: osmBuildings[0]?.levels ?? null,
    }),
    [adminData.totalFloors, adminData.floorHeightM, osmFootprint, osmBuildings]
  );

  // Clamp selected floor when total floors changes
  const effectiveSelectedFloor = Math.min(selectedFloor, adminData.totalFloors - 1);

  const handleFloorSelect = useCallback((index: number) => {
    setSelectedFloor(index);
    setFloorLevel(index + 1);
  }, []);

  // Quick panel generate
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setCopied(false);
    const unitNum = flatUnit.replace(/\D/g, '');
    const response = await generateULPIN({
      stateCode: state,
      districtCode: district,
      surveyPlotNo,
      floorLevel,
      flatUnit: `Flat ${unitNum}`,
      ownerName: adminData.ownerName,
      latitude: adminData.latitude,
      longitude: adminData.longitude,
      totalFloors: adminData.totalFloors,
      floorHeightM: adminData.floorHeightM,
      taxStatus: adminData.taxStatus,
    });
    setResult(response);
    setLoading(false);
    setSelectedFloor(floorLevel - 1);
    setFocusTrigger((t) => t + 1);
  }, [state, district, surveyPlotNo, floorLevel, flatUnit, adminData]);

  // Admin panel submit - register & generate 3D building mesh
  const handleAdminSubmit = useCallback(async () => {
    setSubmitting(true);
    setCopied(false);

    // Clamp floorLevel to totalFloors
    const clampedFloor = Math.min(floorLevel, adminData.totalFloors);

    const response = await generateULPIN({
      stateCode: state,
      districtCode: district,
      surveyPlotNo: adminData.surveyPlot,
      floorLevel: clampedFloor,
      flatUnit: adminData.flatUnit,
      ownerName: adminData.ownerName,
      latitude: adminData.latitude,
      longitude: adminData.longitude,
      totalFloors: adminData.totalFloors,
      floorHeightM: adminData.floorHeightM,
      taxStatus: adminData.taxStatus,
    });
    setResult(response);
    setSubmitting(false);
    setSelectedFloor(clampedFloor - 1);
    setFocusTrigger((t) => t + 1);
  }, [state, district, floorLevel, adminData]);

  // OSM fetch
  const handleFetchOSM = useCallback(async () => {
    setOsmLoading(true);
    setOsmError(null);
    setOsmBuildings([]);
    setOsmFootprint(null);

    try {
      const res = await fetchOSMBuildings(adminData.latitude, adminData.longitude);
      if (res.success && res.buildings.length > 0) {
        setOsmBuildings(res.buildings);
        // Take the largest building footprint
        const largest = res.buildings.reduce((a, b) =>
          (b.geometry?.length || 0) > (a.geometry?.length || 0) ? b : a
        );

        // Normalize OSM lat/lon to local x/z coordinates centered around the query point
        const scale = 100000;
        const polygon = largest.geometry.map((g) => [
          (g.lon - adminData.longitude) * scale,
          (g.lat - adminData.latitude) * scale,
        ]);

        // Scale down to reasonable Three.js units
        const maxDim = Math.max(
          ...polygon.map((p) => Math.abs(p[0])),
          ...polygon.map((p) => Math.abs(p[1]))
        );
        const normalizedScale = maxDim > 0 ? 3 / maxDim : 1;
        const normalizedPolygon = polygon.map(([x, z]) => [x * normalizedScale, z * normalizedScale]);

        setOsmFootprint(normalizedPolygon);

        // If OSM has levels, update totalFloors
        if (largest.levels && largest.levels > 0) {
          setAdminData((prev) => ({ ...prev, totalFloors: Math.min(largest.levels!, 20) }));
        }
      } else if (res.success && res.buildings.length === 0) {
        setOsmError('No buildings found at this location. Using manual floor count.');
      } else {
        setOsmError('Failed to reach Overpass API. Falling back to manual mesh.');
      }
    } catch {
      setOsmError('OSM fetch error. Falling back to manual mesh.');
    }
    setOsmLoading(false);
  }, [adminData.latitude, adminData.longitude]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.ulpin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    setSearchResult(null);
    const found = await lookupULPIN(query);
    if (found) {
      setSearchResult(`Found: ${found.ulpin} — ${found.metadata.ownerName}`);
    } else {
      setSearchResult(`No record found for "${query}"`);
    }
    setSearchLoading(false);
    setTimeout(() => setSearchResult(null), 5000);
  }, []);

  return (
    <div className="h-screen w-full bg-slate-950 grid-bg flex flex-col overflow-hidden">
      <Header onSearch={handleSearch} searchResult={searchResult} searchLoading={searchLoading} />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left - 3D Canvas (65%) */}
        <div className="relative lg:w-[65%] h-[45vh] lg:h-full min-h-0 border-r border-cyber/10">
          <Suspense fallback={<LoadingScreen />}>
            <Building3D
              selectedFloor={effectiveSelectedFloor}
              hoveredFloor={hoveredFloor}
              onSelectFloor={handleFloorSelect}
              onHoverFloor={setHoveredFloor}
              focusTrigger={focusTrigger}
              config={buildingConfig}
            />
          </Suspense>

          <CanvasOverlay selectedFloor={effectiveSelectedFloor} totalFloors={adminData.totalFloors} useOSM={useOSM && osmFootprint !== null} />
          <FloorSelectorBar selectedFloor={effectiveSelectedFloor} totalFloors={adminData.totalFloors} onSelect={handleFloorSelect} />
        </div>

        {/* Right - Control Panel + Admin Panel (35%) */}
        <div className="lg:w-[35%] w-full h-[55vh] lg:h-full min-h-0 glass-strong border-l border-cyber/10 overflow-y-auto">
          <div className="p-4 space-y-4">
            <AdminPanel
              formData={adminData}
              setFormData={setAdminData}
              useOSM={useOSM}
              setUseOSM={(v) => {
                setUseOSM(v);
                if (!v) {
                  setOsmFootprint(null);
                  setOsmBuildings([]);
                  setOsmError(null);
                }
              }}
              onFetchOSM={handleFetchOSM}
              osmLoading={osmLoading}
              osmBuildings={osmBuildings}
              osmError={osmError}
              onSubmit={handleAdminSubmit}
              submitting={submitting}
            />

            <ControlPanel
              state={state}
              setState={setState}
              district={district}
              setDistrict={setDistrict}
              surveyPlotNo={surveyPlotNo}
              setSurveyPlotNo={setSurveyPlotNo}
              floorLevel={floorLevel}
              setFloorLevel={setFloorLevel}
              flatUnit={flatUnit}
              setFlatUnit={setFlatUnit}
              onGenerate={handleGenerate}
              loading={loading}
              result={result}
              copied={copied}
              onCopy={handleCopy}
            />
          </div>
        </div>
      </div>

      {/* Footer info bar */}
      <footer className="glass-strong border-t border-cyber/15 px-6 py-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Info className="w-3 h-3 text-cyber" />
            BHOOMI-3D Registry v3.0 · Vertical Property Cadastre
          </span>
          <span>Selected: Floor {effectiveSelectedFloor + 1} / {adminData.totalFloors}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{adminData.totalFloors} Floors · MD5-ULPIN · OSM {useOSM && osmFootprint ? 'ON' : 'OFF'}</span>
          <span className="text-emerald">● Secure Connection</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
