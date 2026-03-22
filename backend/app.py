from flask import Flask, jsonify
from flask_cors import CORS
from services.model_loader import load_models
from services.predictor import predict_signal
from services.stock_universe import get_all_tickers
from datetime import datetime

app = Flask(__name__)
CORS(app)

from routes.auth import auth_bp
from routes.alerts import alerts_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(alerts_bp, url_prefix='/api/alerts')

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
        result = predict_signal(ticker, models_dict)

        result["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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
