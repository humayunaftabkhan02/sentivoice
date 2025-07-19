module.exports = {
    port: process.env.PORT || 3000,
    dbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sentiVoiceDB',
    // Flask configuration for emotion analysis
    flaskUrl: process.env.FLASK_URL || 'https://sentivoice-flask-273777154059.us-central1.run.app/api/predict',
    // Add other configuration settings here
};
