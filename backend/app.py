from flask import Flask, jsonify, request
from flask_cors import CORS
from services.model_loader import load_models
from services.predictor import predict_signal
from services.stock_universe import get_all_tickers
from datetime import datetime

app = Flask(__name__)
CORS(app)

from routes.auth import auth_bp
from routes.alerts import alerts_bp
from routes.backtest import backtest_bp
from routes.portfolio import portfolio_bp
from routes.dashboard import dashboard_bp
from routes.market import market_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
app.register_blueprint(backtest_bp, url_prefix='/api/backtest')
app.register_blueprint(portfolio_bp, url_prefix='/api/portfolio')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(market_bp, url_prefix='/api/market')

# ---------------------------------
# Load Models at Startup
# ---------------------------------
print("Loading models...")
models_dict = load_models()
print("All models loaded successfully.")


# ---------------------------------
# Root Route
# ---------------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Stock & ETF Signal Generation API is running",
        "status": "success",
        "available_endpoints": {
            "list_stocks": "/stocks",
            "predict_signal": "/predict/<ticker>"
        }
    })


# ---------------------------------
# Route 1: List Available Stocks
# ---------------------------------
@app.route("/stocks", methods=["GET"])
def get_stocks():
    return jsonify({
        "available_stocks": get_all_tickers()
    })


# ---------------------------------
# Route 2: Predict Signal
# ---------------------------------
@app.route("/predict/<ticker>", methods=["GET"])
def predict(ticker):
    try:
        email = request.args.get('email')
        result = predict_signal(ticker, models_dict)

        result["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if email:
            from database import users_collection
            import uuid
            
            search_entry = {
                "id": str(uuid.uuid4()),
                "symbol": result.get("symbol", ticker),
                "name": ticker,
                "price": result.get("latest_price", 0),
                "changePercent": 0,
                "signal": result.get("signal", "HOLD"),
                "confidence": result.get("confidence", 0.5) * 100, 
                "timestamp": result["timestamp"]
            }
            
            users_collection.update_one(
                {"email": email},
                {"$push": {
                    "recent_searches": {
                        "$each": [search_entry],
                        "$slice": -10
                    }
                }}
            )

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


# ---------------------------------
# Run Server
# ---------------------------------
if __name__ == "__main__":
    app.run(debug=True)
