# Flask Emotion Analysis Service

This Flask application provides emotion analysis for voice recordings using machine learning models.

## Features

- Voice emotion analysis (Happy, Sad, Angry, Calm, Surprised, Neutral)
- RESTful API endpoints
- Support for both localhost and deployment environments
- Automatic model file validation
- Health check endpoint

## Setup

### Prerequisites

- Python 3.8 or higher
- Required model files in `audio_feature_extracted/` directory:
  - `scaler.pkl`
  - `encoder.pkl`
  - `model.h5`

### Local Development

#### Windows
```bash
# Navigate to the utils directory
cd sentiVoice (BE)/utils

# Run the batch script
start_flask.bat
```

#### Unix/Linux/Mac
```bash
# Navigate to the utils directory
cd sentiVoice (BE)/utils

# Make the script executable
chmod +x start_flask.sh

# Run the shell script
./start_flask.sh
```

#### Manual Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Start the Flask app
python start_flask.py
```

### Environment Variables

- `PORT`: Port number (default: 5000 for localhost, 8080 for deployment)
- `FLASK_ENV`: Environment mode (development/production)
- `FLASK_URL`: URL for the Flask service (set in backend config)

## API Endpoints

### Health Check
```
GET /health
```
Returns service status and timestamp.

### Emotion Analysis
```
POST /api/predict
```
Analyzes voice recordings for emotion detection.

**Request Body:**
```json
{
  "audio_data": "base64_encoded_audio_data"
}
```
or
```json
{
  "file_path": "/path/to/audio/file.wav"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "emotion": "happy",
    "mfcc1": 0.1234,
    "mfcc40": 0.5678,
    "chroma": 0.9012,
    "melspectrogram": 0.3456,
    "contrast": 0.7890,
    "tonnetz": 0.1234
  }
}
```

## Configuration

### Backend Integration

The Flask service URL is configured in `sentiVoice (BE)/config.js`:

```javascript
module.exports = {
    // ... other config
    flaskUrl: process.env.FLASK_URL || 'http://localhost:5000/api/predict',
};
```

### Environment Setup

For localhost development:
```bash
export FLASK_URL=http://localhost:5000/api/predict
```

For deployment:
```bash
export FLASK_URL=https://your-deployed-flask-url.com/api/predict
```

## Troubleshooting

### Common Issues

1. **Missing Model Files**
   - Ensure all model files are in the `audio_feature_extracted/` directory
   - Check file permissions

2. **Port Already in Use**
   - Change the PORT environment variable
   - Kill existing processes on the port

3. **Dependencies Issues**
   - Run `pip install -r requirements.txt`
   - Check Python version compatibility

4. **Audio Processing Errors**
   - Ensure audio files are in supported formats (WAV recommended)
   - Check audio file quality and duration

### Debug Mode

For detailed logging, set the environment:
```bash
export FLASK_ENV=development
```

## Deployment

### Docker
```bash
docker build -t flask-emotion-analysis .
docker run -p 8080:8080 flask-emotion-analysis
```

### Cloud Deployment
- Update the `FLASK_URL` in your backend configuration
- Ensure all model files are included in the deployment
- Set appropriate environment variables

## Model Files

The emotion analysis requires these pre-trained model files:
- `scaler.pkl`: Feature scaler for normalization
- `encoder.pkl`: Label encoder for emotion classes
- `model.h5`: Trained neural network model

These files should be placed in the `audio_feature_extracted/` directory. 