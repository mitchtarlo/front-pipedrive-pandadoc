# 🚀 DEPLOYMENT GUIDE - STEP BY STEP

## Prerequisites
- GitHub account (free)
- Render account (free) - you already have: workspace `tea-d5ksih0gjchc73bokq90`

## Step 1: Upload to GitHub

### Option A: Using GitHub Desktop (Easiest)
1. Download GitHub Desktop: https://desktop.github.com
2. Sign in to your GitHub account
3. Click "File" → "Add Local Repository"
4. Select this `buildcert-api-production` folder
5. Click "Publish Repository"
6. Make it **Private**
7. Click "Publish"
8. ✅ Done! Your code is on GitHub

### Option B: Using GitHub Website
1. Go to https://github.com/new
2. Name: `buildcert-api`
3. Make it **Private**
4. Don't initialize with README
5. Click "Create repository"
6. Follow the instructions to upload this folder
7. ✅ Done!

## Step 2: Deploy to Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Click "Connect GitHub" (if not already)
4. Find your `buildcert-api` repository
5. Click "Connect"

### Configure the Service:

**Name:** `buildcert-api`

**Runtime:** `Node`

**Build Command:** 
```
npm install
```

**Start Command:**
```
npm start
```

**Instance Type:** `Free` (upgrade later if needed)

### Add Environment Variables:

Click "Advanced" → "Add Environment Variable"

**Easy Way:** Open `RENDER_ENV.txt` in the folder and copy/paste each variable

Click "Add Environment Variable" for each one:

| Key | Value |
|-----|-------|
| `PIPEDRIVE_API_TOKEN` | `your_pipedrive_api_token_here` |
| `PIPEDRIVE_CLIENT_ID` | `your_pipedrive_client_id_here` |
| `PIPEDRIVE_CLIENT_SECRET` | `your_pipedrive_client_secret_here` |
| `PIPEDRIVE_REDIRECT_URI` | `https://buildcert-api.onrender.com/oauth/callback` |
codex/review-pipedrive-oauth-installation-code-4f3xnc
| `PIPEDRIVE_DEAL_ADDRESS_FIELD` | `your_pipedrive_deal_address_field_key` |
| `PIPEDRIVE_FIELD_MAP_PATH` | `./config/pipedrive-field-map.json` |


| `PIPEDRIVE_DEAL_ADDRESS_FIELD` | `your_pipedrive_deal_address_field_key` |

| `PIPEDRIVE_DOMAIN` | `buildcert2.pipedrive.com` |
| `FRONT_API_TOKEN` | `your_front_api_token_here` |
| `NODE_ENV` | `production` |

**Important:** 
- Don't include quotes or backticks when pasting
- The full Front token is very long - copy from RENDER_ENV.txt
- These are already filled in - just copy/paste!

6. Click "Create Web Service"
7. Wait 2-3 minutes for deployment
8. ✅ Done! Your API is live!

## Step 3: Get Your API URL

After deployment completes, you'll see:
```
https://buildcert-api.onrender.com
```

**Save this URL!** You'll need it for the next steps.

## Step 4: Install Pipedrive Custom Panel

1. Go to Pipedrive → Settings → Apps & Integrations
2. Click "Custom Apps" → "Create Custom App"
3. Name: `Buildcert Project Panel`
4. App Type: `Panel`
5. Panel URL:
```
https://buildcert-api.onrender.com/pipedrive-panel
```
6. OAuth Callback URL (Marketplace installs):
```
https://buildcert-api.onrender.com/oauth/callback
```
7. Where to show: `Deal Detail View`
8. Click "Save"
9. ✅ Done! Panel appears in all deals

## Step 5: Install Front Sidebar Plugin

1. Go to Front → Settings → Plugins
2. Click "Create Plugin"
3. Name: `Buildcert Email Extractor`
4. Plugin URL:
```
https://buildcert-api.onrender.com/front-sidebar?conversation_id={conversationId}
```
5. Where to show: `Conversation Sidebar`
6. Click "Save"
7. ✅ Done! Sidebar appears in all emails

## 🎉 TESTING

### Test Quote Calculation:
1. Open any deal in Pipedrive
2. Look for "Buildcert Project Panel" on the right
3. Fill in:
   - Client Category: Gold
   - Development Type: Swimming Pool
   - Approval Type: CDC
   - Value of Works: 50000
4. Click "Calculate Quote"
5. Products should appear in the deal!

### Test Front Extraction:
1. Open any email conversation in Front
2. Look for "Buildcert Email Extractor" in sidebar
3. It will automatically extract available data
4. Click "Create Lead in Pipedrive"
5. Lead should be created!

### Test Planning Portal:
1. In Pipedrive panel
2. Enter address: `46 Diana Street, Wallsend NSW 2287`
3. Click "Run CDC Red Flag Check"
4. Should show zoning, bushfire, heritage data

## 🆘 TROUBLESHOOTING

### "Build Failed" on Render
- Check that you uploaded ALL files
- Make sure `package.json` is in the root folder

### "Environment variables not found"
- Go to Render dashboard → Your service → Environment
- Make sure all 4 variables are set correctly

### Pipedrive panel doesn't appear
- Make sure you used the correct URL with `{dealId}`
- Check that the app is enabled in Pipedrive settings

### Front sidebar doesn't appear
- Make sure you used the correct URL with `{conversationId}`
- Check that the plugin is enabled in Front settings

## 📞 NEED HELP?

If something doesn't work:
1. Check Render logs: Dashboard → Your service → Logs
2. Check browser console: Right-click → Inspect → Console
3. Make sure all environment variables are set

---

**Total Time:** 15-20 minutes
**Cost:** $0 (Free tier on Render)
