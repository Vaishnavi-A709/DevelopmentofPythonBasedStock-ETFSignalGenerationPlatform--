import yfinance as yf
import pandas as pd

def fetch_stock_data(ticker, period="6mo"):

    try:
        ticker_symbol = ticker + ".NS"

        data = yf.download(ticker_symbol, period=period, progress=False)

        if data.empty:
            raise ValueError(f"No data found for {ticker_symbol}")

        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)

        data.columns.name = None

        required_columns = ["Open", "High", "Low", "Close", "Volume"]

        for col in required_columns:
            if col not in data.columns:
                raise ValueError(f"Missing required column: {col}")

        return data

    except Exception as e:
        raise RuntimeError(f"Error fetching data for {ticker}: {e}")