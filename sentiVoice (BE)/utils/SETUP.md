# Flask App Setup Guide

This guide will help you get the Flask emotion analysis service working on localhost.

## Prerequisites

1. **Python 3.8 or higher** installed
2. **Required model files** in the `audio_feature_extracted/` directory:
   - `scaler.pkl`
   - `encoder.pkl` 
   - `model.h5`

## Quick Start

### 1. Navigate to the utils directory
```bash
cd sentiVoice (BE)/utils
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Start the Flask app
```bash
python flaskapp.py
```

You should see output like:
```
Starting Flask app on 0.0.0.0:5000
Environment: development
 * Serving Flask app 'flaskapp'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
```

### 4. Test the Flask app
In a new terminal:
```bash
python test_flask.py
```

## Troubleshooting

### Issue: "Missing required model files"
**Solution:** Ensure the model files are in the `audio_feature_extracted/` directory:
```
utils/
├── audio_feature_extracted/
│   ├── scaler.pkl
│   ├── encoder.pkl
│   └── model.h5
├── flaskapp.py
└── ...
```

### Issue: "Port already in use"
**Solution:** Kill existing processes or use a different port:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
PORT=5001 python flaskapp.py
```

### Issue: "Module not found" errors
**Solution:** Install missing dependencies:
```bash
pip install flask flask-cors numpy pandas joblib tensorflow librosa scikit-learn
```

### Issue: "librosa" installation problems
**Solution:** Install system dependencies first:
```bash
# On Ubuntu/Debian
sudo apt-get install libsndfile1

# On macOS
brew install libsndfile

# On Windows
# Download and install from: https://www.libsndfile.org/
```

## Testing

### Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "emotion-analysis",
  "timestamp": "2024-01-01T12:00:00.000000"
}
```

### Manual Test
```bash
python test_flask.py
```

## Backend Integration

The backend is configured to use the Flask app at `http://localhost:5000/api/predict` by default.

To change the Flask URL for deployment:
```bash
export FLASK_URL=https://your-deployed-url.com/api/predict
```

## Common Issues

1. **Model files missing**: Download or copy the required model files to `audio_feature_extracted/`
2. **Port conflicts**: Use `PORT=5001 python flaskapp.py` to use a different port
3. **Dependencies**: Run `pip install -r requirements.txt` to install all dependencies
4. **Permission issues**: Make sure you have write permissions in the utils directory

## Environment Variables

- `PORT`: Flask app port (default: 5000)
- `FLASK_ENV`: Environment mode (development/production)
- `FLASK_URL`: Backend configuration for Flask service URL

## Next Steps

Once the Flask app is running:
1. Start your backend server
2. Test voice recording in the frontend
3. Check that emotion analysis works correctly 