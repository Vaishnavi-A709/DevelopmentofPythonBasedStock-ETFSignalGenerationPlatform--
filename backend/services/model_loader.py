import os
import pickle

def load_models():
    """
    Loads all models from backend/ML_Model/models directory.
    """

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_path = os.path.join(base_dir, "ML_Model", "models")

    models_dict = {}

    if not os.path.exists(models_path):
        raise FileNotFoundError(f"Models folder not found at: {models_path}")

    for filename in os.listdir(models_path):

        if filename.endswith("_model.pkl"):

            ticker = filename.replace("_model.pkl", "")

            try:

                with open(os.path.join(models_path, f"{ticker}_model.pkl"), "rb") as f:
                    model = pickle.load(f)

                with open(os.path.join(models_path, f"{ticker}_scaler.pkl"), "rb") as f:
                    scaler = pickle.load(f)

                with open(os.path.join(models_path, f"{ticker}_features.pkl"), "rb") as f:
                    features = pickle.load(f)

                models_dict[ticker] = {
                    "model": model,
                    "scaler": scaler,
                    "features": features
                }

                print(f"Loaded model for {ticker}")

            except Exception as e:
                print(f"Failed to load {ticker}: {e}")

    return models_dict