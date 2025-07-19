#!/usr/bin/env python3
"""
Test script for Flask emotion analysis service.
This script tests the Flask app endpoints to ensure they're working correctly.
"""

import requests
import json
import time
import os

def test_health_endpoint(base_url):
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"✅ Health check: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: {data.get('status')}")
            print(f"   Service: {data.get('service')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_predict_endpoint(base_url):
    """Test the predict endpoint with a simple request"""
    try:
        # Test with a simple request to see if the endpoint responds
        test_data = {
            "audio_data": "dGVzdA=="  # base64 encoded "test"
        }
        
        response = requests.post(
            f"{base_url}/api/predict",
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"✅ Predict endpoint: {response.status_code}")
        if response.status_code in [400, 500]:
            # This is expected since we sent invalid audio data
            data = response.json()
            print(f"   Expected error: {data.get('message', 'Unknown error')}")
            return True
        else:
            print(f"   Unexpected response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Predict endpoint failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing Flask Emotion Analysis Service")
    print("=" * 50)
    
    # Test localhost first
    localhost_url = "http://localhost:5000"
    print(f"\n📍 Testing localhost: {localhost_url}")
    
    # Test if Flask app is running
    if test_health_endpoint(localhost_url):
        print("✅ Flask app is running on localhost")
        test_predict_endpoint(localhost_url)
    else:
        print("❌ Flask app is not running on localhost")
        print("\n💡 To start the Flask app:")
        print("   cd sentiVoice (BE)/utils")
        print("   python flaskapp.py")
    
    # Test deployment URL if available
    deployment_url = "https://sentivoice-flask-273777154059.us-central1.run.app"
    print(f"\n📍 Testing deployment: {deployment_url}")
    
    if test_health_endpoint(deployment_url):
        print("✅ Flask app is running on deployment")
        test_predict_endpoint(deployment_url)
    else:
        print("❌ Flask app is not accessible on deployment")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

if __name__ == "__main__":
    main() 