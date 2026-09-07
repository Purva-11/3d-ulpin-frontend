import { useState } from 'react';
import { Search, Building2, ShieldCheck, Boxes, Loader2 } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchResult: string | null;
  searchLoading: boolean;
}

export default function Header({ onSearch, searchResult, searchLoading }: HeaderProps) {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <header className="glass-strong border-b border-cyber/20 px-6 py-3 z-50 relative">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left - Title + Status */}
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
                BHOOMI-3D
                <span className="text-emerald ml-2 text-glow">: National Vertical Land Registry</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono tracking-wider">
                PS SIH26011 · National Bhoomi 3D Registry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald/10 border border-emerald/30 animate-pulse-glow">
            <ShieldCheck className="w-4 h-4 text-emerald" />
            <span className="text-xs font-semibold text-emerald tracking-wide">Stage 2 Screening Active</span>
          </div>
        </div>

        {/* Right - Search + Branding */}
        <div className="flex items-center gap-4 flex-wrap">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Lookup ULPIN (e.g. MH09-88F2-Z04-U02)..."
              className="w-72 pl-9 pr-4 py-2 text-sm rounded-lg glass border border-cyber/20 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald/50 focus:ring-1 focus:ring-emerald/30 transition-all"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald animate-spin-slow" />
            )}
          </form>

          {searchResult && (
            <div className="text-xs text-slate-400 font-mono animate-fade-in max-w-[200px] truncate">
              {searchResult}
            </div>
          )}

          <div className="flex items-center gap-2 pl-4 border-l border-slate-700/50">
            <Boxes className="w-5 h-5 text-cyber" />
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-300 leading-tight">Ministry of</p>
              <p className="text-xs font-semibold text-slate-300 leading-tight">Rural Development</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
