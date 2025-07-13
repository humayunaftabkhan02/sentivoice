#!/bin/bash

echo "🚀 SentiVoice Deployment Setup"
echo "=============================="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Frontend setup
echo ""
echo "📱 Setting up Frontend..."
cd "sentiVoice (FE)"

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Check if build works
echo "Testing frontend build..."
if npm run build; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed. Please check the errors above."
    exit 1
fi

# Backend setup
echo ""
echo "🔧 Setting up Backend..."
cd "../sentiVoice (BE)"

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "⚠️  Python3 is not installed. The Flask emotion detection service may not work."
    echo "Please install Python3 and the required packages:"
    echo "pip3 install -r requirements.txt"
else
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

# Create uploads directories if they don't exist
mkdir -p uploads/attachments uploads/profile-pictures

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Push your code to GitHub"
echo "2. Set up MongoDB Atlas (free tier)"
echo "3. Configure Gmail app password"
echo "4. Deploy frontend to Netlify"
echo "5. Deploy backend to Google Cloud Run"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions" 