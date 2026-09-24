import {
  MapPin, Building, Hash, Layers, Ruler, Home, QrCode, Loader2,
  Copy, Check, User, Receipt, FileCheck, Globe2, Mountain, Calendar,
  Crosshair, Scissors, Satellite, AlertCircle, CheckCircle2, Navigation,
} from 'lucide-react';
import { useStore } from '@/store';
import { generateULPIN, fetchOSMFootprint } from '@/services/api';
import { useState, useCallback } from 'react';

const STATES = [
  { code: 'MH', label: 'Maharashtra - MH' },
  { code: 'DL', label: 'Delhi - DL' },
  { code: 'KA', label: 'Karnataka - KA' },
  { code: 'TN', label: 'Tamil Nadu - TN' },
  { code: 'RJ', label: 'Rajasthan - RJ' },
  { code: 'UP', label: 'Uttar Pradesh - UP' },
];

const DISTRICTS: Record<string, { code: string; label: string }[]> = {
  MH: [{ code: 'NGP', label: 'Nagpur - NGP' }, { code: 'MUM', label: 'Mumbai - MUM' }, { code: 'PUN', label: 'Pune - PUN' }],
  DL: [{ code: 'CND', label: 'Central Delhi - CND' }, { code: 'NDL', label: 'New Delhi - NDL' }],
  KA: [{ code: 'BLR', label: 'Bengaluru - BLR' }, { code: 'MYS', label: 'Mysuru - MYS' }],
  TN: [{ code: 'CEN', label: 'Chennai - CEN' }, { code: 'COI', label: 'Coimbatore - COI' }],
  RJ: [{ code: 'JPR', label: 'Jaipur - JPR' }, { code: 'JOD', label: 'Jodhpur - JOD' }],
  UP: [{ code: 'LKO', label: 'Lucknow - LKO' }, { code: 'NOI', label: 'Noida - NOI' }],
};

const inputClass = 'w-full px-3 py-2.5 text-sm rounded-lg glass border border-cyber/20 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/30 transition-all';
const labelClass = 'text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5';

function MetaRow({ icon: Icon, label, value, unit }: { icon: React.ElementType; label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0">
      <div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-cyber" /><span className="text-xs text-slate-400">{label}</span></div>
      <span className="text-xs font-mono text-slate-200 font-medium">{value}{unit && <span className="text-slate-500 ml-1">{unit}</span>}</span>
    </div>
  );
}

export default function ControlPanel() {
  const s = useStore();
  const [gpsLoading, setGpsLoading] = useState(false);

  const districtOptions = DISTRICTS[s.stateCode] || DISTRICTS.MH;

  const handleGenerate = useCallback(async () => {
    s.setLoading(true);
    s.setCopied(false);
    const flatNumber = parseInt(s.flatUnit.replace(/\D/g, ''), 10) || 402;
    const result = await generateULPIN({
      stateCode: s.stateCode, districtCode: s.districtCode, surveyPlot: s.surveyPlot,
      lat: s.latitude, lng: s.longitude, floorNumber: s.floorLevel,
      flatNumber, floorHeight: s.floorHeightM, ownerName: s.ownerName, taxStatus: s.taxStatus,
    });
    s.setResult(result);
    s.setLoading(false);
    s.selectFloor(s.floorLevel - 1);
    s.triggerFocus();
    s.setToast('3D-ULPIN generated successfully');
  }, [s]);

  const handleGPS = useCallback(() => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      setGpsLoading(false);
      s.setToast('GPS not available');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        s.setForm({ latitude: parseFloat(pos.coords.latitude.toFixed(6)), longitude: parseFloat(pos.coords.longitude.toFixed(6)) });
        setGpsLoading(false);
        s.setToast('Location acquired');
      },
      () => { setGpsLoading(false); s.setToast('GPS permission denied'); },
      { timeout: 5000 }
    );
  }, [s]);

  const handleOSM = useCallback(async () => {
    if (s.useOSM) {
      s.setOSM({ useOSM: false, osmFootprint: null, osmLevels: null, osmBuildingCount: 0, osmError: null });
      return;
    }
    s.setOSM({ useOSM: true, osmLoading: true, osmError: null });
    const res = await fetchOSMFootprint(s.latitude, s.longitude);
    if (res.exists && res.largest?.geometry?.length >= 3) {
      const scale = 100000;
      const polygon = res.largest.geometry.map((g) => [(g.lon - s.longitude) * scale, (g.lat - s.latitude) * scale]);
      const maxDim = Math.max(...polygon.map((p) => Math.abs(p[0])), ...polygon.map((p) => Math.abs(p[1])));
      const norm = maxDim > 0 ? 3 / maxDim : 1;
      const normPolygon = polygon.map(([x, z]) => [x * norm, z * norm]);
      s.setOSM({ useOSM: true, osmLoading: false, osmFootprint: normPolygon, osmLevels: res.largest.levels, osmBuildingCount: res.buildings?.length || 1 });
      if (res.largest.levels && res.largest.levels > 0) {
        s.setForm({ totalFloors: Math.min(res.largest.levels, 20) });
      }
      s.setToast('OSM footprint loaded');
    } else {
      s.setOSM({ useOSM: true, osmLoading: false, osmFootprint: null, osmError: 'No buildings found at this location. Using manual mesh.' });
      s.setToast('No OSM data — using manual mesh');
    }
  }, [s]);

  const handleCopy = useCallback(() => {
    if (!s.result) return;
    navigator.clipboard.writeText(s.result.ulpin).then(() => {
      s.setCopied(true);
      s.setToast('Copied to clipboard');
      setTimeout(() => s.setCopied(false), 2000);
    });
  }, [s]);

  const effectiveFloor = Math.min(s.floorLevel, s.totalFloors);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto p-4">
      {/* Form Card */}
      <div className="glass rounded-2xl p-5 border border-cyber/15">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cyber/15 flex items-center justify-center"><QrCode className="w-4 h-4 text-cyber" /></div>
          <div>
            <h2 className="text-sm font-bold text-white">3D-ULPIN Generator</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Property Registration Module</p>
          </div>
        </div>

        <div className="space-y-3.5">
          {/* State + District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}><MapPin className="w-3.5 h-3.5 text-cyber" />State</label>
              <select value={s.stateCode} onChange={(e) => s.setForm({ stateCode: e.target.value })} className={`${inputClass} cursor-pointer`}>
                {STATES.map((st) => <option key={st.code} value={st.code}>{st.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}><Building className="w-3.5 h-3.5 text-cyber" />District</label>
              <select value={s.districtCode} onChange={(e) => s.setForm({ districtCode: e.target.value })} className={`${inputClass} cursor-pointer`}>
                {districtOptions.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {/* Survey Plot */}
          <div>
            <label className={labelClass}><Hash className="w-3.5 h-3.5 text-cyber" />Survey Plot No.</label>
            <input type="text" value={s.surveyPlot} onChange={(e) => s.setForm({ surveyPlot: e.target.value })} className={`${inputClass} font-mono`} />
          </div>

          {/* Owner Name */}
          <div>
            <label className={labelClass}><User className="w-3.5 h-3.5 text-cyber" />Owner Name</label>
            <input type="text" value={s.ownerName} onChange={(e) => s.setForm({ ownerName: e.target.value })} className={inputClass} />
          </div>

          {/* Lat / Lng with GPS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}><Globe2 className="w-3.5 h-3.5 text-cyber" />Latitude</label>
              <input type="number" step="0.000001" value={s.latitude} onChange={(e) => s.setForm({ latitude: parseFloat(e.target.value) || 0 })} className={`${inputClass} font-mono`} />
            </div>
            <div>
              <label className={labelClass}><Globe2 className="w-3.5 h-3.5 text-cyber" />Longitude</label>
              <input type="number" step="0.000001" value={s.longitude} onChange={(e) => s.setForm({ longitude: parseFloat(e.target.value) || 0 })} className={`${inputClass} font-mono`} />
            </div>
          </div>
          <button onClick={handleGPS} disabled={gpsLoading}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-cyber/10 border border-cyber/30 text-cyber hover:bg-cyber/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin-slow" /> : <Crosshair className="w-3.5 h-3.5" />}
            Use My Location (GPS)
          </button>

          {/* Total Floors slider 1-20 */}
          <div>
            <label className={labelClass}><Layers className="w-3.5 h-3.5 text-cyber" />Total Building Floors
              <span className="ml-auto text-emerald font-mono text-sm normal-case tracking-normal">{s.totalFloors}</span>
            </label>
            <input type="range" min={1} max={20} value={s.totalFloors} onChange={(e) => s.setForm({ totalFloors: Number(e.target.value) })} className="w-full cursor-pointer" />
            <div className="flex justify-between mt-1">{[1, 5, 10, 15, 20].map((n) => <span key={n} className={`text-[10px] font-mono ${n === s.totalFloors ? 'text-emerald font-bold' : 'text-slate-600'}`}>{n}</span>)}</div>
          </div>

          {/* Floor Level slider */}
          <div>
            <label className={labelClass}><Layers className="w-3.5 h-3.5 text-cyber" />Floor Level Selection
              <span className="ml-auto text-emerald font-mono text-sm normal-case tracking-normal">Level {effectiveFloor}</span>
            </label>
            <input type="range" min={1} max={s.totalFloors} value={effectiveFloor} onChange={(e) => { s.setForm({ floorLevel: Number(e.target.value) }); s.selectFloor(Number(e.target.value) - 1); }} className="w-full cursor-pointer" />
            <div className="flex justify-between mt-1">{Array.from({ length: s.totalFloors }, (_, i) => i + 1).filter((_, i) => i < 12 || s.totalFloors <= 12).map((n) => <span key={n} className={`text-[10px] font-mono ${n === effectiveFloor ? 'text-emerald font-bold' : 'text-slate-600'}`}>F{n}</span>)}</div>
          </div>

          {/* Floor Height slider 2.5-5.0 */}
          <div>
            <label className={labelClass}><Ruler className="w-3.5 h-3.5 text-cyber" />Floor Height (m)
              <span className="ml-auto text-emerald font-mono text-sm normal-case tracking-normal">{s.floorHeightM.toFixed(1)}m</span>
            </label>
            <input type="range" min={2.5} max={5.0} step={0.1} value={s.floorHeightM} onChange={(e) => s.setForm({ floorHeightM: parseFloat(e.target.value) })} className="w-full cursor-pointer" />
          </div>

          {/* Flat Unit */}
          <div>
            <label className={labelClass}><Home className="w-3.5 h-3.5 text-cyber" />Selected Flat Unit</label>
            <input type="text" value={s.flatUnit} onChange={(e) => s.setForm({ flatUnit: e.target.value })} className={`${inputClass} font-mono`} placeholder="402" />
          </div>

          {/* Tax Status */}
          <div>
            <label className={labelClass}><Receipt className="w-3.5 h-3.5 text-cyber" />Property Tax Status</label>
            <select value={s.taxStatus} onChange={(e) => s.setForm({ taxStatus: e.target.value as 'PAID' | 'PENDING' })} className={`${inputClass} cursor-pointer`}>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>

          {/* OSM Toggle */}
          <div className="glass rounded-xl p-3 border border-cyber/15">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Satellite className="w-4 h-4 text-cyber" /><span className="text-xs font-semibold text-slate-300">Fetch Real Footprint (OSM Overpass)</span></div>
              <button onClick={handleOSM} className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${s.useOSM ? 'bg-emerald' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${s.useOSM ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {s.osmLoading && <div className="flex items-center gap-1.5 text-[11px] text-cyber"><Loader2 className="w-3.5 h-3.5 animate-spin-slow" />Fetching from Overpass API...</div>}
            {s.osmError && <div className="flex items-center gap-1.5 text-[11px] text-amber-400"><AlertCircle className="w-3.5 h-3.5" />{s.osmError}</div>}
            {s.osmFootprint && <div className="flex items-center gap-1.5 text-[11px] text-emerald"><CheckCircle2 className="w-3.5 h-3.5" />OSM footprint loaded · {s.osmBuildingCount} building(s)</div>}
          </div>

          {/* Cutaway toggle */}
          <button onClick={s.toggleCutaway}
            className={`w-full py-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
              s.cutawayMode ? 'bg-emerald/15 border-emerald/40 text-emerald' : 'glass border-cyber/20 text-slate-400 hover:text-slate-300'
            }`}>
            <Scissors className="w-3.5 h-3.5" />
            Toggle Cutaway View {s.cutawayMode ? 'ON' : 'OFF'}
          </button>

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={s.loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald to-cyber text-slate-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed glow-emerald">
            {s.loading ? <><Loader2 className="w-4 h-4 animate-spin-slow" />Generating 3D-ULPIN...</> : <><QrCode className="w-4 h-4" />Generate 3D-ULPIN & Register Property</>}
          </button>
        </div>
      </div>

      {/* Output Card */}
      {s.result && (
        <div className="glass-strong rounded-2xl p-5 border border-emerald/25 animate-slide-in glow-emerald">
          <div className="text-center mb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Generated 3D-ULPIN Code</p>
            <div className="px-5 py-3 rounded-xl bg-slate-950/80 border-2 border-emerald/40 animate-pulse-glow inline-block">
              <span className="text-xl font-mono font-bold text-emerald text-glow tracking-wider break-all">{s.result.ulpin}</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-cyber/20 text-xs text-slate-300 hover:border-emerald/40 hover:text-emerald transition-all">
                {s.copied ? <><Check className="w-3.5 h-3.5 text-emerald" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy to Clipboard</>}
              </button>
              <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${s.result.source === 'api' ? 'bg-emerald/15 text-emerald border border-emerald/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                {s.result.source === 'api' ? 'LIVE API' : 'MOCK FALLBACK'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">Spatial Matrix</p>
            <div className="glass rounded-xl p-3">
              <MetaRow icon={Globe2} label="Latitude" value={s.result.latitude} unit="°N" />
              <MetaRow icon={Globe2} label="Longitude" value={s.result.longitude} unit="°E" />
              <MetaRow icon={Mountain} label="Z-Elevation" value={s.result.elevationMeters} unit="m" />
              <MetaRow icon={Navigation} label="MSL Altitude" value={s.result.altitudeMSL} unit="m" />
              <MetaRow icon={Ruler} label="Floor Area" value={s.result.totalArea.toLocaleString()} unit="sq ft" />
              <MetaRow icon={Calendar} label="Registration Date" value={s.result.registrationDate} />
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">Legal & Ownership</p>
            <div className="glass rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald to-cyber flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-slate-950" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Registered Owner</p>
                  <p className="text-sm font-semibold text-white truncate">{s.result.ownerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400"><Hash className="w-3.5 h-3.5 text-cyber" />Survey Plot: <span className="font-mono text-slate-200">{s.result.surveyPlot}</span></div>
              <div className="grid grid-cols-2 gap-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${s.result.taxStatus === 'PAID' ? 'bg-emerald/10 border-emerald/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                  <Receipt className={`w-4 h-4 flex-shrink-0 ${s.result.taxStatus === 'PAID' ? 'text-emerald' : 'text-amber-400'}`} />
                  <div><p className="text-[9px] text-slate-500 uppercase">Property Tax</p><p className={`text-xs font-bold ${s.result.taxStatus === 'PAID' ? 'text-emerald' : 'text-amber-400'}`}>{s.result.taxStatus}</p></div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald/10 border border-emerald/30">
                  <FileCheck className="w-4 h-4 text-emerald flex-shrink-0" />
                  <div><p className="text-[9px] text-slate-500 uppercase">Encumbrance</p><p className="text-xs font-bold text-emerald">{s.result.encumbranceStatus}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
