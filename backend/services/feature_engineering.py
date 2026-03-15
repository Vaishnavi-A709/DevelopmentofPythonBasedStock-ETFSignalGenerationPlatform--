import pandas as pd

def create_features(data):

    df = data.copy()

    # Return
    df["Return"] = df["Close"].pct_change()

    # Moving averages
    df["SMA_5"] = df["Close"].rolling(5).mean()
    df["SMA_20"] = df["Close"].rolling(20).mean()

    # EMA
    df["EMA_10"] = df["Close"].ewm(span=10, adjust=False).mean()

    # Volatility
    df["Volatility"] = df["Return"].rolling(20).std()

    # Momentum
    df["Momentum"] = df["Close"] - df["Close"].shift(10)

    # Lag features
    df["Lag_1"] = df["Close"].shift(1)
    df["Lag_2"] = df["Close"].shift(2)
    df["Lag_3"] = df["Close"].shift(3)
    df["Lag_4"] = df["Close"].shift(4)
    df["Lag_5"] = df["Close"].shift(5)

    df = df.dropna()

    return df