import os
import pickle

def load_models():
    """
    Loads the unified global model from backend/models directory.
    """

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_path = os.path.join(base_dir, "models")

    if not os.path.exists(models_path):
        raise FileNotFoundError(f"Models folder not found at: {models_path}")

    try:
        with open(os.path.join(models_path, "global_model.pkl"), "rb") as f:
            model = pickle.load(f)

        with open(os.path.join(models_path, "global_scaler.pkl"), "rb") as f:
            scaler = pickle.load(f)

        with open(os.path.join(models_path, "global_features.pkl"), "rb") as f:
            features = pickle.load(f)

        print("Successfully loaded global XGBoost model.")
        return {
            "global": {
                "model": model,
                "scaler": scaler,
                "features": features
            }
        }
    except FileNotFoundError:
        print("Warning: Global model not found. Run train_global_model.py first.")
        return {}
    except Exception as e:
        print(f"Failed to load global model: {e}")
        return {}
