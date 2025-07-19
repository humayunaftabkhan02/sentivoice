#!/usr/bin/env python3
"""
Quick test to verify the model works with proper audio.
This will help identify why you're getting "Sad" predictions.
"""

import os
import numpy as np
import tempfile
import soundfile as sf
from pathlib import Path

def create_good_test_audio():
    """Create a high-quality test audio file"""
    print("🎵 Creating high-quality test audio...")
    
    sample_rate = 22050
    duration = 5.0  # 5 seconds - longer than minimum
    
    # Create time array
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Create a rich speech-like signal
    fundamental_freq = 120  # Hz (typical voice)
    
    # Complex signal with multiple harmonics and modulation
    signal = (
        0.15 * np.sin(2 * np.pi * fundamental_freq * t) +  # Fundamental
        0.08 * np.sin(2 * np.pi * fundamental_freq * 2 * t) +  # 2nd harmonic
        0.04 * np.sin(2 * np.pi * fundamental_freq * 3 * t) +  # 3rd harmonic
        0.02 * np.sin(2 * np.pi * fundamental_freq * 4 * t) +  # 4th harmonic
        0.005 * np.random.randn(len(t))  # Small amount of noise
    )
    
    # Add amplitude modulation to simulate speech patterns
    modulation = 0.6 + 0.4 * np.sin(2 * np.pi * 3 * t)  # 3 Hz modulation
    signal = signal * modulation
    
    # Add some frequency variation to simulate natural speech
    freq_variation = fundamental_freq + 20 * np.sin(2 * np.pi * 0.5 * t)
    signal = signal * np.sin(2 * np.pi * freq_variation * t)
    
    # Normalize to good volume
    signal = signal / np.max(np.abs(signal)) * 0.9
    
    return signal, sample_rate

def test_with_good_audio():
    """Test the model with high-quality audio"""
    print("🧪 Testing with high-quality audio...")
    
    try:
        from app import extract_feature
        import joblib
        import pandas as pd
        from tensorflow.keras.models import load_model
        
        # Create good test audio
        signal, sample_rate = create_good_test_audio()
        
        # Save as temporary WAV file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            sf.write(temp_file.name, signal, sample_rate)
            temp_path = temp_file.name
        
        print(f"✅ Created test audio: {temp_path}")
        print(f"   Duration: {len(signal)/sample_rate:.2f}s")
        print(f"   Sample rate: {sample_rate}Hz")
        print(f"   Volume range: {np.min(signal):.4f} to {np.max(signal):.4f}")
        
        # Extract features
        print("\n🔍 Extracting features...")
        features = extract_feature(
            temp_path,
            mfcc=True,
            chroma=True,
            mel=True,
            contrast=True,
            tonnetz=True
        )
        
        print(f"✅ Features extracted!")
        print(f"   Feature length: {len(features)}")
        print(f"   Feature range: {np.min(features):.4f} to {np.max(features):.4f}")
        print(f"   Non-zero features: {np.count_nonzero(features)}")
        
        # Test model prediction
        print("\n🧠 Testing model prediction...")
        script_dir = Path(__file__).parent
        output_dir = script_dir / "audio_feature_extracted"
        
        scaler = joblib.load(output_dir / 'scaler.pkl')
        encoder = joblib.load(output_dir / 'encoder.pkl')
        model = load_model(output_dir / 'model.h5', compile=False)
        
        # Prepare features
        features_df = pd.DataFrame([features], columns=[f'feature_{i}' for i in range(len(features))])
        features_scaled = scaler.transform(features_df)
        features_reshaped = np.expand_dims(features_scaled, axis=2)
        
        # Make prediction
        prediction_probs = model.predict(features_reshaped, verbose=0)
        predicted_emotion = encoder.inverse_transform(prediction_probs)
        result = predicted_emotion.flatten()[0]
        
        print(f"✅ Prediction completed!")
        print(f"   Predicted emotion: {result}")
        print(f"   Confidence: {np.max(prediction_probs):.4f}")
        print(f"   All probabilities: {prediction_probs.flatten()}")
        
        # Check if encoder has classes
        if hasattr(encoder, 'classes_'):
            print(f"   Available emotions: {encoder.classes_}")
        
        # Clean up
        try:
            os.unlink(temp_path)
        except PermissionError:
            print("⚠️  Could not delete temporary file (Windows permission issue)")
        except Exception as e:
            print(f"⚠️  Could not delete temporary file: {e}")
        
        return True, result, prediction_probs
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False, None, None

def main():
    """Main test function"""
    print("🔧 Quick Model Test with Good Audio")
    print("=" * 50)
    
    success, emotion, probs = test_with_good_audio()
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    
    if success:
        print(f"✅ Test successful!")
        print(f"   Predicted emotion: {emotion}")
        print(f"   Confidence: {np.max(probs):.4f}")
        
        if emotion != "Sad":
            print("🎉 Great! Model is working correctly!")
            print("💡 The issue is likely with your audio recordings:")
            print("   - Make sure recordings are at least 3-5 seconds long")
            print("   - Speak clearly and at good volume")
            print("   - Avoid background noise")
        else:
            print("⚠️  Still getting 'Sad' - this suggests a deeper issue")
            print("💡 Possible causes:")
            print("   - Model file corruption")
            print("   - Version compatibility issues")
            print("   - Feature extraction problems")
    else:
        print("❌ Test failed!")
        print("💡 Check the error messages above")
    
    print("\n🏁 Test completed!")

if __name__ == "__main__":
    main() 