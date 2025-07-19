#!/usr/bin/env python3
"""
Diagnostic script for the emotion analysis model.
This script helps identify issues with model files, feature extraction, and predictions.
"""

import os
import numpy as np
import joblib
import pandas as pd
from tensorflow.keras.models import load_model
import traceback
import tempfile
from pathlib import Path

def check_model_files():
    """Check if all required model files exist and are valid"""
    print("🔍 Checking model files...")
    
    script_dir = Path(__file__).parent
    output_dir = script_dir / "audio_feature_extracted"
    
    required_files = {
        'scaler.pkl': output_dir / 'scaler.pkl',
        'encoder.pkl': output_dir / 'encoder.pkl',
        'model.h5': output_dir / 'model.h5'
    }
    
    all_good = True
    
    for name, file_path in required_files.items():
        if file_path.exists():
            print(f"✅ {name} exists")
            try:
                if name.endswith('.pkl'):
                    obj = joblib.load(file_path)
                    print(f"   Type: {type(obj)}")
                    if hasattr(obj, 'n_features_in_'):
                        print(f"   Expected features: {obj.n_features_in_}")
                    if hasattr(obj, 'classes_'):
                        print(f"   Classes: {obj.classes_}")
                elif name.endswith('.h5'):
                    model = load_model(file_path, compile=False)
                    print(f"   Model summary:")
                    model.summary()
            except Exception as e:
                print(f"❌ Error loading {name}: {e}")
                all_good = False
        else:
            print(f"❌ {name} missing")
            all_good = False
    
    return all_good

def test_feature_extraction():
    """Test feature extraction with a dummy audio signal"""
    print("\n🔍 Testing feature extraction...")
    
    try:
        from app import extract_feature
        
        # Create a dummy audio file (1 second of sine wave)
        import librosa
        import tempfile
        
        # Generate a test signal
        sample_rate = 22050
        duration = 1.0
        t = np.linspace(0, duration, int(sample_rate * duration))
        test_signal = 0.1 * np.sin(2 * np.pi * 440 * t)  # 440 Hz sine wave
        
        # Save as temporary WAV file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            import soundfile as sf
            sf.write(temp_file.name, test_signal, sample_rate)
            temp_path = temp_file.name
        
        print(f"Created test audio file: {temp_path}")
        
        # Extract features
        features = extract_feature(
            temp_path,
            mfcc=True,
            chroma=True,
            mel=True,
            contrast=True,
            tonnetz=True
        )
        
        print(f"Feature extraction successful!")
        print(f"Feature vector length: {len(features)}")
        print(f"Feature range: {np.min(features):.4f} to {np.max(features):.4f}")
        print(f"Non-zero features: {np.count_nonzero(features)}")
        
        # Clean up
        os.unlink(temp_path)
        
        return True, features
        
    except Exception as e:
        print(f"❌ Feature extraction failed: {e}")
        traceback.print_exc()
        return False, None

def test_model_prediction(features):
    """Test model prediction with extracted features"""
    print("\n🔍 Testing model prediction...")
    
    try:
        script_dir = Path(__file__).parent
        output_dir = script_dir / "audio_feature_extracted"
        
        # Load model components
        scaler = joblib.load(output_dir / 'scaler.pkl')
        encoder = joblib.load(output_dir / 'encoder.pkl')
        model = load_model(output_dir / 'model.h5', compile=False)
        
        print(f"Model components loaded successfully")
        
        # Prepare features
        features_df = pd.DataFrame([features], columns=[f'feature_{i}' for i in range(len(features))])
        
        print(f"Input features shape: {features_df.shape}")
        print(f"Scaler expected features: {scaler.n_features_in_}")
        
        # Scale features
        features_scaled = scaler.transform(features_df)
        print(f"Scaled features shape: {features_scaled.shape}")
        print(f"Scaled features range: {np.min(features_scaled):.4f} to {np.max(features_scaled):.4f}")
        
        # Reshape for model
        features_reshaped = np.expand_dims(features_scaled, axis=2)
        print(f"Reshaped features shape: {features_reshaped.shape}")
        
        # Make prediction
        prediction_probs = model.predict(features_reshaped, verbose=0)
        print(f"Raw prediction probabilities: {prediction_probs}")
        
        # Decode prediction
        predicted_emotion = encoder.inverse_transform(prediction_probs)
        result = predicted_emotion.flatten()[0]
        
        print(f"Predicted emotion: {result}")
        print(f"Confidence: {np.max(prediction_probs):.4f}")
        print(f"All probabilities: {prediction_probs.flatten()}")
        
        return True, result, prediction_probs
        
    except Exception as e:
        print(f"❌ Model prediction failed: {e}")
        traceback.print_exc()
        return False, None, None

def check_audio_processing():
    """Check if audio processing libraries are working correctly"""
    print("\n🔍 Checking audio processing libraries...")
    
    try:
        import librosa
        print(f"✅ librosa version: {librosa.__version__}")
        
        import soundfile as sf
        print(f"✅ soundfile version: {sf.__version__}")
        
        # Test basic audio operations
        sample_rate = 22050
        duration = 0.1
        t = np.linspace(0, duration, int(sample_rate * duration))
        test_signal = np.sin(2 * np.pi * 440 * t)
        
        # Test librosa loading
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            sf.write(temp_file.name, test_signal, sample_rate)
            temp_path = temp_file.name
        
        # Load the audio file
        loaded_signal, sr = librosa.load(temp_path, sr=None)
        print(f"✅ librosa.load works - loaded {len(loaded_signal)} samples at {sr}Hz")
        
        # Clean up with error handling for Windows
        try:
            os.unlink(temp_path)
        except PermissionError:
            print("⚠️  Could not delete temporary file (Windows permission issue)")
        except Exception as e:
            print(f"⚠️  Could not delete temporary file: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Audio processing check failed: {e}")
        traceback.print_exc()
        return False

def main():
    """Main diagnostic function"""
    print("🔧 Emotion Analysis Model Diagnostics")
    print("=" * 50)
    
    # Check model files
    model_files_ok = check_model_files()
    
    # Check audio processing
    audio_ok = check_audio_processing()
    
    # Test feature extraction
    if audio_ok:
        feature_ok, features = test_feature_extraction()
    else:
        feature_ok, features = False, None
    
    # Test model prediction
    if model_files_ok and feature_ok and features is not None:
        prediction_ok, emotion, probs = test_model_prediction(features)
    else:
        prediction_ok, emotion, probs = False, None, None
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 DIAGNOSTIC SUMMARY")
    print("=" * 50)
    print(f"Model files: {'✅ OK' if model_files_ok else '❌ FAILED'}")
    print(f"Audio processing: {'✅ OK' if audio_ok else '❌ FAILED'}")
    print(f"Feature extraction: {'✅ OK' if feature_ok else '❌ FAILED'}")
    print(f"Model prediction: {'✅ OK' if prediction_ok else '❌ FAILED'}")
    
    if prediction_ok:
        print(f"Predicted emotion: {emotion}")
        print(f"Confidence: {np.max(probs):.4f}")
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS:")
    if not model_files_ok:
        print("- Download or copy the required model files to audio_feature_extracted/")
    if not audio_ok:
        print("- Install or update audio processing libraries: pip install librosa soundfile")
    if not feature_ok:
        print("- Check audio file format and quality")
    if not prediction_ok:
        print("- Verify model file compatibility and feature dimensions")
    
    print("\n🏁 Diagnostics completed!")

if __name__ == "__main__":
    main() 