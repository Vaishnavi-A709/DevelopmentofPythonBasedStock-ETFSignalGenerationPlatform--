import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Mocks removed in favor of live data
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/PageSkeleton";
import EmptyState from "@/components/ui/EmptyState";

const sectors = ["All", "Technology", "Healthcare", "Finance", "Energy", "Consumer"];

export default function MarketDataPage() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [topGainers, setTopGainers] = useState<any[]>([]);
  const [topLosers, setTopLosers] = useState<any[]>([]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/market/overview");
        const json = await res.json();
        
        if (json.data) {
          setMarketData(json.data);
          
          const sorted = [...json.data].sort((a, b) => b.change - a.change);
          setTopGainers(sorted.slice(0, 3));
          
          const sortedLosers = [...json.data].sort((a, b) => a.change - b.change);
          setTopLosers(sortedLosers.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching market data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarketData();
  }, []);

  const filtered = marketData.filter((s) => {
    const matchSearch = s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase());
    const matchSector = sector === "All" || s.sector === sector;
    return matchSearch && matchSector;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-secondary rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-secondary rounded animate-pulse" />
        </div>
        <StatCardSkeleton count={2} />
        <TableSkeleton cols={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">Market Data</h1>
        <p className="text-muted-foreground text-sm">Live stock prices and market overview</p>
      </div>

      {/* Top Gainers/Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
          <h3 className="section-title text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gain" /> Top Gainers
          </h3>
          <div className="space-y-3">
            {topGainers.map((s) => (
              <div key={s.symbol} className="flex items-center justify-between p-3 rounded-lg bg-gain/5 border border-gain/10">
                <div>
                  <span className="font-mono font-semibold text-foreground">{s.symbol}</span>
                  <span className="text-muted-foreground text-sm ml-2 hidden sm:inline">{s.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-foreground text-sm">₹{s.price.toFixed(2)}</div>
                  <div className="text-gain text-sm font-mono">+{s.change.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card">
          <h3 className="section-title text-foreground mb-3 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-loss" /> Top Losers
          </h3>
          <div className="space-y-3">
            {topLosers.map((s) => (
              <div key={s.symbol} className="flex items-center justify-between p-3 rounded-lg bg-loss/5 border border-loss/10">
                <div>
                  <span className="font-mono font-semibold text-foreground">{s.symbol}</span>
                  <span className="text-muted-foreground text-sm ml-2 hidden sm:inline">{s.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-foreground text-sm">₹{s.price.toFixed(2)}</div>
                  <div className="text-loss text-sm font-mono">{s.change.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search stocks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border text-foreground" />
        </div>
        <Select value={sector} onValueChange={setSector}>
          <SelectTrigger className="w-full sm:w-40 bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            {sectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No stocks found"
          description="Try a different search term or sector filter."
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card">
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Symbol</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Change</th>
                  <th className="pb-3 font-medium">Volume</th>
                  <th className="pb-3 font-medium">Mkt Cap</th>
                  <th className="pb-3 font-medium">P/E</th>
                  <th className="pb-3 font-medium">Sector</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.symbol} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 font-mono font-semibold text-foreground">{s.symbol}</td>
                    <td className="py-3 text-muted-foreground">{s.name}</td>
                    <td className="py-3 font-mono text-foreground">₹{s.price.toFixed(2)}</td>
                    <td className={`py-3 font-mono ${s.change >= 0 ? "text-gain" : "text-loss"}`}>{s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%</td>
                    <td className="py-3 text-muted-foreground">{s.volume}</td>
                    <td className="py-3 text-muted-foreground">{s.marketCap}</td>
                    <td className="py-3 font-mono text-muted-foreground">{s.pe}</td>
                    <td className="py-3 text-muted-foreground">{s.sector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
