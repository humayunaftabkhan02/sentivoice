from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import pandas as pd
import joblib
import traceback
import json
import base64
import tempfile
from tensorflow.keras.models import load_model
from werkzeug.utils import secure_filename
from app import extract_feature

def convert_numpy_to_python(obj):
    """Convert numpy types to Python types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_to_python(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_to_python(item) for item in obj]
    else:
        return obj

def analyze_audio_quality(audio_path):
    """Analyze audio quality and return detailed feedback"""
    try:
        import librosa
        
        # Load audio
        X, sample_rate = librosa.load(audio_path, sr=None)
        duration = float(len(X) / sample_rate)
        max_amplitude = float(np.max(np.abs(X)))
        rms_energy = float(np.sqrt(np.mean(X**2)))
        
        # Define quality thresholds
        min_duration = 10.0  # Minimum 10 seconds
        max_duration = 120.0  # Maximum 2 minutes
        min_amplitude = 0.01  # Minimum amplitude
        min_energy = 0.005   # Minimum RMS energy
        
        issues = []
        suggestions = []
        
        # Check duration
        if duration < min_duration:
            issues.append("Audio is too short")
            suggestions.append("Speak for at least 10 seconds to capture enough audio for accurate analysis")
        elif duration > max_duration:
            issues.append("Audio is too long")
            suggestions.append("Please keep your recording under 2 minutes for optimal analysis")
        
        # Check amplitude
        if max_amplitude < min_amplitude:
            issues.append("Audio is too quiet")
            suggestions.append("Speak at a consistent volume - not too quiet or too loud")
        
        # Check energy
        if rms_energy < min_energy:
            issues.append("Audio has very low energy")
            suggestions.append("Record in a quiet room without echo or background noise")
        
        # Check if audio is mostly silence
        silence_threshold = 0.001
        silence_ratio = float(np.sum(np.abs(X) < silence_threshold) / len(X))
        if silence_ratio > 0.8:
            issues.append("Audio appears to be mostly silence")
            suggestions.append("Test your microphone before recording to ensure it's working")
        
        return {
            "duration": duration,
            "max_amplitude": max_amplitude,
            "rms_energy": rms_energy,
            "silence_ratio": silence_ratio,
            "sample_rate": int(sample_rate),
            "issues": issues,
            "suggestions": suggestions,
            "is_good_quality": len(issues) == 0
        }
        
    except Exception as e:
        return {
            "error": f"Could not analyze audio quality: {str(e)}",
            "is_good_quality": False
        }

def predict_emotion(audio_path):
    try:
        # First, analyze audio quality
        quality_analysis = analyze_audio_quality(audio_path)
        
        if not quality_analysis.get("is_good_quality", False):
            return {
                "error": "audio_quality_issue",
                "quality_analysis": convert_numpy_to_python(quality_analysis),
                "message": "Please re-record your voice with better quality"
            }
        
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_dir = os.path.join(script_dir, "audio_feature_extracted")
        
        # Check if the model files exist
        scaler_path = os.path.join(output_dir, 'scaler.pkl')
        encoder_path = os.path.join(output_dir, 'encoder.pkl')
        model_path = os.path.join(output_dir, 'model.h5')
        
        # Verify all required files exist
        required_files = [scaler_path, encoder_path, model_path]
        missing_files = [f for f in required_files if not os.path.exists(f)]
        
        if missing_files:
            error_msg = f"Missing required model files: {missing_files}"
            print(f"Error: {error_msg}")
            return {"error": error_msg}
        
        print(f"Loading model files from: {output_dir}")
        loaded_scaler = joblib.load(scaler_path)
        loaded_encoder = joblib.load(encoder_path)
        loaded_model = load_model(model_path, compile=False)
        
        print(f"Processing audio file: {audio_path}")
        
        # Extract features with detailed debugging
        features = extract_feature(
            audio_path,
            mfcc=True,
            chroma=True,
            mel=True,
            contrast=True,
            tonnetz=True
        )
        
        print(f"Extracted features length: {len(features)}")
        print(f"Features shape: {features.shape}")
        print(f"Features range: {np.min(features)} to {np.max(features)}")
        
        # Validate feature extraction
        if len(features) == 0 or np.all(features == 0):
            print("Warning: All features are zero or empty!")
            return {
                "error": "feature_extraction_failed",
                "message": "Could not extract features from audio. Please re-record with clearer speech."
            }
        
        # Check for NaN or infinite values
        if np.any(np.isnan(features)) or np.any(np.isinf(features)):
            print("Warning: Features contain NaN or infinite values!")
            features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)
        
        # Extract specific features with bounds checking
        mfcc1 = features[0] if len(features) > 0 else 0.0
        mfcc40 = features[39] if len(features) > 39 else 0.0
        chroma = features[40] if len(features) > 40 else 0.0
        mel = features[52] if len(features) > 52 else 0.0
        contrast = features[53] if len(features) > 53 else 0.0
        tonnetz = features[59] if len(features) > 59 else 0.0
        
        print(f"Feature values:")
        print(f"  mfcc1: {mfcc1}")
        print(f"  mfcc40: {mfcc40}")
        print(f"  chroma: {chroma}")
        print(f"  mel: {mel}")
        print(f"  contrast: {contrast}")
        print(f"  tonnetz: {tonnetz}")
        
        # Create DataFrame for scaling
        features_df = pd.DataFrame([features], columns=[f'feature_{i}' for i in range(len(features))])
        
        # Validate scaler
        print(f"Scaler type: {type(loaded_scaler)}")
        print(f"Scaler expected features: {loaded_scaler.n_features_in_ if hasattr(loaded_scaler, 'n_features_in_') else 'Unknown'}")
        print(f"Input features: {features_df.shape[1]}")
        
        # Scale features
        features_scaled = loaded_scaler.transform(features_df)
        print(f"Scaled features shape: {features_scaled.shape}")
        print(f"Scaled features range: {np.min(features_scaled)} to {np.max(features_scaled)}")
        
        # Reshape for model input
        features_reshaped = np.expand_dims(features_scaled, axis=2)
        print(f"Reshaped features shape: {features_reshaped.shape}")
        
        # Make prediction
        prediction_probs = loaded_model.predict(features_reshaped, verbose=0)
        print(f"Raw prediction probabilities: {prediction_probs}")
        
        # Decode prediction
        predicted_emotion = loaded_encoder.inverse_transform(prediction_probs)
        result = predicted_emotion.flatten()[0]
        
        print(f"Prediction completed: {result}")
        print(f"Prediction confidence: {np.max(prediction_probs):.4f}")
        
        return {
            "emotion": result,
            "mfcc1": float(mfcc1),
            "mfcc40": float(mfcc40),
            "chroma": float(chroma),
            "melspectrogram": float(mel),
            "contrast": float(contrast),
            "tonnetz": float(tonnetz),
            "mfccs": [float(x) for x in features[:40].tolist()] if len(features) >= 40 else [],
            "confidence": float(np.max(prediction_probs)),
            "all_probabilities": [float(x) for x in prediction_probs.flatten().tolist()],
            "quality_analysis": convert_numpy_to_python(quality_analysis)
        }
    except Exception as e:
        print(f"Error in predict_emotion: {str(e)}")
        traceback.print_exc()
        return {"error": str(e)}

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def root():
    """Root endpoint for health check"""
    return jsonify({
        "status": "healthy",
        "service": "emotion-analysis",
        "message": "SentiVoice Flask API is running"
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "emotion-analysis",
        "timestamp": pd.Timestamp.now().isoformat()
    })

@app.route('/api/predict', methods=['POST'])
def get_features():
    try:
        print("Received prediction request")
        data = request.get_json()
        if not data:
            print("No data provided in request")
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
            
        # Check if we have audio data (base64) or file path
        if 'audio_data' in data:
            print("Processing base64 audio data")
            # Handle base64 audio data
            audio_data = data['audio_data']
            try:
                # Decode base64 to binary
                audio_binary = base64.b64decode(audio_data)
                
                # Create temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
                    temp_file.write(audio_binary)
                    temp_file_path = temp_file.name
                
                print(f"Created temporary file: {temp_file_path}")
                print(f"Audio file size: {len(audio_binary)} bytes")
                
                # Process the audio
                result = predict_emotion(temp_file_path)
                
                # Clean up temporary file with Windows permission handling
                try:
                    os.unlink(temp_file_path)
                    print("Cleaned up temporary file")
                except PermissionError:
                    print("⚠️  Could not delete temporary file (Windows permission issue)")
                except Exception as cleanup_error:
                    print(f"Warning: Could not clean up temporary file: {cleanup_error}")
                
                if "error" in result:
                    print(f"Prediction error: {result['error']}")
                    
                    # Handle specific error types
                    if result['error'] == "audio_quality_issue":
                        return jsonify({
                            "status": "error",
                            "error_type": "audio_quality",
                            "message": result.get("message", "Audio quality is too low. Please re-record."),
                            "quality_analysis": result.get("quality_analysis", {}),
                            "suggestions": result.get("quality_analysis", {}).get("suggestions", [])
                        }), 400
                    elif result['error'] == "feature_extraction_failed":
                        return jsonify({
                            "status": "error",
                            "error_type": "feature_extraction",
                            "message": result.get("message", "Could not extract features from audio. Please re-record with clearer speech.")
                        }), 400
                    else:
                        return jsonify({
                            "status": "error",
                            "message": result["error"]
                        }), 500
                    
                print(f"Prediction successful: {result['emotion']}")
                return jsonify({
                    "status": "success",
                    "data": result
                })
                
            except Exception as e:
                print(f"Error processing base64 audio: {str(e)}")
                traceback.print_exc()
                return jsonify({
                    "status": "error",
                    "message": f"Error processing audio data: {str(e)}"
                }), 500
                
        elif 'file_path' in data:
            print(f"Processing file path: {data['file_path']}")
            # Handle file path (for backward compatibility)
            file_path = data['file_path']
            if not os.path.exists(file_path):
                print(f"File does not exist: {file_path}")
                return jsonify({
                    "status": "error",
                    "message": "File does not exist"
                }), 400
                
            result = predict_emotion(file_path)
            if "error" in result:
                print(f"Prediction error: {result['error']}")
                return jsonify({
                    "status": "error",
                    "message": result["error"]
                }), 500
                
            print(f"Prediction successful: {result['emotion']}")
            return jsonify({
                "status": "success",
                "data": result
            })
        else:
            print("No audio_data or file_path provided")
            return jsonify({
                "status": "error",
                "message": "No audio_data or file_path provided"
            }), 400
                
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    import os
    # Get port from environment variable or default to 8080 for deployment
    port = int(os.environ.get('PORT', 8080))
    host = '0.0.0.0'  # Allow external connections
    
    print(f"Starting Flask app on {host}:{port}")
    print(f"Environment: {os.environ.get('FLASK_ENV', 'production')}")
    print(f"Debug mode: {os.environ.get('FLASK_ENV') == 'development'}")
    
    # For deployment, always run in production mode
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(host=host, port=port, debug=debug_mode)
