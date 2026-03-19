import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, Minus, Loader2, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { mockCandlestickData } from "@/lib/mockData";
import { ChartSkeleton } from "@/components/ui/PageSkeleton";
import EmptyState from "@/components/ui/EmptyState";

const models = ["Random Forest", "LSTM Neural Network", "Gradient Boosting", "XGBoost"];
const timeframes = ["1D", "1W", "1M", "3M", "1Y"];

// Model-specific configurations
const modelConfigs: Record<string, {
  description: string;
  baseConfidence: number;
  features: { feature: string; importance: number }[];
  signalBias: "bullish" | "bearish" | "neutral";
  metrics: { label: string; value: string }[];
}> = {
  "Random Forest": {
    description: "Ensemble of decision trees with bootstrap aggregation for robust predictions",
    baseConfidence: 85,
    signalBias: "bullish",
    features: [
      { feature: "RSI (14)", importance: 0.23 },
      { feature: "MACD Signal", importance: 0.19 },
      { feature: "Volume MA", importance: 0.16 },
      { feature: "Bollinger Band", importance: 0.14 },
      { feature: "EMA (50)", importance: 0.11 },
      { feature: "ATR (14)", importance: 0.09 },
      { feature: "Stochastic", importance: 0.08 },
    ],
    metrics: [
      { label: "Trees", value: "500" },
      { label: "Max Depth", value: "12" },
      { label: "Accuracy", value: "87.3%" },
    ],
  },
  "LSTM Neural Network": {
    description: "Deep learning model specialized for sequential time-series pattern recognition",
    baseConfidence: 78,
    signalBias: "neutral",
    features: [
      { feature: "Price Momentum", importance: 0.28 },
      { feature: "Volume Trend", importance: 0.22 },
      { feature: "Volatility Pattern", importance: 0.18 },
      { feature: "Moving Avg Cross", importance: 0.12 },
      { feature: "Support/Resistance", importance: 0.10 },
      { feature: "Trend Direction", importance: 0.06 },
      { feature: "Seasonality", importance: 0.04 },
    ],
    metrics: [
      { label: "Layers", value: "4" },
      { label: "Units", value: "128" },
      { label: "Epochs", value: "100" },
    ],
  },
  "Gradient Boosting": {
    description: "Sequential ensemble method that builds trees to correct previous errors",
    baseConfidence: 82,
    signalBias: "bearish",
    features: [
      { feature: "Price Change %", importance: 0.25 },
      { feature: "RSI Divergence", importance: 0.20 },
      { feature: "MACD Histogram", importance: 0.17 },
      { feature: "Volume Spike", importance: 0.13 },
      { feature: "52W High/Low", importance: 0.10 },
      { feature: "Sector Momentum", importance: 0.08 },
      { feature: "VIX Correlation", importance: 0.07 },
    ],
    metrics: [
      { label: "Estimators", value: "200" },
      { label: "Learning Rate", value: "0.05" },
      { label: "AUC Score", value: "0.89" },
    ],
  },
  "XGBoost": {
    description: "Optimized gradient boosting with regularization for high performance",
    baseConfidence: 91,
    signalBias: "bullish",
    features: [
      { feature: "Technical Score", importance: 0.26 },
      { feature: "Momentum Index", importance: 0.21 },
      { feature: "Volatility Adj.", importance: 0.15 },
      { feature: "Relative Strength", importance: 0.14 },
      { feature: "Order Flow", importance: 0.10 },
      { feature: "Sentiment Score", importance: 0.08 },
      { feature: "Macro Factor", importance: 0.06 },
    ],
    metrics: [
      { label: "Rounds", value: "300" },
      { label: "Max Depth", value: "8" },
      { label: "F1 Score", value: "0.92" },
    ],
  },
};


export default function SignalEngine() {
  const [model, setModel] = useState("Random Forest");
  const [symbol, setSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState("1M");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultKey, setResultKey] = useState(0); // To trigger re-animation

  const [apiResult, setApiResult] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(false);
    try {
      const response = await fetch(`http://127.0.0.1:5000/predict/${symbol}`);
      if (!response.ok) {
        throw new Error("Failed to fetch prediction");
      }
      const data = await response.json();
      
      if (data.status === "error") {
        throw new Error(data.message);
      }
      
      const config = modelConfigs[model as keyof typeof modelConfigs] || modelConfigs["Random Forest"];
      
      setApiResult({
        signal: data.signal || "HOLD",
        confidence: data.confidence ? Math.round(data.confidence * 100) : 50,
        features: config.features,
        description: config.description,
        metrics: config.metrics
      });
      
      setResultKey((k) => k + 1);
      setGenerated(true);
    } catch (error) {
      console.error(error);
      alert("Error generating signal from backend: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">ML Signal Engine</h1>
        <p className="text-muted-foreground text-sm">Generate AI-powered trading signals</p>
      </div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">ML Model</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {models.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Stock Symbol</label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL" className="bg-secondary border-border text-foreground font-mono" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Timeframe</label>
            <div className="flex gap-1 flex-wrap">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeframe === tf ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-2 flex justify-end">
            <Button onClick={handleGenerate} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-10 w-full sm:w-auto">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              {loading ? "Analyzing..." : "Generate Signal"}
            </Button>
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartSkeleton height={200} />
          <div className="lg:col-span-2"><ChartSkeleton height={200} /></div>
        </div>
      )}

      {!generated && !loading && (
        <EmptyState
          icon={Brain}
          title="No Signal Generated"
          description="Select a model, enter a stock symbol, and click Generate Signal to see AI-powered trading recommendations."
        />
      )}

      {apiResult && !loading && (
        <>
          {/* Model Info Banner */}
          <motion.div
            key={`info-${resultKey}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">{model}</span>
              <p className="text-sm text-muted-foreground mt-0.5">{apiResult.description}</p>
            </div>
          </motion.div>

          {/* Signal Result */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div
              key={`signal-${resultKey}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card flex flex-col items-center justify-center py-8"
            >
              <span className="text-sm text-muted-foreground mb-3">Signal for {symbol}</span>
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-4 ${
                apiResult.signal === "BUY" ? "bg-gain/10 text-gain" : 
                apiResult.signal === "SELL" ? "bg-loss/10 text-loss" : 
                "bg-warning/10 text-warning"
              }`}>
                {apiResult.signal === "BUY" ? <TrendingUp className="w-8 h-8 md:w-10 md:h-10" /> : 
                 apiResult.signal === "SELL" ? <TrendingDown className="w-8 h-8 md:w-10 md:h-10" /> : 
                 <Minus className="w-8 h-8 md:w-10 md:h-10" />}
              </div>
              <span className={`text-2xl md:text-3xl font-bold ${
                apiResult.signal === "BUY" ? "text-gain" : 
                apiResult.signal === "SELL" ? "text-loss" : 
                "text-warning"
              }`}>{apiResult.signal}</span>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <span className="text-lg font-bold text-foreground">{apiResult.confidence}%</span>
              </div>
              <div className="w-32 h-2 rounded-full bg-secondary mt-2 overflow-hidden">
                <motion.div
                  key={`conf-${resultKey}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${apiResult.confidence}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    apiResult.signal === "BUY" ? "bg-gain" : 
                    apiResult.signal === "SELL" ? "bg-loss" : 
                    "bg-warning"
                  }`}
                />
              </div>

              {/* Model Metrics */}
              <div className="mt-6 w-full px-4">
                <div className="border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Model Parameters</span>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {apiResult.metrics.map((m: any) => (
                      <div key={m.label} className="text-center">
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                        <div className="font-mono text-sm text-foreground">{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature Importance */}
            <motion.div
              key={`features-${resultKey}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card lg:col-span-2"
            >
              <h3 className="section-title text-foreground mb-4">Feature Importance — {model}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={apiResult.features} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 18%)" />
                  <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={12} domain={[0, 0.3]} />
                  <YAxis dataKey="feature" type="category" stroke="hsl(215, 15%, 55%)" fontSize={11} width={110} />
                  <Tooltip
                    contentStyle={{ background: "hsl(222, 41%, 10%)", border: "1px solid hsl(222, 20%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 93%)" }}
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Importance"]}
                  />
                  <Bar
                    dataKey="importance"
                    fill={apiResult.signal === "BUY" ? "hsl(160, 84%, 39%)" : apiResult.signal === "SELL" ? "hsl(0, 72%, 51%)" : "hsl(38, 92%, 50%)"}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Price Chart */}
          <motion.div
            key={`chart-${resultKey}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
          >
            <h3 className="section-title text-foreground mb-4">Price Chart with Signals — {symbol}</h3>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={mockCandlestickData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 18%)" />
                <XAxis dataKey="date" stroke="hsl(215, 15%, 55%)" fontSize={11} interval={9} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} domain={["dataMin - 5", "dataMax + 5"]} />
                <Tooltip contentStyle={{ background: "hsl(222, 41%, 10%)", border: "1px solid hsl(222, 20%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 93%)" }} />
                <Line type="monotone" dataKey="close" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload.signal) return <circle key={props.key} r={0} />;
                  return (
                    <circle key={props.key} cx={cx} cy={cy} r={6}
                      fill={payload.signal === "BUY" ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)"}
                      stroke="hsl(222, 41%, 10%)" strokeWidth={2}
                    />
                  );
                }} />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      )}
    </div>
  );
}
