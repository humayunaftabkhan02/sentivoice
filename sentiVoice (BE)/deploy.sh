#!/bin/bash

# SentiVoice Deployment Script
# This script helps deploy the backend and Flask app to Google Cloud Run

echo "🚀 Starting SentiVoice Deployment..."

# Set environment variables
export PROJECT_ID="sentivoice-273777154059"
export REGION="us-central1"
export BACKEND_SERVICE="sentivoice-backend"
export FLASK_SERVICE="sentivoice-flask"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "You are not authenticated with gcloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Set the project
print_status "Setting project to $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Deploy Flask App
print_status "Deploying Flask app..."
cd utils

# Build and deploy Flask app
gcloud run deploy $FLASK_SERVICE \
    --source . \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --concurrency 80 \
    --max-instances 10

if [ $? -eq 0 ]; then
    print_status "Flask app deployed successfully!"
    FLASK_URL=$(gcloud run services describe $FLASK_SERVICE --region=$REGION --format="value(status.url)")
    print_status "Flask URL: $FLASK_URL"
else
    print_error "Failed to deploy Flask app"
    exit 1
fi

cd ..

# Deploy Backend
print_status "Deploying Backend..."
gcloud run deploy $BACKEND_SERVICE \
    --source . \
    --region $REGION \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --concurrency 80 \
    --max-instances 10

if [ $? -eq 0 ]; then
    print_status "Backend deployed successfully!"
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
    print_status "Backend URL: $BACKEND_URL"
else
    print_error "Failed to deploy Backend"
    exit 1
fi

# Update environment variables for the backend
print_status "Updating backend environment variables..."
gcloud run services update $BACKEND_SERVICE \
    --region $REGION \
    --set-env-vars FLASK_URL="$FLASK_URL/api/predict"

print_status "Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Flask App: $FLASK_URL"
echo "  Backend: $BACKEND_URL"
echo "  Flask Predict Endpoint: $FLASK_URL/api/predict"
echo ""
echo "🔧 Next Steps:"
echo "  1. Update your frontend environment variables"
echo "  2. Test the endpoints"
echo "  3. Monitor the logs: gcloud logs tail --service=$BACKEND_SERVICE" 