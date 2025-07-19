#!/usr/bin/env python3
"""
Test script to verify audio processing and feature extraction.
This helps identify if the issue is with audio loading or feature extraction.
"""

import os
import numpy as np
import tempfile
import soundfile as sf
from pathlib import Path

def create_test_audio():
    """Create a test audio file with speech-like characteristics"""
    print("🎵 Creating test audio file...")
    
    # Generate a more realistic speech-like signal
    sample_rate = 22050
    duration = 3.0  # 3 seconds
    
    # Create time array
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Create a speech-like signal with multiple frequencies
    # This simulates human speech with fundamental frequency and harmonics
    fundamental_freq = 150  # Hz (typical male voice)
    signal = (
        0.1 * np.sin(2 * np.pi * fundamental_freq * t) +  # Fundamental
        0.05 * np.sin(2 * np.pi * fundamental_freq * 2 * t) +  # 2nd harmonic
        0.025 * np.sin(2 * np.pi * fundamental_freq * 3 * t) +  # 3rd harmonic
        0.01 * np.random.randn(len(t))  # Add some noise
    )
    
    # Apply some amplitude modulation to simulate speech
    modulation = 0.5 + 0.5 * np.sin(2 * np.pi * 4 * t)  # 4 Hz modulation
    signal = signal * modulation
    
    # Normalize
    signal = signal / np.max(np.abs(signal)) * 0.8
    
    return signal, sample_rate

def test_audio_processing():
    """Test audio processing with a realistic speech signal"""
    print("🔍 Testing audio processing...")
    
    try:
        import librosa
        from app import extract_feature
        
        # Create test audio
        signal, sample_rate = create_test_audio()
        
        # Save as temporary WAV file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            sf.write(temp_file.name, signal, sample_rate)
            temp_path = temp_file.name
        
        print(f"Created test audio file: {temp_path}")
        print(f"Audio duration: {len(signal)/sample_rate:.2f}s")
        print(f"Sample rate: {sample_rate}Hz")
        print(f"Audio range: {np.min(signal):.4f} to {np.max(signal):.4f}")
        
        # Test librosa loading
        print("\nTesting librosa.load...")
        loaded_signal, sr = librosa.load(temp_path, sr=None)
        print(f"✅ librosa.load successful")
        print(f"   Loaded duration: {len(loaded_signal)/sr:.2f}s")
        print(f"   Loaded sample rate: {sr}Hz")
        print(f"   Loaded range: {np.min(loaded_signal):.4f} to {np.max(loaded_signal):.4f}")
        
        # Test feature extraction
        print("\nTesting feature extraction...")
        features = extract_feature(
            temp_path,
            mfcc=True,
            chroma=True,
            mel=True,
            contrast=True,
            tonnetz=True
        )
        
        print(f"✅ Feature extraction successful!")
        print(f"   Feature vector length: {len(features)}")
        print(f"   Feature range: {np.min(features):.4f} to {np.max(features):.4f}")
        print(f"   Non-zero features: {np.count_nonzero(features)}")
        
        # Show some sample features
        print(f"\nSample feature values:")
        print(f"   MFCC[0]: {features[0]:.4f}")
        print(f"   MFCC[39]: {features[39]:.4f}")
        print(f"   Chroma[40]: {features[40]:.4f}")
        print(f"   Mel[52]: {features[52]:.4f}")
        print(f"   Contrast[53]: {features[53]:.4f}")
        print(f"   Tonnetz[59]: {features[59]:.4f}")
        
        # Clean up with error handling for Windows
        try:
            os.unlink(temp_path)
        except PermissionError:
            print("⚠️  Could not delete temporary file (Windows permission issue)")
        except Exception as e:
            print(f"⚠️  Could not delete temporary file: {e}")
        
        return True, features
        
    except Exception as e:
        print(f"❌ Audio processing test failed: {e}")
        import traceback
        traceback.print_exc()
        return False, None

def test_model_with_real_features(features):
    """Test the model with real extracted features"""
    print("\n🧪 Testing model with real features...")
    
    try:
        import joblib
        import pandas as pd
        from tensorflow.keras.models import load_model
        from pathlib import Path
        
        script_dir = Path(__file__).parent
        output_dir = script_dir / "audio_feature_extracted"
        
        # Load model components
        scaler = joblib.load(output_dir / 'scaler.pkl')
        encoder = joblib.load(output_dir / 'encoder.pkl')
        model = load_model(output_dir / 'model.h5', compile=False)
        
        # Prepare features
        features_df = pd.DataFrame([features], columns=[f'feature_{i}' for i in range(len(features))])
        
        # Scale features
        features_scaled = scaler.transform(features_df)
        print(f"   Scaled features range: {np.min(features_scaled):.4f} to {np.max(features_scaled):.4f}")
        
        # Reshape for model
        features_reshaped = np.expand_dims(features_scaled, axis=2)
        
        # Make prediction
        prediction_probs = model.predict(features_reshaped, verbose=0)
        
        # Decode prediction
        predicted_emotion = encoder.inverse_transform(prediction_probs)
        result = predicted_emotion.flatten()[0]
        
        print(f"   Predicted emotion: {result}")
        print(f"   Confidence: {np.max(prediction_probs):.4f}")
        print(f"   All probabilities: {prediction_probs.flatten()}")
        
        return True, result, prediction_probs
        
    except Exception as e:
        print(f"❌ Model prediction failed: {e}")
        import traceback
        traceback.print_exc()
        return False, None, None

def main():
    """Main test function"""
    print("🔧 Audio Processing Test")
    print("=" * 40)
    
    # Test audio processing
    audio_ok, features = test_audio_processing()
    
    if audio_ok and features is not None:
        # Test model with real features
        model_ok, emotion, probs = test_model_with_real_features(features)
        
        print("\n" + "=" * 40)
        print("📊 TEST RESULTS")
        print("=" * 40)
        print(f"Audio processing: {'✅ OK' if audio_ok else '❌ FAILED'}")
        print(f"Model prediction: {'✅ OK' if model_ok else '❌ FAILED'}")
        
        if model_ok:
            print(f"Predicted emotion: {emotion}")
            print(f"Confidence: {np.max(probs):.4f}")
            
            # Check if this is different from the "Sad" issue
            if emotion != "Sad":
                print("✅ Good! Model is predicting different emotions")
            else:
                print("⚠️  Still predicting 'Sad' - need to investigate further")
    else:
        print("\n❌ Audio processing failed - cannot test model")
    
    print("\n🏁 Test completed!")

if __name__ == "__main__":
    main() 