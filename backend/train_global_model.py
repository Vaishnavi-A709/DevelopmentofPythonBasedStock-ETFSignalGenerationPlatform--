import os
import pickle
import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from services.data_fetcher import fetch_stock_data
from services.feature_engineering import create_features
from services.stock_universe import get_all_tickers

def create_labels(df):
    """
    Create a target label based on the next day's return:
    2 (BUY): return > 0.5%
    1 (HOLD): -0.5% <= return <= +0.5%
    0 (SELL): return < -0.5%
    """
    df_new = df.copy()
    
    # Next day return
    df_new['Next_Return'] = df_new['Close'].shift(-1).pct_change()
    
    conditions = [
        (df_new['Next_Return'] > 0.005),
        (df_new['Next_Return'] < -0.005)
    ]
    choices = [2, 0] # 2 is BUY, 0 is SELL, 1 is HOLD
    
    df_new['Target'] = np.select(conditions, choices, default=1)
    
    # Drop the trailing NaNs
    df_new.dropna(subset=['Target', 'Next_Return'], inplace=True)
    return df_new

def train_global_model():
    print("Fetching tickers...")
    tickers = get_all_tickers()
    print(f"Total tickers to process: {len(tickers)}")
    
    all_data = []
    
    print("Downloading and processing data. This may take a while...")
    for idx, ticker in enumerate(tickers):
        try:
            # We fetch 2y data to give it deep training history
            data = fetch_stock_data(ticker, period="2y")
            features = create_features(data)
            df_labeled = create_labels(features)
            
            if not df_labeled.empty:
                all_data.append(df_labeled)
                
            if (idx + 1) % 20 == 0:
                print(f"Processed {idx + 1}/{len(tickers)}")
        except Exception as e:
            # Some tickers might fail or be delisted
            pass
            
    if not all_data:
        raise ValueError("No data could be gathered for training.")
        
    master_df = pd.concat(all_data, ignore_index=True)
    
    # Clean infinities (Volume pct_change hitting 0 denominator causes inf)
    master_df.replace([np.inf, -np.inf], np.nan, inplace=True)
    master_df.dropna(inplace=True)
    
    print(f"Master dataset shape: {master_df.shape}")
    
    # Select features to use
    feature_cols = ['Return', 'MA20', 'MA50', 'Volatility', 'Volume_Change', 'RSI', 'MA_Cross']
    
    X = master_df[feature_cols]
    y = master_df['Target'].astype(int)
    
    print("Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print("Training Global XGBoost Model...")
    model = XGBClassifier(
        n_estimators=100, 
        max_depth=5, 
        learning_rate=0.1, 
        eval_metric='mlogloss',
        random_state=42
    )
    
    model.fit(X_scaled, y)
    
    # Save the models
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_path = os.path.join(base_dir, "models")
    os.makedirs(models_path, exist_ok=True)
    
    print("Saving global model and scaler...")
    with open(os.path.join(models_path, "global_model.pkl"), "wb") as f:
        pickle.dump(model, f)
        
    with open(os.path.join(models_path, "global_scaler.pkl"), "wb") as f:
        pickle.dump(scaler, f)
        
    with open(os.path.join(models_path, "global_features.pkl"), "wb") as f:
        pickle.dump(feature_cols, f)
        
    print("✅ Global model trained and saved successfully.")

if __name__ == "__main__":
    train_global_model()
