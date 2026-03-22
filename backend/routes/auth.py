from flask import Blueprint, request, jsonify
from database import users_collection
import bcrypt
import jwt
import datetime
import os

auth_bp = Blueprint("auth", __name__)
JWT_SECRET = os.getenv("JWT_SECRET", "signal-ai-super-secret-key-123")

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password are required"}), 400
            
        user = users_collection.find_one({"email": email})
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user["password_hash"]):
            token = jwt.encode({
                "email": email, 
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
            }, JWT_SECRET, algorithm="HS256")
            
            return jsonify({
                "status": "success", 
                "token": token, 
                "email": email,
                "name": user.get("name", "User"),
                "message": "Login successful"
            }), 200
        
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password are required"}), 400
            
        if users_collection.find_one({"email": email}):
            return jsonify({"status": "error", "message": "User with this email already exists"}), 400
            
        name = data.get("name", "User")
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        users_collection.insert_one({
            "name": name,
            "email": email,
            "password_hash": hashed,
            "created_at": datetime.datetime.utcnow()
        })
        
        return jsonify({"status": "success", "message": "Account created successfully!"}), 201
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
