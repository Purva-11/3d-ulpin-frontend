import { useState } from 'react';
import { Search, Building2, ShieldCheck, Boxes, Loader2, Activity } from 'lucide-react';
import { useStore } from '@/store';
import { lookupULPIN } from '@/services/api';

export default function Header() {
  const [query, setQuery] = useState('');
  const setSearch = useStore((s) => s.setSearch);
  const searchLoading = useStore((s) => s.searchLoading);
  const searchResult = useStore((s) => s.searchResult);
  const selectFloor = useStore((s) => s.selectFloor);
  const triggerFocus = useStore((s) => s.triggerFocus);
  const setToast = useStore((s) => s.setToast);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearch(true, null);
    const found = await lookupULPIN(query.trim());
    if (found) {
      setSearch(false, `Found: ${found.ulpin} — ${found.ownerName}`);
      selectFloor(Math.max(0, found.floorNumber - 1));
      triggerFocus();
      setToast('ULPIN found — focusing 3D floor');
    } else {
      setSearch(false, `No record found for "${query.trim()}"`);
      setToast('ULPIN not found');
    }
    setTimeout(() => setSearch(false, null), 5000);
  };

  return (
    <header className="glass-strong border-b border-cyber/20 px-6 py-3 z-50 relative">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald to-cyber flex items-center justify-center glow-emerald">
                <Building2 className="w-6 h-6 text-slate-950" strokeWidth={2.2} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald border-2 border-slate-950 animate-pulse-glow flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight tracking-tight">
                BHOOMI-3D<span className="text-emerald ml-2 text-glow">: National Vertical Land Registry</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono tracking-wider">PS SIH26011 · National Bhoomi 3D Registry</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald/10 border border-emerald/30 animate-pulse-glow">
            <Activity className="w-4 h-4 text-emerald" />
            <span className="text-xs font-semibold text-emerald tracking-wide">Stage 2 Screening - Live PostGIS / WebGL Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by 3D-ULPIN code..."
              className="w-72 pl-9 pr-4 py-2 text-sm rounded-lg glass border border-cyber/20 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/30 transition-all" />
            {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald animate-spin-slow" />}
          </form>
          {searchResult && <div className="text-xs text-slate-400 font-mono animate-fade-in max-w-[200px] truncate">{searchResult}</div>}
          <div className="flex items-center gap-2 pl-4 border-l border-slate-700/50">
            <ShieldCheck className="w-5 h-5 text-cyber" />
            <div className="text-right"><p className="text-xs font-semibold text-slate-300 leading-tight">Ministry of</p><p className="text-xs font-semibold text-slate-300 leading-tight">Rural Development</p></div>
          </div>
        </div>
      </div>
    </header>
  );
}
