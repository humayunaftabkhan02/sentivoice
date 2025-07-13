# 🚀 SentiVoice Deployment

Quick deployment guide for SentiVoice using free tier services.

## Quick Start

1. **Run the setup script:**
   ```bash
   chmod +x setup-deployment.sh
   ./setup-deployment.sh
   ```

2. **Follow the deployment guide:**
   - Read `DEPLOYMENT_GUIDE.md` for detailed instructions
   - Deploy frontend to Netlify
   - Deploy backend to Google Cloud Run
   - Set up MongoDB Atlas

## Architecture

```
Frontend (Netlify) ←→ Backend (Cloud Run) ←→ Database (MongoDB Atlas)
     ↓
Emotion Detection (Flask/Python)
```

## Free Tier Services Used

- **Netlify**: Frontend hosting
- **Google Cloud Run**: Backend hosting  
- **MongoDB Atlas**: Database
- **Gmail**: Email service

## Key Files

- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `setup-deployment.sh` - Automated setup script
- `sentiVoice (FE)/netlify.toml` - Netlify configuration
- `sentiVoice (BE)/Dockerfile` - Container configuration
- `sentiVoice (BE)/deploy.sh` - Cloud Run deployment script

## Environment Variables

### Frontend (Netlify)
```
VITE_API_BASE_URL=https://your-backend-url.run.app/api
```

### Backend (Cloud Run)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sentiVoiceDB
JWT_SECRET=your-super-secret-jwt-key
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASS=your-app-password
FRONTEND_URL=https://your-app-name.netlify.app
NODE_ENV=production
```

## Health Checks

- Frontend: `https://your-app.netlify.app`
- Backend: `https://your-backend-url.run.app/health`

## Support

If you encounter issues:
1. Check the logs in both platforms
2. Verify environment variables
3. Test endpoints individually
4. Check CORS configuration
5. Verify database connectivity

Happy deploying! 🎉 