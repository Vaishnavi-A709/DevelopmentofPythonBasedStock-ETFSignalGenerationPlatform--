import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import MarketTicker from "@/components/dashboard/MarketTicker";
import { StatCardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/PageSkeleton";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

const anim = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.08 },
});

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [portfolioData, setPortfolioData] = useState<any>(null);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [dashRes, portRes] = await Promise.all([
          fetch(`http://127.0.0.1:5000/api/dashboard?email=${userEmail}`).then(r => r.json()),
          fetch(`http://127.0.0.1:5000/api/portfolio?email=${userEmail}`).then(r => r.json())
        ]);
        
        setDashboardData(dashRes);
        setPortfolioData(portRes);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const stats = [
    { label: "Total Signals", value: dashboardData?.totalSignals?.toString() || "0", icon: Activity, color: "text-primary" },
    { label: "Active Buy", value: dashboardData?.activeBuy?.toString() || "0", icon: TrendingUp, color: "text-gain" },
    { label: "Active Sell", value: dashboardData?.activeSell?.toString() || "0", icon: TrendingDown, color: "text-loss" },
    { label: "Portfolio Return", value: portfolioData?.totalReturnPercent ? `${portfolioData.totalReturnPercent > 0 ? '+' : ''}${portfolioData.totalReturnPercent.toFixed(1)}%` : "0.0%", icon: BarChart3, color: "text-gain" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <StatCardSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton height={200} />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MarketTicker />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...anim(i)} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="stat-label text-xs md:text-sm">{s.label}</span>
              <s.icon className={`w-4 h-4 md:w-5 md:h-5 ${s.color}`} />
            </div>
            <AnimatedCounter value={s.value} className="stat-value text-lg md:text-2xl text-foreground" />
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...anim(4)} className="glass-card lg:col-span-2">
          <h3 className="section-title text-foreground mb-4">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={portfolioData?.equityCurve || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 18%)" />
              <XAxis dataKey="date" stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(222, 41%, 10%)", border: "1px solid hsl(222, 20%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 93%)" }} />
              <Line type="monotone" dataKey="value" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={false} name="Portfolio" />
              <Line type="monotone" dataKey="benchmark" stroke="hsl(215, 15%, 55%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Benchmark" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...anim(5)} className="glass-card">
          <h3 className="section-title text-foreground mb-4">Signal Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={dashboardData?.signalDistribution || []} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" cx="50%" cy="50%">
                {(dashboardData?.signalDistribution || []).map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(222, 41%, 10%)", border: "1px solid hsl(222, 20%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 93%)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {(dashboardData?.signalDistribution || []).map((d: any) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                <span className="text-muted-foreground">{d.name} ({d.value}%)</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Signals Table */}
      <motion.div {...anim(6)} className="glass-card">
        <h3 className="section-title text-foreground mb-4">Recent Signals</h3>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Symbol</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Change</th>
                <th className="pb-3 font-medium">Signal</th>
                <th className="pb-3 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {(dashboardData?.recentSignals || []).map((s: any) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 font-mono font-semibold text-foreground">{s.symbol}</td>
                  <td className="py-3 text-muted-foreground">{s.name}</td>
                  <td className="py-3 font-mono text-foreground">₹{s.price?.toFixed(2) || "0.00"}</td>
                  <td className={`py-3 font-mono ${s.changePercent >= 0 ? "text-gain" : "text-loss"}`}>
                    {s.changePercent >= 0 ? "+" : ""}{s.changePercent.toFixed(2)}%
                  </td>
                  <td className="py-3">
                    <span className={`signal-badge-${s.signal.toLowerCase()}`}>{s.signal}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${s.confidence}%` }} />
                      </div>
                      <span className="text-muted-foreground text-xs">{s.confidence}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
