# SentiVoice Deployment Guide

This guide will help you deploy SentiVoice for free using Netlify (frontend) and Google Cloud Run (backend).

## Prerequisites

1. **GitHub Account** - For version control
2. **Netlify Account** - For frontend hosting (free tier)
3. **Google Cloud Account** - For backend hosting (free tier)
4. **MongoDB Atlas Account** - For database (free tier)

## 1. Frontend Deployment (Netlify)

### Step 1: Prepare Your Repository

1. Push your code to GitHub:
```bash
cd "sentiVoice (FE)"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/sentivoice-frontend.git
git push -u origin main
```

### Step 2: Deploy to Netlify

1. Go to [Netlify](https://netlify.com) and sign up/login
2. Click "New site from Git"
3. Connect your GitHub account
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

### Step 3: Configure Environment Variables

1. In your Netlify dashboard, go to Site settings > Environment variables
2. Add the following variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-url.run.app/api` (you'll get this after backend deployment)

## 2. Backend Deployment (Google Cloud Run)

### Step 1: Set Up Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable required APIs:
   - Cloud Run API
   - Container Registry API
   - Cloud Build API

### Step 2: Install Google Cloud CLI

```bash
# Download and install gcloud CLI
# Follow instructions at: https://cloud.google.com/sdk/docs/install

# Initialize gcloud
gcloud init
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Step 3: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Get your connection string
5. Add your IP to whitelist (or use 0.0.0.0/0 for Cloud Run)

### Step 4: Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sentiVoiceDB

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=https://your-app-name.netlify.app

# Environment
NODE_ENV=production
```

### Step 5: Deploy to Cloud Run

```bash
cd "sentiVoice (BE)"

# Make deploy script executable
chmod +x deploy.sh

# Edit deploy.sh and replace YOUR_PROJECT_ID with your actual project ID
# Then run:
./deploy.sh
```

Or deploy manually:

```bash
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
  --set-env-vars "NODE_ENV=production,MONGODB_URI=your-mongodb-uri,JWT_SECRET=your-jwt-secret,GMAIL_USER=your-email,GMAIL_APP_PASS=your-app-password,FRONTEND_URL=https://your-app-name.netlify.app"
```

### Step 6: Update Frontend API URL

1. Get your Cloud Run service URL from the deployment output
2. Update the `VITE_API_BASE_URL` environment variable in Netlify
3. Redeploy your frontend

## 3. Database Setup

### MongoDB Atlas Configuration

1. **Network Access**: Add `0.0.0.0/0` to IP whitelist for Cloud Run
2. **Database Access**: Create a user with read/write permissions
3. **Cluster**: Use M0 (free tier) cluster

### Connection String Format

```
mongodb+srv://username:password@cluster.mongodb.net/sentiVoiceDB?retryWrites=true&w=majority
```

## 4. Email Configuration

### Gmail App Password Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
3. Use this password in your environment variables

## 5. Free Tier Limits

### Netlify (Frontend)
- ✅ Unlimited sites
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Custom domains

### Google Cloud Run (Backend)
- ✅ 2 million requests/month
- ✅ 360,000 vCPU-seconds/month
- ✅ 180,000 GiB-seconds/month
- ✅ 1GB network egress/month

### MongoDB Atlas (Database)
- ✅ 512MB storage
- ✅ Shared RAM
- ✅ 500 connections

## 6. Monitoring and Maintenance

### Health Checks

Your backend includes health check endpoints:
- `GET /` - Basic health check
- `GET /api/health` - API health check

### Logs

- **Netlify**: View in dashboard under Functions > Logs
- **Cloud Run**: View in Google Cloud Console > Cloud Run > Logs

### Scaling

Both services auto-scale based on demand:
- Netlify: Automatic scaling
- Cloud Run: 0 to 10 instances based on traffic

## 7. Custom Domain (Optional)

### Netlify Custom Domain

1. In Netlify dashboard, go to Domain settings
2. Add custom domain
3. Configure DNS records

### Cloud Run Custom Domain

1. Map custom domain in Cloud Run console
2. Configure SSL certificate (automatic)

## 8. Troubleshooting

### Common Issues

1. **CORS Errors**: Check allowed origins in backend CORS configuration
2. **Database Connection**: Verify MongoDB Atlas network access
3. **Email Not Working**: Check Gmail app password configuration
4. **Build Failures**: Check Node.js version compatibility

### Debug Commands

```bash
# Test backend locally
cd "sentiVoice (BE)"
npm install
node index.js

# Test frontend locally
cd "sentiVoice (FE)"
npm install
npm run dev

# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision"
```

## 9. Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use a strong, random secret
3. **Database**: Use strong passwords and restrict network access
4. **HTTPS**: Both services provide HTTPS by default

## 10. Cost Optimization

### Free Tier Best Practices

1. **Cloud Run**: Set max instances to 10 to stay within limits
2. **MongoDB**: Use M0 cluster (free tier)
3. **Netlify**: Monitor build minutes usage
4. **Email**: Use Gmail app passwords (free)

### Monitoring Costs

- Google Cloud Console > Billing
- Netlify Dashboard > Usage
- MongoDB Atlas > Billing

## Support

If you encounter issues:

1. Check the logs in both platforms
2. Verify environment variables
3. Test endpoints individually
4. Check CORS configuration
5. Verify database connectivity

Your SentiVoice application should now be live and accessible via your Netlify URL! 🚀 