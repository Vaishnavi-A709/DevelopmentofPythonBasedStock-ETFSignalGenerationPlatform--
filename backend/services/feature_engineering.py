import numpy as np
import pandas as pd


def create_features(data):
    """
    Create technical indicators exactly as used during training.
    Returns processed DataFrame.
    """

    df = data.copy()

    # 1. Daily Return
    df['Return'] = df['Close'].pct_change()

    # 2. Moving Averages
    df['MA20'] = df['Close'].rolling(20).mean()
    df['MA50'] = df['Close'].rolling(50).mean()

    # 3. Volatility (20-day rolling std of returns)
    df['Volatility'] = df['Return'].rolling(20).std()

    # 4. Volume Change
    df['Volume_Change'] = df['Volume'].pct_change()

    # 5. RSI (14-day)
    delta = df['Close'].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()

    rs = avg_gain / avg_loss
    df['RSI'] = 100 - (100 / (1 + rs))

    # 6. Moving Average Crossover
    df['MA_Cross'] = (df['MA20'] > df['MA50']).astype(int)

    # Drop NaN values
    df = df.dropna()

    return df
