from flask import Blueprint, request, jsonify
from database import alerts_collection
from bson.objectid import ObjectId
from datetime import datetime

alerts_bp = Blueprint("alerts", __name__)

@alerts_bp.route("/<email>", methods=["GET"])
def get_alerts(email):
    try:
        alerts = []
        for alert in alerts_collection.find({"user_email": email}):
            alert["_id"] = str(alert["_id"])  # Convert ObjectId to string for JSON serialization
            alerts.append(alert)
            
        return jsonify({"status": "success", "alerts": alerts}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@alerts_bp.route("/", methods=["POST"])
def create_alert():
    try:
        data = request.json
        
        if not data.get("email") or not data.get("symbol") or not data.get("value"):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
            
        alert = {
            "user_email": data.get("email"),
            "symbol": data.get("symbol").upper(),
            "condition": data.get("condition"),
            "value": float(data.get("value")),
            "status": "active",
            "type": "price", 
            "createdAt": datetime.now().strftime("%Y-%m-%d %H:%M")
        }
        
        result = alerts_collection.insert_one(alert)
        alert["_id"] = str(result.inserted_id)
        
        return jsonify({"status": "success", "alert": alert}), 201
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@alerts_bp.route("/<alert_id>", methods=["DELETE"])
def delete_alert(alert_id):
    try:
        result = alerts_collection.delete_one({"_id": ObjectId(alert_id)})
        if result.deleted_count:
            return jsonify({"status": "success", "message": "Alert deleted"}), 200
        else:
            return jsonify({"status": "error", "message": "Alert not found"}), 404
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
