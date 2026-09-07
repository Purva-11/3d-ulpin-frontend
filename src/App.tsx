import { Suspense, useState, useCallback } from 'react';
import { Maximize2, Mouse, Info, Satellite } from 'lucide-react';
import Building3D, { TOTAL_FLOORS } from '@/components/Building3D';
import Header from '@/components/Header';
import ControlPanel from '@/components/ControlPanel';
import { generateULPIN, lookupULPIN, type ULPINResponse } from '@/services/api';

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
  onSelect,
}: {
  selectedFloor: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <div className="glass-strong rounded-xl px-3 py-2 border border-cyber/20 flex items-center gap-1">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2">Floors</span>
        {Array.from({ length: TOTAL_FLOORS }, (_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-9 h-9 rounded-lg text-xs font-mono font-bold transition-all ${
              selectedFloor === i
                ? 'bg-emerald/20 border border-emerald/50 text-emerald glow-emerald scale-110'
                : 'text-slate-400 hover:bg-slate-700/40 border border-transparent'
            }`}
          >
            F{i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function CanvasOverlay({ selectedFloor }: { selectedFloor: number }) {
  return (
    <>
      {/* Top-left info */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="glass rounded-lg px-3 py-2 border border-cyber/20 flex items-center gap-2">
          <Satellite className="w-4 h-4 text-cyber" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Viewing</p>
            <p className="text-sm font-semibold text-emerald">Floor {selectedFloor + 1} · Flats A & B</p>
          </div>
        </div>
      </div>

      {/* Top-right controls hint */}
      <div className="absolute top-4 right-4 z-10">
        <div className="glass rounded-lg px-3 py-2 border border-cyber/20 flex items-center gap-2 text-[11px] text-slate-400">
          <Mouse className="w-3.5 h-3.5 text-cyber" />
          <span>Drag to rotate · Scroll to zoom · Right-click to pan</span>
        </div>
      </div>

      {/* Bottom-left status */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="glass rounded-lg px-3 py-1.5 border border-emerald/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse-glow" />
          <span className="text-[11px] text-slate-300 font-mono">3D Render Active · 60fps</span>
        </div>
      </div>

      {/* Bottom-right fullscreen icon */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="glass rounded-lg w-9 h-9 border border-cyber/20 flex items-center justify-center cursor-pointer hover:border-emerald/40 transition-all">
          <Maximize2 className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </>
  );
}

function App() {
  const [selectedFloor, setSelectedFloor] = useState(3); // Default floor 4 (index 3)
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);

  // Form state
  const [state, setState] = useState('MH');
  const [district, setDistrict] = useState('NGP');
  const [surveyPlotNo, setSurveyPlotNo] = useState('402/A');
  const [floorLevel, setFloorLevel] = useState(4);
  const [flatUnit, setFlatUnit] = useState('Flat 402');

  // Generation state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ULPINResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Search state
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);

  const handleFloorSelect = useCallback((index: number) => {
    setSelectedFloor(index);
    setFloorLevel(index + 1);
  }, []);

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
    });
    setResult(response);
    setLoading(false);
  }, [state, district, surveyPlotNo, floorLevel, flatUnit]);

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
        <div className="relative lg:w-[65%] h-[50vh] lg:h-full min-h-0 border-r border-cyber/10">
          <Suspense fallback={<LoadingScreen />}>
            <Building3D
              selectedFloor={selectedFloor}
              hoveredFloor={hoveredFloor}
              onSelectFloor={handleFloorSelect}
              onHoverFloor={setHoveredFloor}
            />
          </Suspense>

          <CanvasOverlay selectedFloor={selectedFloor} />
          <FloorSelectorBar selectedFloor={selectedFloor} onSelect={handleFloorSelect} />
        </div>

        {/* Right - Control Panel (35%) */}
        <div className="lg:w-[35%] w-full h-[50vh] lg:h-full min-h-0 glass-strong border-l border-cyber/10">
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

      {/* Footer info bar */}
      <footer className="glass-strong border-t border-cyber/15 px-6 py-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Info className="w-3 h-3 text-cyber" />
            BHOOMI-3D Registry v2.0 · Vertical Property Cadastre
          </span>
          <span>Selected: Floor {selectedFloor + 1} / {TOTAL_FLOORS}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>5 Floors · 10 Units · 3D ULPIN Enabled</span>
          <span className="text-emerald">● Secure Connection</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
