import yfinance as yf
import pandas as pd

def fetch_stock_data(ticker, period="6mo"):
    """
    Fetch historical stock data from Yahoo Finance.
    Returns pandas DataFrame.
    """

    try:
        ticker_obj = yf.Ticker(ticker)
        data = ticker_obj.history(period=period)

        # Smart fallback: If user entered an Indian stock without a suffix, try appending .NS then .BO
        if data.empty and '.' not in ticker:
            ns_ticker = f"{ticker}.NS"
            data = yf.Ticker(ns_ticker).history(period=period)
            if data.empty:
                bo_ticker = f"{ticker}.BO"
                data = yf.Ticker(bo_ticker).history(period=period)
            if not data.empty:
                # Update ticker to the working suffixed version for further fallbacks
                ticker = ns_ticker if not data.empty else bo_ticker

        if data.empty:
            # Fallback to the BSE (Bombay Stock Exchange) if NSE (.NS) fails due to Yahoo Finance glitches
            if ticker.endswith('.NS'):
                fallback_ticker = ticker.replace('.NS', '.BO')
                data = yf.Ticker(fallback_ticker).history(period=period)
                
            if data.empty:
                # Fallback 2: Certain stocks like ZOMATO randomly fail on history() but work on download()
                dl_data = yf.download(ticker, period=period, progress=False)
                if not dl_data.empty:
                    if isinstance(dl_data.columns, pd.MultiIndex):
                        dl_data.columns = dl_data.columns.get_level_values(0)
                    if hasattr(dl_data.columns, 'name'):
                        dl_data.columns.name = None
                    data = dl_data
                else:
                    raise ValueError(f"No data found for {ticker} or its fallbacks on Yahoo.")


        # Remove column index name if it exists
        if hasattr(data.columns, 'name'):
            data.columns.name = None

        required_columns = ["Open", "High", "Low", "Close", "Volume"]
        for col in required_columns:
            if col not in data.columns:
                raise ValueError(f"Missing required column: {col}. Found columns: {list(data.columns)}")

        return data

    except Exception as e:
        raise RuntimeError(f"Error fetching data for {ticker}: {e}")
