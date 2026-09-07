import { useState } from 'react';
import {
  ChevronDown,
  User,
  Hash,
  MapPin,
  Layers,
  Ruler,
  Home,
  Receipt,
  Globe,
  Loader2,
  Box,
  Satellite,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { OSMBuilding } from '@/services/api';

export interface AdminFormData {
  ownerName: string;
  surveyPlot: string;
  latitude: number;
  longitude: number;
  totalFloors: number;
  floorHeightM: number;
  flatUnit: string;
  taxStatus: 'PAID' | 'PENDING';
}

interface AdminPanelProps {
  formData: AdminFormData;
  setFormData: (data: AdminFormData) => void;
  useOSM: boolean;
  setUseOSM: (v: boolean) => void;
  onFetchOSM: () => void;
  osmLoading: boolean;
  osmBuildings: OSMBuilding[];
  osmError: string | null;
  onSubmit: () => void;
  submitting: boolean;
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-cyber" />
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 text-sm rounded-lg glass border border-cyber/20 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/30 transition-all';

export default function AdminPanel({
  formData,
  setFormData,
  useOSM,
  setUseOSM,
  onFetchOSM,
  osmLoading,
  osmBuildings,
  osmError,
  onSubmit,
  submitting,
}: AdminPanelProps) {
  const [open, setOpen] = useState(true);

  const update = <K extends keyof AdminFormData>(key: K, value: AdminFormData[K]) => {
    setFormData({ ...formData, [key]: value });
  };

  return (
    <div className="glass rounded-2xl border border-cyber/15 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald/30 to-cyber/20 flex items-center justify-center">
            <Box className="w-4 h-4 text-emerald" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-white">Ministry Admin Data Entry Portal</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Government Registration Module</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Body */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5 space-y-3.5">
          <div className="h-px bg-gradient-to-r from-transparent via-cyber/20 to-transparent mb-1" />

          <Field icon={User} label="Owner Name">
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => update('ownerName', e.target.value)}
              placeholder="Rahul Sharma"
              className={inputClass}
            />
          </Field>

          <Field icon={Hash} label="Survey Plot Number">
            <input
              type="text"
              value={formData.surveyPlot}
              onChange={(e) => update('surveyPlot', e.target.value)}
              placeholder="PLOT-402"
              className={`${inputClass} font-mono`}
            />
          </Field>

          {/* Lat / Long side by side */}
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Globe} label="Latitude">
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => update('latitude', parseFloat(e.target.value) || 0)}
                className={`${inputClass} font-mono`}
              />
            </Field>
            <Field icon={Globe} label="Longitude">
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => update('longitude', parseFloat(e.target.value) || 0)}
                className={`${inputClass} font-mono`}
              />
            </Field>
          </div>

          {/* OSM toggle */}
          <div className="glass rounded-xl p-3 border border-cyber/15">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-cyber" />
                <span className="text-xs font-semibold text-slate-300">Use Real-World Building Footprint (OSM)</span>
              </div>
              <button
                onClick={() => setUseOSM(!useOSM)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                  useOSM ? 'bg-emerald' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${
                    useOSM ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={onFetchOSM}
              disabled={!useOSM || osmLoading}
              className="w-full py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                useOSM
                  ? 'bg-cyber/15 border-cyber/40 text-cyber hover:bg-cyber/25'
                  : 'bg-slate-700/30 border-slate-600/30 text-slate-500'
              }"
            >
              {osmLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin-slow" />
                  Fetching from Overpass API...
                </span>
              ) : (
                'Fetch Location'
              )}
            </button>

            {osmError && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {osmError}
              </div>
            )}

            {osmBuildings.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                {osmBuildings.length} building(s) found · Footprint loaded
              </div>
            )}
          </div>

          {/* Floor slider 1-20 */}
          <Field icon={Layers} label={`Total Building Floors (${formData.totalFloors})`}>
            <input
              type="range"
              min={1}
              max={20}
              value={formData.totalFloors}
              onChange={(e) => update('totalFloors', Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between mt-1">
              {[1, 5, 10, 15, 20].map((n) => (
                <span
                  key={n}
                  className={`text-[10px] font-mono ${n === formData.totalFloors ? 'text-emerald font-bold' : 'text-slate-600'}`}
                >
                  {n}
                </span>
              ))}
            </div>
          </Field>

          <Field icon={Ruler} label="Floor Height in Meters">
            <input
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={formData.floorHeightM}
              onChange={(e) => update('floorHeightM', parseFloat(e.target.value) || 3.2)}
              className={`${inputClass} font-mono`}
            />
          </Field>

          <Field icon={Home} label="Selected Flat Unit">
            <input
              type="text"
              value={formData.flatUnit}
              onChange={(e) => update('flatUnit', e.target.value)}
              placeholder="402"
              className={`${inputClass} font-mono`}
            />
          </Field>

          <Field icon={Receipt} label="Property Tax Status">
            <select
              value={formData.taxStatus}
              onChange={(e) => update('taxStatus', e.target.value as 'PAID' | 'PENDING')}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
            </select>
          </Field>

          {/* Submit button */}
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald to-cyber text-slate-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed glow-emerald"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin-slow" />
                Registering & Generating Mesh...
              </>
            ) : (
              <>
                <Box className="w-4 h-4" />
                Register & Generate 3D Building Mesh
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
