import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { StatCardSkeleton, ChartSkeleton } from "@/components/ui/PageSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function PortfolioAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");

  const fetchPortfolio = async () => {
    setLoading(true);
    const email = localStorage.getItem("userEmail");
    if (!email) {
      setLoading(false);
      return; 
    }
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/portfolio?email=${email}`);
      const json = await res.json();
      if (!json.error) setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleAddPosition = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) return alert("You must login to add a stock!");
    if (!symbol || !shares || !price) return alert("Fill all fields");
    
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/portfolio/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, symbol, shares: Number(shares), avgPrice: Number(price) })
      });
      const resData = await res.json();
      if (resData.error) {
         alert(resData.error);
      } else {
         setShowAdd(false);
         setSymbol(""); setShares(""); setPrice("");
         fetchPortfolio();
      }
    } catch(e) {
      console.error(e);
      alert("Failed to connect to backend");
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-secondary rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-secondary rounded animate-pulse" />
        </div>
        <StatCardSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton height={220} />
        </div>
      </div>
    );
  }

  const hasData = data && data.positions > 0;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">Portfolio Analytics (Live)</h1>
          <p className="text-muted-foreground text-sm">Real-time performance tracked directly from your MongoDB Trades</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Position
        </Button>
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card flex gap-4 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Symbol (e.g. RELIANCE)</label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="TCS" className="bg-secondary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Shares Bought</label>
            <Input type="number" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="10" className="bg-secondary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Buy Price ($ / ₹)</label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2500" className="bg-secondary" />
          </div>
          <Button onClick={handleAddPosition} className="bg-gain hover:bg-gain/90 text-white">Confirm Data</Button>
        </motion.div>
      )}

      {!hasData ? (
        <EmptyState title="Portfolio Empty" description="You have no stocks in your database! Click Add Position to create your real portfolio." icon={Plus} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4">
            {[
              { label: "Total Invested", value: `₹${data.totalInvested.toLocaleString()}` },
              { label: "Live Total Value", value: `₹${data.totalValue.toLocaleString()}` },
              { label: "Daily P&L", value: `${data.dailyPnl >= 0 ? "+" : ""}₹${data.dailyPnl.toLocaleString()}`, positive: data.dailyPnl >= 0 },
              { label: "Total Return", value: `${data.totalReturnPercent >= 0 ? "+" : ""}${data.totalReturnPercent}%`, positive: data.totalReturnPercent >= 0 },
              { label: "Total Roles", value: data.positions.toString() },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
                <span className="stat-label text-xs md:text-sm">{s.label}</span>
                <span className={`stat-value text-lg md:text-2xl ${s.positive ? "text-gain" : (s.positive === false ? "text-loss" : "text-foreground")}`}>{s.value}</span>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card lg:col-span-2">
              <h3 className="section-title text-foreground mb-4">Performance Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 18%)" />
                  <XAxis dataKey="date" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "hsl(222, 41%, 10%)", border: "1px solid hsl(222, 20%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 93%)" }} />
                  <Line type="monotone" dataKey="value" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card">
              <h3 className="section-title text-foreground mb-4">Live Sector Allocation</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.sectorAllocation} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" cx="50%" cy="50%">
                    {data.sectorAllocation.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(222, 41%, 10%)", border: "1px solid hsl(222, 20%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 93%)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {data.sectorAllocation.map((d: any) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="text-foreground font-mono">{d.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
