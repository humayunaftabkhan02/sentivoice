#!/usr/bin/env python3
"""
Simple test script to verify model files and basic functionality.
This helps identify if the issue is with the model files or audio processing.
"""

import os
import numpy as np
import joblib
import pandas as pd
from tensorflow.keras.models import load_model
from pathlib import Path

def test_model_with_dummy_data():
    """Test the model with dummy feature data"""
    print("🧪 Testing model with dummy data...")
    
    try:
        script_dir = Path(__file__).parent
        output_dir = script_dir / "audio_feature_extracted"
        
        # Check if files exist
        scaler_path = output_dir / 'scaler.pkl'
        encoder_path = output_dir / 'encoder.pkl'
        model_path = output_dir / 'model.h5'
        
        if not all([scaler_path.exists(), encoder_path.exists(), model_path.exists()]):
            print("❌ Model files missing!")
            return False
        
        # Load model components
        print("Loading model components...")
        scaler = joblib.load(scaler_path)
        encoder = joblib.load(encoder_path)
        model = load_model(model_path, compile=False)
        
        print(f"✅ Model components loaded")
        print(f"   Scaler type: {type(scaler)}")
        print(f"   Encoder type: {type(encoder)}")
        print(f"   Model type: {type(model)}")
        
        # Check expected features
        expected_features = scaler.n_features_in_ if hasattr(scaler, 'n_features_in_') else 'Unknown'
        print(f"   Expected features: {expected_features}")
        
        # Create dummy features (random data)
        if expected_features != 'Unknown':
            dummy_features = np.random.randn(expected_features)
        else:
            # Try common feature lengths
            for feature_length in [193, 180, 200, 150]:
                try:
                    dummy_features = np.random.randn(feature_length)
                    features_df = pd.DataFrame([dummy_features], columns=[f'feature_{i}' for i in range(feature_length)])
                    scaler.transform(features_df)
                    print(f"   Using feature length: {feature_length}")
                    break
                except:
                    continue
            else:
                print("❌ Could not determine correct feature length")
                return False
        
        print(f"   Created dummy features: {len(dummy_features)}")
        print(f"   Feature range: {np.min(dummy_features):.4f} to {np.max(dummy_features):.4f}")
        
        # Scale features
        features_df = pd.DataFrame([dummy_features], columns=[f'feature_{i}' for i in range(len(dummy_features))])
        features_scaled = scaler.transform(features_df)
        print(f"   Scaled features range: {np.min(features_scaled):.4f} to {np.max(features_scaled):.4f}")
        
        # Reshape for model
        features_reshaped = np.expand_dims(features_scaled, axis=2)
        print(f"   Reshaped features shape: {features_reshaped.shape}")
        
        # Make prediction
        prediction_probs = model.predict(features_reshaped, verbose=0)
        print(f"   Raw prediction probabilities: {prediction_probs}")
        
        # Decode prediction
        predicted_emotion = encoder.inverse_transform(prediction_probs)
        result = predicted_emotion.flatten()[0]
        
        print(f"   Predicted emotion: {result}")
        print(f"   Confidence: {np.max(prediction_probs):.4f}")
        print(f"   All probabilities: {prediction_probs.flatten()}")
        
        # Check if encoder has expected classes
        if hasattr(encoder, 'classes_'):
            print(f"   Available emotions: {encoder.classes_}")
        
        return True
        
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_model_file_sizes():
    """Check the sizes of model files"""
    print("\n📁 Checking model file sizes...")
    
    script_dir = Path(__file__).parent
    output_dir = script_dir / "audio_feature_extracted"
    
    files = ['scaler.pkl', 'encoder.pkl', 'model.h5']
    
    for file_name in files:
        file_path = output_dir / file_name
        if file_path.exists():
            size = file_path.stat().st_size
            print(f"   {file_name}: {size:,} bytes")
            
            if size < 1000:
                print(f"   ⚠️  Warning: {file_name} is very small!")
        else:
            print(f"   ❌ {file_name}: Missing")

def main():
    """Main test function"""
    print("🔧 Simple Model Test")
    print("=" * 40)
    
    # Check file sizes
    check_model_file_sizes()
    
    # Test model with dummy data
    success = test_model_with_dummy_data()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ Model test passed!")
        print("💡 The issue might be with audio processing or feature extraction")
    else:
        print("❌ Model test failed!")
        print("💡 Check model files and their compatibility")
    
    print("\n🏁 Test completed!")

if __name__ == "__main__":
    main() 