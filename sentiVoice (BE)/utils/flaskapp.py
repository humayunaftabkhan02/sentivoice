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

def predict_emotion(audio_path):
    try:
        output_dir = os.path.join(os.path.dirname(__file__), "audio_feature_extracted")
        scaler_path = os.path.join(output_dir, 'scaler.pkl')
        encoder_path = os.path.join(output_dir, 'encoder.pkl')
        model_path = os.path.join(output_dir, 'model.h5')
        loaded_scaler = joblib.load(scaler_path)
        loaded_encoder = joblib.load(encoder_path)
        loaded_model = load_model(model_path, compile=False)
        features = extract_feature(
            audio_path,
            mfcc=True,
            chroma=True,
            mel=True,
            contrast=True,
            tonnetz=True
        )
        mfcc1 = features[0] if len(features) > 0 else None
        mfcc40 = features[39] if len(features) > 39 else None
        chroma = features[40] if len(features) > 40 else None
        mel = features[52] if len(features) > 52 else None
        contrast = features[53] if len(features) > 53 else None
        tonnetz = features[59] if len(features) > 59 else None
        features_df = pd.DataFrame([features], columns=[f'feature_{i}' for i in range(len(features))])
        features_scaled = loaded_scaler.transform(features_df)
        features_reshaped = np.expand_dims(features_scaled, axis=2)
        prediction_probs = loaded_model.predict(features_reshaped, verbose=0)
        predicted_emotion = loaded_encoder.inverse_transform(prediction_probs)
        result = predicted_emotion.flatten()[0]
        return {
            "emotion": result,
            "mfcc1": float(mfcc1) if mfcc1 is not None else None,
            "mfcc40": float(mfcc40) if mfcc40 is not None else None,
            "chroma": float(chroma) if chroma is not None else None,
            "melspectrogram": float(mel) if mel is not None else None,
            "contrast": float(contrast) if contrast is not None else None,
            "tonnetz": float(tonnetz) if tonnetz is not None else None,
            "mfccs": features[:40].tolist() if len(features) >= 40 else []
        }
    except Exception as e:
        print(f"Error in predict_emotion: {str(e)}")
        traceback.print_exc()
        return {"error": str(e)}

app = Flask(__name__)
CORS(app)

@app.route('/api/predict', methods=['POST'])
def get_features():
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
            
        # Check if we have audio data (base64) or file path
        if 'audio_data' in data:
            # Handle base64 audio data
            audio_data = data['audio_data']
            try:
                # Decode base64 to binary
                audio_binary = base64.b64decode(audio_data)
                
                # Create temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
                    temp_file.write(audio_binary)
                    temp_file_path = temp_file.name
                
                # Process the audio
                result = predict_emotion(temp_file_path)
                
                # Clean up temporary file
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
                
                if "error" in result:
                    return jsonify({
                        "status": "error",
                        "message": result["error"]
                    }), 500
                    
                return jsonify({
                    "status": "success",
                    "data": result
                })
                
            except Exception as e:
                print(f"Error processing base64 audio: {str(e)}")
                return jsonify({
                    "status": "error",
                    "message": f"Error processing audio data: {str(e)}"
                }), 500
                
        elif 'file_path' in data:
            # Handle file path (for backward compatibility)
            file_path = data['file_path']
            if not os.path.exists(file_path):
                return jsonify({
                    "status": "error",
                    "message": "File does not exist"
                }), 400
                
            result = predict_emotion(file_path)
            if "error" in result:
                return jsonify({
                    "status": "error",
                    "message": result["error"]
                }), 500
                
            return jsonify({
                "status": "success",
                "data": result
            })
        else:
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
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
