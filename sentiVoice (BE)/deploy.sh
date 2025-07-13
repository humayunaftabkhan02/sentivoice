#!/bin/bash

# Deploy to Google Cloud Run
# Make sure you have gcloud CLI installed and configured

echo "🚀 Deploying SentiVoice Backend to Google Cloud Run..."

# Set your project ID
PROJECT_ID="your-project-id"  # Replace with your actual project ID

# Build and deploy
gcloud run deploy sentivoice-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --concurrency 80 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --project $PROJECT_ID

echo "✅ Deployment completed!"
echo "🌐 Your service URL will be displayed above" 