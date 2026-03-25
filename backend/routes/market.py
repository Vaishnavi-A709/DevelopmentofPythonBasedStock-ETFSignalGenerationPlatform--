from flask import Blueprint, jsonify
from services.stock_universe import get_core_indian_tickers
from concurrent.futures import ThreadPoolExecutor
import yfinance as yf
import traceback

market_bp = Blueprint('market_bp', __name__)

def fetch_single_stock_info(symbol):
    try:
        info = yf.Ticker(symbol).info
        
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        prev_close = info.get('previousClose', current_price)
        
        change_pct = 0
        if prev_close and current_price:
            change_pct = ((current_price - prev_close) / prev_close) * 100
            
        mc = info.get('marketCap', 0)
        if mc >= 1e12: mc_str = f"{mc/1e12:.2f}T"
        elif mc >= 1e9: mc_str = f"{mc/1e9:.2f}B"
        elif mc >= 1e6: mc_str = f"{mc/1e6:.2f}M"
        else: mc_str = str(mc)
        
        vol = info.get('volume', 0)
        if vol >= 1e6: vol_str = f"{vol/1e6:.1f}M"
        elif vol >= 1e3: vol_str = f"{vol/1e3:.1f}K"
        else: vol_str = str(vol)
        
        # Format the display symbol to not have .NS 
        display_symbol = symbol.replace('.NS', '').replace('.BO', '')
        
        return {
            "symbol": display_symbol,
            "name": info.get('shortName', display_symbol),
            "price": round(current_price, 2),
            "change": round(change_pct, 2),
            "volume": vol_str,
            "marketCap": mc_str,
            "pe": round(info.get('trailingPE', 0) if info.get('trailingPE') else 0, 1),
            "sector": info.get('sector', 'Unknown')
        }
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None

@market_bp.route("/overview", methods=["GET"])
def market_overview():
    try:
        core_tickers = get_core_indian_tickers()
        
        # Use ThreadPoolExecutor to fetch data in parallel (speed up Yahoo Finance)
        results = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            fetched_data = list(executor.map(fetch_single_stock_info, core_tickers))
            
        for data in fetched_data:
            if data is not None:
                results.append(data)
                
        # Sort by sector to make the list look organized
        results = sorted(results, key=lambda x: x['sector'])
                
        return jsonify({"data": results, "status": "success"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e), "status": "error"}), 500
