# Buildcert Automation API

Complete automation system for quote generation, Pipedrive integration, Front email extraction, and NSW Planning Portal checks.

## 🚀 Quick Start

### 1. Deploy to Render

1. Create a GitHub repository
2. Upload this entire folder to GitHub
3. Go to [Render.com](https://render.com)
4. Click "New +" → "Web Service"
5. Connect your GitHub repository
6. Configure:
   - **Name:** `buildcert-api`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or upgrade later)

### 2. Set Environment Variables in Render

Go to your service → Environment → Add environment variables:

```
PIPEDRIVE_API_TOKEN=your_pipedrive_api_token_here
PIPEDRIVE_CLIENT_ID=your_pipedrive_client_id_here
PIPEDRIVE_CLIENT_SECRET=your_pipedrive_client_secret_here
PIPEDRIVE_REDIRECT_URI=https://buildcert-api.onrender.com/oauth/callback

PIPEDRIVE_DEAL_ADDRESS_FIELD=your_pipedrive_deal_address_field_key

PIPEDRIVE_DOMAIN=buildcert2.pipedrive.com
FRONT_API_TOKEN=your_front_api_token_here
PORT=3000
NODE_ENV=production
```

### 3. Deploy!

Click "Create Web Service" and Render will deploy automatically.

Your API will be live at: `https://buildcert-api.onrender.com`

## 📦 What's Included

### 1. **Quote Calculation Engine**
- Automatically calculates quotes based on 128 pricing rules
- Adds products to Pipedrive deals
- Updates deal values

### 2. **Pipedrive Custom Panel**
- Embedded panel in Pipedrive deals
- Calculate quotes with dropdown selections
- Run NSW Planning Portal checks
- View quote line items
- One-click PandaDoc quote creation

### 3. **Front Sidebar Plugin**
- Extract data from emails automatically
- Editable extracted data
- Create Pipedrive leads with one click

### 4. **NSW Planning Portal Integration**
- Query property data by address
- Returns: Zoning, Bushfire, Heritage, LGA
- Geocoding included

## 🔗 API Endpoints

### Quote Calculation
```
POST /api/quotes/calculate
{
  "client_category": "Gold",
  "development_type": "Swimming Pool",
  "approval_type": "CDC",
  "cost_of_works": 50000,
  "deal_id": "optional-pipedrive-deal-id"
}
```

### Planning Portal Check
```
POST /api/planning-portal/check
{
  "address": "46 Diana Street, Wallsend NSW 2287"
}
```

### Front Email Extraction
```
POST /api/front/extract-email
{
  "conversation_id": "cnv_123abc"
}
```

### Create Pipedrive Lead
```
POST /api/front/create-lead
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "0412345678",
  "address": "46 Diana Street, Wallsend NSW 2287",
  "project_type": "Swimming Pool"
}
```

## 🎨 Frontend Plugins

### Pipedrive Custom Panel
Access at: `https://buildcert-api.onrender.com/pipedrive-panel`

To install in Pipedrive:
1. Go to Settings → Apps & Integrations → Custom Apps
2. Create new app
3. Add URL: `https://buildcert-api.onrender.com/pipedrive-panel`
   - Pipedrive app extensions append required query parameters (token, id, selectedIds).
   - The server validates the JWT using `PIPEDRIVE_CLIENT_SECRET` (or `PIPEDRIVE_JWT_SECRET` if set).
4. For Marketplace OAuth installs, set the callback URL to `https://buildcert-api.onrender.com/oauth/callback` and
   ensure `PIPEDRIVE_CLIENT_ID`, `PIPEDRIVE_CLIENT_SECRET`, and `PIPEDRIVE_REDIRECT_URI` are configured.

### Front Sidebar
Access at: `https://buildcert-api.onrender.com/front-sidebar?conversation_id=cnv_123`

To install in Front:
1. Go to Settings → Plugins → Custom Plugins
2. Add new plugin
3. Add URL: `https://buildcert-api.onrender.com/front-sidebar?conversation_id={conversationId}`

## 📊 Pricing Configuration

Pricing rules are stored in `pricing-config.json` with 128 rules covering:
- **Client Categories:** Platinum, Gold, Silver, Bronze, Ruby
- **Development Types:** Single Dwelling, Alterations & Additions, Swimming Pool, Shed, Secondary Dwelling
- **Approval Types:** CDC, CC
- **Value Ranges:** Multiple brackets per development type

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📝 Development

Run locally:
```bash
npm install
npm run dev
```

Access at: `http://localhost:3000`

## 🔒 Security

- All API keys stored as environment variables
- CORS enabled for Front and Pipedrive domains
- No sensitive data in code
- Pipedrive panel requests are JWT-validated using `PIPEDRIVE_CLIENT_SECRET` (or `PIPEDRIVE_JWT_SECRET`)

## 📞 Support

For issues or questions, refer to the technical documentation in this repository.

---

**Built for Buildcert** | Version 1.0.0 | January 2026
