import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/ui/EmptyState";

export default function AlertsPage() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [slackEnabled, setSlackEnabled] = useState(true);

  // Alert builder state
  const [symbol, setSymbol] = useState("");
  const [condition, setCondition] = useState("price_above");
  const [value, setValue] = useState("");
  
  // Data state
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const userEmail = localStorage.getItem("userEmail");

  const channels = [
    { label: "Email Alerts", icon: Mail, enabled: emailEnabled, toggle: setEmailEnabled },
    { label: "SMS Alerts", icon: MessageSquare, enabled: smsEnabled, toggle: setSmsEnabled },
    { label: "Slack Alerts", icon: Bell, enabled: slackEnabled, toggle: setSlackEnabled },
  ];

  const fetchAlerts = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`http://127.0.0.1:5000/api/alerts/${userEmail}`);
      const data = await res.json();
      if (data.status === "success") {
        setAlerts(data.alerts);
      }
    } catch (e) {
      console.error("Failed to fetch alerts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [userEmail]);

  const handleCreateAlert = async () => {
    if (!userEmail) {
      alert("Please login first to create alerts.");
      return;
    }
    if (!symbol || !value) {
      alert("Stock Symbol and Target Value are required.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/alerts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, symbol, condition, value })
      });
      const data = await res.json();
      if (data.status === "success") {
        setSymbol("");
        setValue("");
        fetchAlerts();
      } else {
        alert(data.message || "Failed to create alert");
      }
    } catch (e) {
      console.error("Failed to create alert:", e);
      alert("An error occurred while creating the alert.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/alerts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status === "success") {
        fetchAlerts();
      } else {
        alert(data.message || "Failed to delete alert");
      }
    } catch (e) {
      console.error("Failed to delete alert:", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">Alerts</h1>
          <p className="text-muted-foreground text-sm">Configure real-time trading alerts</p>
        </div>
      </div>

      {/* Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {channels.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <c.icon className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground text-sm md:text-base">{c.label}</span>
            </div>
            <Switch checked={c.enabled} onCheckedChange={c.toggle} />
          </motion.div>
        ))}
      </div>

      {/* Alert Builder */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card">
        <h3 className="section-title text-foreground mb-4">Alert Condition Builder</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 items-end">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Symbol</label>
            <Input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL" className="bg-secondary border-border text-foreground font-mono uppercase" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Condition</label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="price_above">Price Above Target</SelectItem>
                <SelectItem value="price_below">Price Below Target</SelectItem>
                <SelectItem value="rsi_above">RSI Above</SelectItem>
                <SelectItem value="rsi_below">RSI Below</SelectItem>
                <SelectItem value="macd_cross">MACD Crossover</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Value</label>
            <Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="150.00" className="bg-secondary border-border text-foreground font-mono" />
          </div>
          <Button onClick={handleCreateAlert} disabled={creating || !userEmail} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10">
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Alert
          </Button>
        </div>
        {!userEmail && <p className="text-xs text-warning mt-3 flex items-center"><Bell className="w-3 h-3 mr-1" /> You must be logged in to create alerts.</p>}
      </motion.div>

      {/* Active Alerts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card">
        <h3 className="section-title text-foreground mb-4">Active Alerts</h3>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState icon={Bell} title="No active alerts" description={userEmail ? "Create your first alert using the builder above." : "Log in to view and create alerts."} />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[550px]">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Symbol</th>
                  <th className="pb-3 font-medium">Condition</th>
                  <th className="pb-3 font-medium">Target Value</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a._id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 font-mono font-semibold text-foreground">{a.symbol}</td>
                    <td className="py-3 text-foreground capitalize">{a.condition.replace('_', ' ')}</td>
                    <td className="py-3 text-foreground font-mono">{a.value}</td>
                    <td className="py-3">
                      <span className={`signal-badge-${a.status === "active" ? "buy" : a.status === "triggered" ? "hold" : "sell"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{a.createdAt}</td>
                    <td className="py-3">
                      <button onClick={() => handleDelete(a._id)} className="text-muted-foreground hover:text-loss transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
