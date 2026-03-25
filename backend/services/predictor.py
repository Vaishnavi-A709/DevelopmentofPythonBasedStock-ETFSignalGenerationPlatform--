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
    
    # Convert price to INR if it is in another currency like USD
    try:
        import yfinance as yf
        info = yf.Ticker(ticker).info
        currency = info.get('currency', 'USD')
        
        if currency and currency != 'INR':
            rate_ticker = f"{currency}INR=X"
            rate_data = yf.Ticker(rate_ticker).history(period="1d")
            if not rate_data.empty:
                exchange_rate = rate_data['Close'].iloc[-1]
                current_price = current_price * exchange_rate
            else:
                current_price = current_price * 83.5 # Fallback static rate
    except Exception as e:
        print(f"Currency conversion failed: {e}")
        # Simple heuristic fallback
        if current_price < 1000 and '.' not in ticker: 
            current_price = current_price * 83.5

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
