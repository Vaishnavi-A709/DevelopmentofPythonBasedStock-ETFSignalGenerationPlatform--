import yfinance as yf
from flask import Blueprint, request, jsonify
from database import users_collection
import uuid
import numpy as np
from datetime import datetime, timedelta

portfolio_bp = Blueprint('portfolio', __name__)

@portfolio_bp.route('', methods=['GET'])
def get_portfolio():
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Email required"}), 400
        
    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    holdings = user.get("portfolio", [])
    
    total_invested = 0
    total_value = 0
    daily_pnl = 0
    sector_allocations = {}
    
    processed_holdings = []
    
    for h in holdings:
        sym = h['symbol']
        shares = float(h['shares'])
        avg_price = float(h['avgPrice'])
        
        try:
            ticker = yf.Ticker(sym)
            history = ticker.history(period="5d")
            
            if len(history) >= 2:
                current_price = history['Close'].iloc[-1]
                prev_close = history['Close'].iloc[-2]
            elif len(history) == 1:
                current_price = history['Close'].iloc[-1]
                prev_close = current_price
            else:
                current_price = avg_price
                prev_close = avg_price
                
            invested = shares * avg_price
            current_val = shares * current_price
            
            total_invested += invested
            total_value += current_val
            
            day_change = (current_price - prev_close) * shares
            daily_pnl += day_change
            
            sector = ticker.info.get('sector', 'Other') if hasattr(ticker, 'info') and 'sector' in ticker.info else 'Other'
            sector_allocations[sector] = sector_allocations.get(sector, 0) + current_val
            
            processed_holdings.append({
                "id": h.get('id', str(len(processed_holdings))),
                "symbol": sym,
                "shares": shares,
                "avgPrice": avg_price,
                "currentPrice": current_price,
                "totalValue": current_val,
                "pnl": current_val - invested,
                "pnlPercent": ((current_price - avg_price) / avg_price * 100) if avg_price > 0 else 0
            })
        except Exception as e:
            print(f"Error fetching portfolio symbol {sym}: {e}")
            
    total_return_val = total_value - total_invested
    total_return_pct = (total_return_val / total_invested * 100) if total_invested > 0 else 0
    
    colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"]
    chart_data = []
    
    if total_value > 0:
        idx = 0
        for sec, val in sector_allocations.items():
            chart_data.append({
                "name": sec,
                "value": round((val / total_value) * 100, 1),
                "fill": colors[idx % len(colors)]
            })
            idx += 1
            
    # Generate simulated equity curve ending at today's value
    fake_curve = []
    if total_invested > 0:
        steps = 30
        end_pct = total_return_pct
        step_val = end_pct / steps if steps > 0 else 0
        current_dt = datetime.now() - timedelta(days=30)
        
        for i in range(steps + 1):
            val = total_invested * (1 + (step_val * i)/100)
            noise = np.random.normal(0, total_invested * 0.005) if i < steps else 0
            fake_curve.append({
                "date": (current_dt + timedelta(days=i)).strftime('%Y-%m-%d'),
                "value": round(val + noise, 2)
            })
            
    return jsonify({
        "totalValue": round(total_value, 2),
        "totalInvested": round(total_invested, 2),
        "dailyPnl": round(daily_pnl, 2),
        "totalReturn": round(total_return_val, 2),
        "totalReturnPercent": round(total_return_pct, 2),
        "positions": len(holdings),
        "holdings": processed_holdings,
        "sectorAllocation": chart_data,
        "equityCurve": fake_curve
    })

@portfolio_bp.route('/add', methods=['POST'])
def add_position():
    data = request.json
    email = data.get('email')
    symbol = data.get('symbol', '').upper()
    
    if '.' not in symbol:
        symbol += '.NS' # Force Indian stock suffix by default if omitted
        
    shares = float(data.get('shares', 0))
    avg_price = float(data.get('avgPrice', 0))
    
    new_holding = {
        "id": str(uuid.uuid4()),
        "symbol": symbol,
        "shares": shares,
        "avgPrice": avg_price
    }
    
    result = users_collection.update_one(
        {"email": email},
        {"$push": {"portfolio": new_holding}}
    )
    
    if result.modified_count > 0:
        return jsonify({"message": "Position added successfully!", "holding": new_holding}), 200
    else:
        return jsonify({"error": "User not found or database error"}), 400
