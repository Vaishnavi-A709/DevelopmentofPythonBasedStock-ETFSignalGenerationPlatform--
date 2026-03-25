from flask import Blueprint, request, jsonify
from database import users_collection

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('', methods=['GET'])
def get_dashboard():
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Email required"}), 400
        
    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    recent_searches = user.get("recent_searches", [])
    
    total_signals = len(recent_searches)
    active_buy = sum(1 for s in recent_searches if s.get("signal") == "BUY")
    active_sell = sum(1 for s in recent_searches if s.get("signal") == "SELL")
    active_hold = sum(1 for s in recent_searches if s.get("signal") == "HOLD")

    signal_distribution = [
        {"name": "BUY", "value": round((active_buy / max(1, total_signals)) * 100), "fill": "#10b981"},
        {"name": "SELL", "value": round((active_sell / max(1, total_signals)) * 100), "fill": "#ef4444"},
        {"name": "HOLD", "value": round((active_hold / max(1, total_signals)) * 100), "fill": "#f59e0b"}
    ]
    
    return jsonify({
        "totalSignals": total_signals,
        "activeBuy": active_buy,
        "activeSell": active_sell,
        "recentSignals": list(reversed(recent_searches)),
        "signalDistribution": signal_distribution
    })
