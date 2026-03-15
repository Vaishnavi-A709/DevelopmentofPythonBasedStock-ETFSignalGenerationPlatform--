import { useEffect, useState } from "react"
import { getStocks, getPrediction } from "@/lib/api"

type Ticker = {
  symbol: string
  price: number
  change: number
}

export default function MarketTicker() {

  const [tickerData, setTickerData] = useState<Ticker[]>([])

  useEffect(() => {

    const loadTicker = async () => {

      try {

        const stocksRes = await getStocks()

        const stocks = stocksRes.available_stocks

        const predictions = await Promise.all(
          stocks.map(async (symbol: string) => {

            const res = await getPrediction(symbol)

            return {
              symbol: symbol,
              price: res.price || 0,
              change: res.confidence ? res.confidence * 100 : 0
            }

          })
        )

        setTickerData(predictions)

      } catch (error) {
        console.error("Error loading ticker:", error)
      }

    }

    loadTicker()

  }, [])

  const items = [...tickerData, ...tickerData]

  return (
    <div className="overflow-hidden border-b border-border bg-secondary/30 py-2">
      <div className="ticker-scroll">

        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-2 text-sm font-mono">

            <span className="font-semibold text-foreground">
              {t.symbol}
            </span>

            <span className="text-muted-foreground">
              ${t.price.toFixed(2)}
            </span>

            <span className={t.change >= 0 ? "text-gain" : "text-loss"}>
              {t.change >= 0 ? "+" : ""}{t.change.toFixed(2)}%
            </span>

          </span>
        ))}

      </div>
    </div>
  )
}