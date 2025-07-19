#!/usr/bin/env python3
"""
Startup script for the Flask emotion analysis service.
This script can be used for both local development and deployment.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'flask', 'flask_cors', 'numpy', 'pandas', 'joblib', 
        'tensorflow', 'librosa', 'scikit-learn'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing required packages: {missing_packages}")
        print("Please install them using: pip install -r requirements.txt")
        return False
    
    print("✅ All required packages are installed")
    return True

def check_model_files():
    """Check if required model files exist"""
    script_dir = Path(__file__).parent
    model_dir = script_dir / "audio_feature_extracted"
    
    required_files = [
        model_dir / "scaler.pkl",
        model_dir / "encoder.pkl", 
        model_dir / "model.h5"
    ]
    
    missing_files = [f for f in required_files if not f.exists()]
    
    if missing_files:
        print(f"❌ Missing model files: {missing_files}")
        print("Please ensure the model files are in the audio_feature_extracted directory")
        return False
    
    print("✅ All model files are present")
    return True

def start_flask_app():
    """Start the Flask application"""
    # Set environment variables
    os.environ.setdefault('FLASK_ENV', 'development')
    os.environ.setdefault('PORT', '5000')
    
    # Get the directory of this script
    script_dir = Path(__file__).parent
    
    # Change to the script directory
    os.chdir(script_dir)
    
    print("🚀 Starting Flask emotion analysis service...")
    print(f"📁 Working directory: {os.getcwd()}")
    print(f"🔧 Environment: {os.environ.get('FLASK_ENV', 'development')}")
    print(f"🌐 Port: {os.environ.get('PORT', '5000')}")
    
    # Import and run the Flask app
    try:
        from flaskapp import app
        port = int(os.environ.get('PORT', 5000))
        app.run(host='0.0.0.0', port=port, debug=True)
    except Exception as e:
        print(f"❌ Error starting Flask app: {e}")
        sys.exit(1)

def main():
    """Main function"""
    print("🔍 Checking Flask app dependencies...")
    
    if not check_dependencies():
        sys.exit(1)
    
    if not check_model_files():
        sys.exit(1)
    
    print("✅ All checks passed!")
    start_flask_app()

if __name__ == "__main__":
    main() 