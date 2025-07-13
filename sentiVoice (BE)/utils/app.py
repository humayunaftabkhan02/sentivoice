import sys
import numpy as np
import librosa
import tensorflow as tf
from tensorflow.keras.models import load_model
import pickle
import os
import pandas as pd
import joblib
from pathlib import Path
import traceback
import json

def extract_feature(file_name, **kwargs):
    """Extract feature from audio file"""
    mfcc = kwargs.get("mfcc")
    chroma = kwargs.get("chroma")
    mel = kwargs.get("mel")
    contrast = kwargs.get("contrast")
    tonnetz = kwargs.get("tonnetz")

    try:
        X, sample_rate = librosa.load(file_name, sr=None)
    except Exception as e:
        print(f"Error loading audio file: {e}")
        raise
    result = np.array([])

    if chroma or contrast:
        stft = np.abs(librosa.stft(X))

    if mfcc:
        mfccs = np.mean(librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=40).T, axis=0)
        result = np.hstack((result, mfccs))

    if chroma:
        chroma_features = np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate).T, axis=0)
        result = np.hstack((result, chroma_features))

    if mel:
        mel_features = np.mean(librosa.feature.melspectrogram(y=X, sr=sample_rate).T, axis=0)
        result = np.hstack((result, mel_features))

    if contrast:
        contrast_features = np.mean(librosa.feature.spectral_contrast(S=stft, sr=sample_rate).T, axis=0)
        result = np.hstack((result, contrast_features))

    if tonnetz:
        tonnetz_features = np.mean(librosa.feature.tonnetz(y=librosa.effects.harmonic(X), sr=sample_rate).T, axis=0)
        result = np.hstack((result, tonnetz_features))

    return result

def predict_emotion(audio_path):
    try:
        # Load artifacts from the correct path
        output_dir = os.path.join(os.path.dirname(__file__), "audio_feature_extracted")
        scaler_path = os.path.join(output_dir, 'scaler.pkl')
        encoder_path = os.path.join(output_dir, 'encoder.pkl')
        model_path = os.path.join(output_dir, 'model.h5')

        # Load the saved artifacts
        loaded_scaler = joblib.load(scaler_path)
        loaded_encoder = joblib.load(encoder_path)
        loaded_model = load_model(model_path, compile=False)

        # Extract features
        features = extract_feature(
            audio_path,
            mfcc=True,
            chroma=True,
            mel=True,
            contrast=True,
            tonnetz=True
        )
        # Prepare features
        mfcc1 = features[0] if len(features) > 0 else None
        mfcc40 = features[39] if len(features) > 39 else None
        chroma = features[40] if len(features) > 40 else None
        mel = features[52] if len(features) > 52 else None
        contrast = features[53] if len(features) > 53 else None
        tonnetz = features[59] if len(features) > 59 else None
        
        # Scale and reshape
        features_df = pd.DataFrame([features], columns=[f'feature_{i}' for i in range(len(features))])
        features_scaled = loaded_scaler.transform(features_df)
        features_reshaped = np.expand_dims(features_scaled, axis=2)
        
        # Make prediction
        prediction_probs = loaded_model.predict(features_reshaped, verbose=0)
        predicted_emotion = loaded_encoder.inverse_transform(prediction_probs)
        # Print result in requested format
        output = (
            f"predicted emotion: {predicted_emotion.flatten()[0]}\n"
            f"mfcc1: {mfcc1}\n"
            f"mfcc40: {mfcc40}\n"
            f"chroma: {chroma}\n"
            f"mel: {mel}\n"
            f"contrast: {contrast}\n"
            f"tonnetz: {tonnetz}"
        )
        print(output)
        return output
    except Exception as e:
        print(f"Error in predict_emotion: {str(e)}")
        traceback.print_exc()
        raise

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python app.py <audio_file_path>")
        sys.exit(1)
        
    audio_file_path = sys.argv[1]
    try:
        result = predict_emotion(audio_file_path)
        # Only print JSON if running as script
        # print(json.dumps(result))
    except Exception as e:
        print(f"Error: {str(e)}")
        traceback.print_exc()
        sys.exit(1)