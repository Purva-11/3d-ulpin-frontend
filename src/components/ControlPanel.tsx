import {
  MapPin,
  Building,
  Hash,
  Layers,
  Home,
  QrCode,
  Loader2,
  Copy,
  Check,
  User,
  Receipt,
  FileCheck,
  Globe2,
  Ruler,
  Mountain,
  Calendar,
} from 'lucide-react';
import type { ULPINResponse } from '@/services/api';

interface ControlPanelProps {
  state: string;
  setState: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  surveyPlotNo: string;
  setSurveyPlotNo: (v: string) => void;
  floorLevel: number;
  setFloorLevel: (v: number) => void;
  flatUnit: string;
  setFlatUnit: (v: string) => void;
  onGenerate: () => void;
  loading: boolean;
  result: ULPINResponse | null;
  copied: boolean;
  onCopy: () => void;
}

const STATES = [
  { code: 'MH', label: 'Maharashtra - MH' },
  { code: 'DL', label: 'Delhi - DL' },
  { code: 'KA', label: 'Karnataka - KA' },
  { code: 'TN', label: 'Tamil Nadu - TN' },
  { code: 'RJ', label: 'Rajasthan - RJ' },
  { code: 'UP', label: 'Uttar Pradesh - UP' },
];

const DISTRICTS: Record<string, { code: string; label: string }[]> = {
  MH: [
    { code: 'NGP', label: 'Nagpur - NGP' },
    { code: 'MUM', label: 'Mumbai - MUM' },
    { code: 'PUN', label: 'Pune - PUN' },
  ],
  DL: [
    { code: 'CND', label: 'Central Delhi - CND' },
    { code: 'NDL', label: 'New Delhi - NDL' },
  ],
  KA: [
    { code: 'BLR', label: 'Bengaluru - BLR' },
    { code: 'MYS', label: 'Mysuru - MYS' },
  ],
  TN: [
    { code: 'CEN', label: 'Chennai - CEN' },
    { code: 'COI', label: 'Coimbatore - COI' },
  ],
  RJ: [
    { code: 'JPR', label: 'Jaipur - JPR' },
    { code: 'JOD', label: 'Jodhpur - JOD' },
  ],
  UP: [
    { code: 'LKO', label: 'Lucknow - LKO' },
    { code: 'NOI', label: 'Noida - NOI' },
  ],
};

const FLAT_OPTIONS = ['Flat 401', 'Flat 402'];

function SelectField({
  icon: Icon,
  label,
  value,
  onChange,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-cyber" />
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm rounded-lg glass border border-cyber/20 text-slate-200 focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/30 transition-all cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

function InputField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-cyber" />
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm rounded-lg glass border border-cyber/20 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/30 transition-all font-mono"
      />
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-cyber" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <span className="text-xs font-mono text-slate-200 font-medium">
        {value}
        {unit && <span className="text-slate-500 ml-1">{unit}</span>}
      </span>
    </div>
  );
}

export default function ControlPanel(props: ControlPanelProps) {
  const {
    state,
    setState,
    district,
    setDistrict,
    surveyPlotNo,
    setSurveyPlotNo,
    floorLevel,
    setFloorLevel,
    flatUnit,
    setFlatUnit,
    onGenerate,
    loading,
    result,
    copied,
    onCopy,
  } = props;

  const districtOptions = DISTRICTS[state] || DISTRICTS.MH;

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto p-4">
      {/* Form Card */}
      <div className="glass rounded-2xl p-5 border border-cyber/15">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cyber/15 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-cyber" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">3D-ULPIN Generator</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Property Registration Module</p>
          </div>
        </div>

        <div className="space-y-3.5">
          <SelectField icon={MapPin} label="State" value={state} onChange={setState}>
            {STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </SelectField>

          <SelectField icon={Building} label="District" value={district} onChange={setDistrict}>
            {districtOptions.map((d) => (
              <option key={d.code} value={d.code}>{d.label}</option>
            ))}
          </SelectField>

          <InputField icon={Hash} label="Survey Plot No." value={surveyPlotNo} onChange={setSurveyPlotNo} placeholder="402/A" />

          {/* Floor slider */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyber" />
              Floor Level
              <span className="ml-auto text-emerald font-mono text-sm normal-case tracking-normal">Level {floorLevel}</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={floorLevel}
              onChange={(e) => setFloorLevel(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`text-[10px] font-mono ${n === floorLevel ? 'text-emerald font-bold' : 'text-slate-600'}`}>
                  F{n}
                </span>
              ))}
            </div>
          </div>

          {/* Flat unit */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-cyber" />
              Flat Unit
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FLAT_OPTIONS.map((opt) => {
                const isActive = flatUnit === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setFlatUnit(opt)}
                    className={`px-3 py-2.5 text-sm rounded-lg border transition-all ${
                      isActive
                        ? 'bg-emerald/15 border-emerald/50 text-emerald font-semibold glow-emerald'
                        : 'glass border-cyber/15 text-slate-400 hover:border-cyber/30 hover:text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={onGenerate}
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald to-cyber text-slate-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed glow-emerald"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin-slow" />
                Generating 3D-ULPIN...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Generate 3D-ULPIN & Register Property
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Card */}
      {result && (
        <div className="glass-strong rounded-2xl p-5 border border-emerald/25 animate-slide-in glow-emerald">
          {/* ULPIN Badge */}
          <div className="text-center mb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Generated 3D-ULPIN Code</p>
            <div className="relative inline-block">
              <div className="px-5 py-3 rounded-xl bg-slate-950/80 border-2 border-emerald/40 animate-pulse-glow">
                <span className="text-xl font-mono font-bold text-emerald text-glow tracking-wider break-all">
                  {result.ulpin}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                onClick={onCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-cyber/20 text-xs text-slate-300 hover:border-emerald/40 hover:text-emerald transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy to Clipboard
                  </>
                )}
              </button>
              <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                result.source === 'api'
                  ? 'bg-emerald/15 text-emerald border border-emerald/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {result.source === 'api' ? 'LIVE API' : 'MOCK FALLBACK'}
              </span>
            </div>
          </div>

          {/* Spatial Metadata */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">Spatial Metadata</p>
            <div className="glass rounded-xl p-3">
              <MetaRow icon={Globe2} label="Latitude" value={result.metadata.latitude} unit="°N" />
              <MetaRow icon={Globe2} label="Longitude" value={result.metadata.longitude} unit="°E" />
              <MetaRow icon={Mountain} label="Altitude (Z-Height)" value={result.metadata.altitude} unit="m" />
              <MetaRow icon={Ruler} label="Total Area" value={result.metadata.totalArea.toLocaleString()} unit="sq ft" />
              <MetaRow icon={Calendar} label="Registration Date" value={result.metadata.registrationDate} />
            </div>
          </div>

          {/* Ownership Card */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">Ownership & Status</p>
            <div className="glass rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald to-cyber flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-950" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Registered Owner</p>
                  <p className="text-sm font-semibold text-white truncate">{result.metadata.ownerName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald/10 border border-emerald/30">
                  <Receipt className="w-4 h-4 text-emerald flex-shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase">Property Tax</p>
                    <p className="text-xs font-bold text-emerald">PAID</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald/10 border border-emerald/30">
                  <FileCheck className="w-4 h-4 text-emerald flex-shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase">Encumbrance</p>
                    <p className="text-xs font-bold text-emerald">CLEAR</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
