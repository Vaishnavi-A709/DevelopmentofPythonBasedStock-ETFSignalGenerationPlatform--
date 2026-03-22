import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("WARNING: MONGO_URI not set in environment variables.")
    # Fallback to localhost if no cloud DB specified for whatever reason
    MONGO_URI = "mongodb://localhost:27017/"

# Create client
client = MongoClient(MONGO_URI)

# Get the default database or create 'signal_platform' if none is defined in the URI
db = client.get_database("signal_platform")

# Collections
users_collection = db["users"]
alerts_collection = db["alerts"]
