# Deploying Backend to Render

This guide will help you deploy your Report Come Play backend to Render.

## Prerequisites

- A Render account (sign up at https://render.com)
- Your backend code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Supabase database already set up and running

## Step 1: Prepare Your Repository

1. Make sure your code is pushed to GitHub/GitLab/Bitbucket
2. Ensure your `.env` file is in `.gitignore` (it should NOT be committed)
3. Verify that `package.json` has the correct start script

Your `package.json` should have:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

## Step 2: Create a New Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository
4. Select the repository containing your backend code

## Step 3: Configure Your Web Service

Fill in the following settings:

### Basic Settings
- **Name**: `report-come-play-backend` (or your preferred name)
- **Region**: Choose the closest to your users (e.g., Frankfurt for EU)
- **Branch**: `main` (or your production branch)
- **Root Directory**: `backend` (if your backend is in a subdirectory, otherwise leave blank)
- **Runtime**: `Node`
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command**: `npm start`

### Instance Type
- **Free** tier is fine for testing
- **Starter** ($7/month) recommended for production

## Step 4: Set Environment Variables

In the **Environment** section, add all your environment variables from `.env`:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://user:password@host:port/database` | Your Supabase connection string |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase URL |
| `SUPABASE_ANON_KEY` | `your-anon-key` | Your Supabase anon key |
| `PORT` | `10000` | Render uses port 10000 by default |
| `NODE_ENV` | `production` | Set to production |
| `JWT_SECRET` | **Generate a new secure secret!** | Use a different secret than development |
| `JWT_EXPIRES_IN` | `7d` | Token expiration time |
| `ALLOWED_ORIGINS` | `https://report.comeplayapp.com,https://report-come-play.vercel.app` | Your production frontend URLs |
| `ADMIN_EMAIL` | `your-admin@email.com` | Admin email |
| `ADMIN_PASSWORD` | `your-admin-password` | Admin password |
| `ADMIN_NAME` | `Admin Name` | Admin name |
| `RESEND_API_KEY` | `your-resend-api-key` | Your Resend API key |
| `FROM_EMAIL` | `noreply@comeplayapp.com` | Verified domain email address |

### 🔐 Important Security Notes:

1. **Generate a new JWT_SECRET for production**:
   ```bash
   # Run this in your terminal to generate a secure secret:
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Update ALLOWED_ORIGINS** after deployment:
   - After your Render service is deployed, you'll get a URL like `https://report-come-play-backend.onrender.com`
   - You may want to add this to ALLOWED_ORIGINS if needed for testing
   - Keep your Vercel frontend URL in the list

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Run `npm install`
   - Run `npm start`
   - Deploy your service

3. Monitor the deployment logs for any errors

## Step 6: Verify Deployment

Once deployed, you'll get a URL like: `https://report-come-play-backend.onrender.com`

Test your API:
1. Visit `https://your-service-name.onrender.com/health`
2. You should see:
   ```json
   {
     "success": true,
     "message": "Server is healthy",
     "timestamp": "2026-01-23T13:44:34.000Z"
   }
   ```

## Step 7: Update Frontend

Update your frontend to use the new backend URL:

In your Vercel frontend environment variables:
- `NEXT_PUBLIC_API_URL=https://your-service-name.onrender.com/api`

## Common Issues & Troubleshooting

### Issue: Build Fails
- **Check logs** in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

### Issue: Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check Supabase connection pooler settings
- Ensure Supabase allows connections from Render IPs

### Issue: CORS Errors
- Verify `ALLOWED_ORIGINS` includes your Vercel URL
- Check that the URL matches exactly (no trailing slash)
- Review CORS logs in Render

### Issue: Service Sleeps (Free Tier)
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Upgrade to Starter tier for always-on service

## Auto-Deploy

Render automatically deploys when you push to your connected branch:
- Push to `main` → Automatic deployment
- Monitor deployments in the Render dashboard

## Health Checks

Render automatically monitors your service:
- Default health check: HTTP GET to `/`
- You can customize in Settings → Health Check Path
- Recommended: Set to `/health`

## Logs

View real-time logs:
1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. Monitor for errors or issues

## Scaling

To handle more traffic:
1. Go to Settings → Instance Type
2. Upgrade to Starter or higher
3. Consider horizontal scaling for high traffic

## Cost Estimate

- **Free Tier**: $0/month (sleeps after inactivity)
- **Starter**: $7/month (always-on, 512MB RAM)
- **Standard**: $25/month (2GB RAM)

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Update frontend environment variables
3. ✅ Test all API endpoints
4. ✅ Monitor logs for errors
5. ✅ Set up custom domain (optional)

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Your backend health check: `https://your-service-name.onrender.com/health`

---

**Deployment Date**: January 23, 2026  
**Backend Version**: 1.0.0  
**Database**: Supabase PostgreSQL  
**Frontend**: https://report.comeplayapp.com (Vercel)
