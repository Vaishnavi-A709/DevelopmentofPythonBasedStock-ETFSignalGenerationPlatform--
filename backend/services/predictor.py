from services.data_fetcher import fetch_stock_data
from services.feature_engineering import create_features


def predict_signal(ticker, models_dict):
    """
    Generate prediction for a given ticker using the generic global model.
    """

    if "global" not in models_dict:
        raise ValueError("Global model not loaded. Please run train_global_model.py first.")

    model = models_dict["global"]["model"]
    scaler = models_dict["global"]["scaler"]
    feature_list = models_dict["global"]["features"]

    # 1. Fetch latest data
    data = fetch_stock_data(ticker)

    # Grab the current market price before feature engineering removes rows/columns
    current_price = data['Close'].iloc[-1]

    # 2. Create features
    df = create_features(data)

    if df.empty:
        raise ValueError("Not enough data after feature engineering")

    # 3. Select required features
    X = df[feature_list]

    # 4. Take latest row only
    latest_row = X.iloc[[-1]]

    # 5. Scale
    latest_scaled = scaler.transform(latest_row)

    # 6. Predict
    prediction = model.predict(latest_scaled)[0]
    probabilities = model.predict_proba(latest_scaled)[0]

    # Get confidence of predicted class
    confidence = max(probabilities)

    # 7. Convert signal to text
    # 2: BUY, 1: HOLD, 0: SELL (from our XGBoost training script)
    signal_map = {
        2: "BUY",
        1: "HOLD",
        0: "SELL"
    }

    result = {
        "symbol": ticker,
        "signal": signal_map.get(prediction, "UNKNOWN"),
        "confidence": round(float(confidence), 2),
        "latest_price": round(float(current_price), 2)
    }

    return result
