# Hostinger aaPanel Deployment Instructions

## Step 1: Upload Files

1. Upload the built `client/dist/` folder contents to: `/www/wwwroot/<your-project>/client/dist/`
2. Upload the server files to: `/www/wwwroot/<your-project>/server/`

## Step 2: Configure Nginx

1. Log into aaPanel
2. Go to **Website** → **Your Domain** → **Config** → **Configuration File**
3. Replace the content with the configuration from `nginx-config-hostinger.conf`
4. Replace `<FRONTEND_DOMAIN>` with your actual domain (e.g., `aashish.posttrr.com`)
5. Replace `<project>` with your actual project folder name
6. Save and reload Nginx

## Step 3: Start Node.js Backend

1. In aaPanel, go to **Node.js Project Manager**
2. Create new project:
   - **Project Path**: `/www/wwwroot/<your-project>/server/`
   - **Startup File**: `dist/server/index.mjs`
   - **Port**: `8003`
3. Install dependencies: `npm install`
4. Start the application

## Step 4: SSL Certificate (Optional but Recommended)

1. In aaPanel, go to **SSL** → **Let's Encrypt**
2. Add your domain and generate SSL certificate
3. Enable force HTTPS redirect

## Step 5: Test the Deployment

Run these tests after deployment:

```bash
# Test backend directly
curl http://127.0.0.1:8003/api/ping

# Test through Nginx proxy
curl https://your-domain.com/api/ping

# Test frontend
curl https://your-domain.com/
```

## Environment Variables

Make sure these environment variables are set in aaPanel Node.js manager:

- `NODE_ENV=production`
- `PORT=8003`
- `MONGO_URI=mongodb+srv://Aashishpropeorty:SATYAKA123@property.zn2cowc.mongodb.net/`

## Troubleshooting

- **502 Bad Gateway**: Backend not running or wrong port
- **404 for /api routes**: Nginx proxy configuration issue
- **CORS errors**: Check backend CORS configuration
- **React Router 404s**: Missing SPA fallback in Nginx
