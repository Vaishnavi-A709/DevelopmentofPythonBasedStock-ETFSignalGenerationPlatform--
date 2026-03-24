import pandas as pd
import yfinance as yf
from flask import Blueprint, request, jsonify

backtest_bp = Blueprint('backtest', __name__)

@backtest_bp.route('', methods=['POST'])
def run_backtest():
    data = request.json
    strategy = data.get("strategy", "Moving Average Crossover")
    start_date = data.get("startDate", "2024-01-01")
    end_date = data.get("endDate", "2024-12-31")
    initial_capital = float(data.get("initialCapital", 100000))

    from datetime import datetime, timedelta
    
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        fetch_start = (start_dt - timedelta(days=100)).strftime("%Y-%m-%d")
    except:
        fetch_start = start_date

    # Core robust stocks to simulate portfolio backtesting
    symbols = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "SBIN.NS"]
    
    all_trades = []
    
    try:
        # Download Nifty 50 for benchmark
        benchmark = yf.download("^NSEI", start=start_date, end=end_date, progress=False)
        if benchmark.empty:
            benchmark = yf.download("SPY", start=start_date, end=end_date, progress=False)
    except Exception as e:
        print("Benchmark fetch error:", e)
        return jsonify({"error": "Failed to fetch benchmark data"}), 400

    dates = benchmark.index
    
    # Scan each symbol for strategy rules
    for sym in symbols:
        try:
            # Fetch with historical buffer so SMA50 can calculate
            df = yf.download(sym, start=fetch_start, end=end_date, progress=False)
            if df.empty: continue
                
            # Handle yfinance multi-index if downloading multiple or single
            if isinstance(df.columns, pd.MultiIndex):
                close_series = df[('Close', sym)]
            else:
                close_series = df['Close']
                
            # Create brand new dataframe to strip away any yfinance MultiIndex junk
            clean_df = pd.DataFrame()
            clean_df['Close_Price'] = close_series
            
            # Simple Moving Average Crossover Logic (20 vs 50)
            clean_df['SMA_20'] = clean_df['Close_Price'].rolling(window=20).mean()
            clean_df['SMA_50'] = clean_df['Close_Price'].rolling(window=50).mean()
            
            trade_df = clean_df.dropna().copy()
            if trade_df.empty: continue
                
            in_position = False
            entry_price = 0
            
            for index, row in trade_df.iterrows():
                sma20 = row['SMA_20']
                sma50 = row['SMA_50']
                price = row['Close_Price']
                
                is_buy = sma20 > sma50
                is_sell = sma20 < sma50
                
                if not in_position and is_buy:
                    in_position = True
                    entry_price = price
                elif in_position and is_sell:
                    in_position = False
                    exit_price = price
                    pnl = exit_price - entry_price
                    pnl_percent = (pnl / entry_price) * 100
                    
                    # Only record the trade if the EXIT date falls inside the user's requested window
                    if index >= pd.to_datetime(start_date):
                        all_trades.append({
                            "id": len(all_trades) + 1,
                            "date": index.strftime('%Y-%m-%d'),
                            "symbol": sym.replace(".NS", ""),
                            "type": "LONG",
                            "entry": float(entry_price),
                            "exit": float(exit_price),
                            "pnl": float(pnl),
                            "pnlPercent": float(pnl_percent)
                        })
        except Exception as e:
            print(f"Error processing backtest for {sym}: {e}")
            
    all_trades = sorted(all_trades, key=lambda x: x['date'])
    
    # Standardize trade ID chronologically
    for i, t in enumerate(all_trades):
        t["id"] = i + 1

    total_trades = len(all_trades)
    winning_trades = len([t for t in all_trades if t['pnl'] > 0])
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    
    gross_profit = sum([t['pnl'] for t in all_trades if t['pnl'] > 0])
    gross_loss = abs(sum([t['pnl'] for t in all_trades if t['pnl'] < 0]))
    profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 0)
    
    # Portfolio Equity Simulation
    equity_curve = []
    current_equity = initial_capital
    
    if not benchmark.empty:
        if isinstance(benchmark.columns, pd.MultiIndex):
            bench_close = benchmark[('Close', benchmark.columns.levels[1][0])]
        else:
            bench_close = benchmark['Close']
            
        bench_start = bench_close.iloc[0]
        
        # Assume 10% risk allocation per trade
        trade_size = initial_capital * 0.10 
        
        for date in dates:
            d_str = date.strftime('%Y-%m-%d')
            day_pnl = 0
            for t in all_trades:
                if t['date'] == d_str:
                    day_pnl += trade_size * (t['pnlPercent'] / 100)
            
            current_equity += day_pnl
            b_val = (bench_close.loc[date] / bench_start) * initial_capital if date in bench_close.index else current_equity
            
            equity_curve.append({
                "date": d_str,
                "value": float(current_equity),
                "benchmark": float(b_val)
            })
            
    max_equity = initial_capital
    max_dd = 0
    for e in equity_curve:
        if e['value'] > max_equity:
            max_equity = e['value']
        dd = (e['value'] - max_equity) / max_equity * 100
        if dd < max_dd:
            max_dd = dd
            
    cagr = 0
    if len(equity_curve) > 0:
        years = len(equity_curve) / 252
        final_equity = equity_curve[-1]['value']
        if years > 0:
            cagr = ((final_equity / initial_capital) ** (1/years) - 1) * 100
        
    # Approximation for Sharpe
    sharpe = round(cagr / (abs(max_dd) + 0.1) * 2, 2) if max_dd != 0 else 0

    return jsonify({
        "sharpeRatio": sharpe,
        "maxDrawdown": round(max_dd, 2),
        "winRate": round(win_rate, 1),
        "cagr": round(cagr, 1),
        "totalTrades": total_trades,
        "profitFactor": round(profit_factor, 2),
        "equityCurve": equity_curve,
        "trades": all_trades
    })
