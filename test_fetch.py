import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from services.data_fetcher import fetch_stock_data

def test():
    print("Testing INFY...")
    df = fetch_stock_data("INFY")
    print("INFY shape:", df.shape)

    print("Testing RELIANCE (no suffix)...")
    df2 = fetch_stock_data("RELIANCE")
    print("RELIANCE shape:", df2.shape)

if __name__ == "__main__":
    test()
