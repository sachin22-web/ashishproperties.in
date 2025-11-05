# Production Deployment Checklist for Hostinger

## Pre-Deployment Build

- [x] ✅ Frontend build configured with `/api` base URL
- [x] ✅ Nginx configuration ready with reverse proxy
- [x] ✅ Backend CORS updated for `aashish.posttrr.com`
- [x] ✅ All files built successfully

## Deployment Steps

### 1. Upload Frontend

```bash
# Upload contents of client/dist/ to:
# /www/wwwroot/<project>/client/dist/
```

### 2. Upload Backend

```bash
# Upload dist/server/ contents to:
# /www/wwwroot/<project>/server/
```

### 3. Configure Nginx

- Apply `nginx-config-hostinger.conf` to your domain configuration
- Replace `<FRONTEND_DOMAIN>` with `aashish.posttrr.com`
- Replace `<project>` with your actual project folder name
- Reload Nginx

### 4. Start Node.js Backend

- Set up in aaPanel Node.js Manager
- Port: 8003
- Startup file: `dist/server/index.mjs`
- Environment: `NODE_ENV=production`

## Post-Deployment Tests

### Test 1: Backend Health Check (Localhost)

```bash
curl http://127.0.0.1:8003/api/ping
# Expected: 200 OK with server info
```

### Test 2: Backend Health Check (Through Nginx)

```bash
curl https://aashish.posttrr.com/api/ping
# Expected: 200 OK with CORS info
```

### Test 3: Frontend Loading

```bash
curl -I https://aashish.posttrr.com/
# Expected: 200 OK, content-type: text/html
```

### Test 4: SPA Routing Test

```bash
curl -I https://aashish.posttrr.com/properties
# Expected: 200 OK (should serve index.html)
```

### Test 5: CORS Test

```bash
curl -H "Origin: https://aashish.posttrr.com" https://aashish.posttrr.com/api/ping
# Expected: 200 OK with Access-Control-Allow-Origin header
```

### Test 6: Authentication Test

```bash
curl -X POST https://aashish.posttrr.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
# Expected: Response (200/400/401) with proper CORS headers
```

## Smoke Test Results

After each test, document the result:

- [ ] Test 1 (Backend localhost): ❌/✅
- [ ] Test 2 (Backend through Nginx): ❌/✅
- [ ] Test 3 (Frontend loading): ❌/✅
- [ ] Test 4 (SPA routing): ❌/✅
- [ ] Test 5 (CORS): ❌/✅
- [ ] Test 6 (Authentication): ❌/✅

## Troubleshooting Guide

### 502 Bad Gateway

- Check if Node.js backend is running on port 8003
- Verify aaPanel Node.js service status
- Check server logs in aaPanel

### 404 for /api routes

- Verify Nginx configuration applied correctly
- Check proxy_pass points to `http://127.0.0.1:8003/`
- Reload Nginx configuration

### CORS Errors

- Check browser console for exact error
- Verify origin matches `aashish.posttrr.com`
- Check backend logs for CORS rejection messages

### React Router 404s

- Verify `try_files $uri /index.html;` in Nginx
- Check frontend build contains `index.html`

## Final Checklist

- [ ] SSL certificate active for `aashish.posttrr.com`
- [ ] HTTP to HTTPS redirect working
- [ ] All API endpoints returning proper responses
- [ ] Frontend loads and navigates correctly
- [ ] Authentication flow works end-to-end
- [ ] No console errors in browser
- [ ] Performance metrics acceptable (< 3s load time)

## Environment Variables to Set in aaPanel

```
NODE_ENV=production
PORT=8003
MONGO_URI=mongodb+srv://Aashishpropeorty:SATYAKA123@property.zn2cowc.mongodb.net/
```
