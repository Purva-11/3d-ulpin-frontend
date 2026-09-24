import { Suspense, useMemo } from 'react';
import { Maximize2, Mouse, Satellite, Building2, Scissors, Info } from 'lucide-react';
import Canvas3D, { type BuildingConfig } from '@/components/Canvas3D';
import Header from '@/components/Header';
import ControlPanel from '@/components/ControlPanel';
import { useStore } from '@/store';

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

function FloorSelectorBar() {
  const selectedFloor = useStore((s) => s.selectedFloor);
  const totalFloors = useStore((s) => s.totalFloors);
  const selectFloor = useStore((s) => s.selectFloor);
  const triggerFocus = useStore((s) => s.triggerFocus);

  const floors = Array.from({ length: totalFloors }, (_, i) => i);
  const showAll = totalFloors <= 10;
  const visibleFloors = showAll ? floors : floors.filter((_, i) => i === 0 || i === totalFloors - 1 || Math.abs(i - selectedFloor) <= 2);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 max-w-[90%]">
      <div className="glass-strong rounded-xl px-3 py-2 border border-cyber/20 flex items-center gap-1 flex-wrap justify-center">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2">Floors</span>
        {visibleFloors.map((i) => (
          <button key={i} onClick={() => { selectFloor(i); triggerFocus(); }}
            className={`w-9 h-9 rounded-lg text-xs font-mono font-bold transition-all flex-shrink-0 ${
              selectedFloor === i ? 'bg-emerald/20 border border-emerald/50 text-emerald glow-emerald scale-110' : 'text-slate-400 hover:bg-slate-700/40 border border-transparent'
            }`}>F{i + 1}</button>
        ))}
        {!showAll && <span className="text-[10px] text-slate-600 px-1">...{totalFloors}F</span>}
      </div>
    </div>
  );
}

function CanvasOverlay() {
  const selectedFloor = useStore((s) => s.selectedFloor);
  const totalFloors = useStore((s) => s.totalFloors);
  const useOSM = useStore((s) => s.useOSM);
  const osmFootprint = useStore((s) => s.osmFootprint);
  const cutawayMode = useStore((s) => s.cutawayMode);
  const toggleCutaway = useStore((s) => s.toggleCutaway);

  return (
    <>
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="glass rounded-lg px-3 py-2 border border-cyber/20 flex items-center gap-2">
          <Satellite className="w-4 h-4 text-cyber" />
          <div><p className="text-[10px] text-slate-500 uppercase tracking-wider">Viewing</p><p className="text-sm font-semibold text-emerald">Floor {selectedFloor + 1} of {totalFloors}</p></div>
        </div>
        {useOSM && osmFootprint && (
          <div className="glass rounded-lg px-3 py-2 border border-emerald/20 flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald" /><p className="text-xs text-emerald font-mono">OSM Footprint Active</p></div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
        <div className="glass rounded-lg px-3 py-2 border border-cyber/20 flex items-center gap-2 text-[11px] text-slate-400">
          <Mouse className="w-3.5 h-3.5 text-cyber" /><span>Drag to rotate · Scroll to zoom · Right-click to pan</span>
        </div>
        <button onClick={toggleCutaway}
          className={`glass rounded-lg px-3 py-2 border flex items-center gap-2 text-[11px] font-semibold transition-all ${
            cutawayMode ? 'border-emerald/40 text-emerald' : 'border-cyber/20 text-slate-400 hover:text-slate-300'
          }`}>
          <Scissors className="w-3.5 h-3.5" />Cutaway {cutawayMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10">
        <div className="glass rounded-lg px-3 py-1.5 border border-emerald/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse-glow" />
          <span className="text-[11px] text-slate-300 font-mono">3D Render Active · 60fps</span>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 z-10">
        <div className="glass rounded-lg w-9 h-9 border border-cyber/20 flex items-center justify-center cursor-pointer hover:border-emerald/40 transition-all"><Maximize2 className="w-4 h-4 text-slate-400" /></div>
      </div>
    </>
  );
}

function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-in">
      <div className="glass-strong rounded-xl px-5 py-3 border border-emerald/40 glow-emerald flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald" />
        <span className="text-sm font-semibold text-emerald">{toast}</span>
      </div>
    </div>
  );
}

function App() {
  const totalFloors = useStore((s) => s.totalFloors);
  const floorHeightM = useStore((s) => s.floorHeightM);
  const osmFootprint = useStore((s) => s.osmFootprint);
  const osmLevels = useStore((s) => s.osmLevels);
  const selectedFloor = useStore((s) => s.selectedFloor);
  const useOSM = useStore((s) => s.useOSM);

  const buildingConfig: BuildingConfig = useMemo(
    () => ({ totalFloors, floorHeightM, footprint: osmFootprint, osmLevels }),
    [totalFloors, floorHeightM, osmFootprint, osmLevels]
  );

  return (
    <div className="h-screen w-full bg-slate-950 grid-bg flex flex-col overflow-hidden">
      <Header />
      <Toast />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="relative lg:w-[65%] h-[45vh] lg:h-full min-h-0 border-r border-cyber/10">
          <Suspense fallback={<LoadingScreen />}>
            <Canvas3D config={buildingConfig} />
          </Suspense>
          <CanvasOverlay />
          <FloorSelectorBar />
        </div>

        <div className="lg:w-[35%] w-full h-[55vh] lg:h-full min-h-0 glass-strong border-l border-cyber/10 overflow-y-auto">
          <ControlPanel />
        </div>
      </div>

      <footer className="glass-strong border-t border-cyber/15 px-6 py-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Info className="w-3 h-3 text-cyber" />BHOOMI-3D Registry v4.0 · Vertical Property Cadastre</span>
          <span>Selected: Floor {selectedFloor + 1} / {totalFloors}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{totalFloors} Floors · MD5-ULPIN · OSM {useOSM && osmFootprint ? 'ON' : 'OFF'}</span>
          <span className="text-emerald">● Secure Connection</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
