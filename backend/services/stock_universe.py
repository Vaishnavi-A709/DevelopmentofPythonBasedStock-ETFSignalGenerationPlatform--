import pandas as pd
import requests

def fetch_nifty500_tickers():
    """
    Fetches the list of Nifty 500 companies from Wikipedia and appends '.NS'
    for Yahoo Finance compatibility.
    Falls back to a smaller core list if the network request fails.
    """
    try:
        # Wikipedia table for NIFTY 500
        url = 'https://en.wikipedia.org/wiki/NIFTY_500'
        # Add headers to bypass simple 403
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers)
        tables = pd.read_html(r.text)

        # Usually the 3rd table (index 2) contains the constituents
        df = tables[2]

        if 'Symbol' in df.columns:
            tickers = df['Symbol'].astype(str) + '.NS'
            return tickers.tolist()

    except Exception as e:
        print(f"Failed to fetch Nifty 500 from Wikipedia: {e}")

    # Fallback to a core list of Indian stocks (Nifty 50 + popular requested names)
    return get_core_indian_tickers()

def get_core_indian_tickers():
    """
    Returns a static list of highly liquid Indian stocks, including the ones
    requested by the user (Tata, Reliance, Jio Financial, etc.).
    """
    return [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "BHARTIARTL.NS",
        "INFY.NS", "ITC.NS", "SBIN.NS", "LT.NS", "BAJFINANCE.NS",
        "KOTAKBANK.NS", "AXISBANK.NS", "TATAMOTORS.NS", "TATASTEEL.NS", "JIOFIN.NS",
        "WIPRO.NS", "ASIANPAINT.NS", "HCLTECH.NS", "MARUTI.NS", "SUNPHARMA.NS"
    ]

# If we need the master stock list for the app
def get_all_tickers():
    # Attempt to use the massive Nifty 500 list
    tickers = fetch_nifty500_tickers()

    # Ensure JIOFIN and specific core ones are in the list if missing from wiki
    core = get_core_indian_tickers()
    for t in core:
        if t not in tickers:
            tickers.append(t)

    unique_tickers = list(set(tickers))
    
    # Remove problematic tickers that fail Yahoo Finance locally
    bad_tickers = ["ZOMATO.NS", "TATAMOTORS.NS"]
    for bt in bad_tickers:
        if bt in unique_tickers:
            unique_tickers.remove(bt)
            
    return unique_tickers
