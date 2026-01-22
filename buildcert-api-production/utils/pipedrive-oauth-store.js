const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STORE_PATH =
  process.env.PIPEDRIVE_OAUTH_STORE_PATH ||
  path.join(__dirname, '..', 'config', 'pipedrive-oauth-store.json');

const installations = new Map();

function loadInstallations() {
  if (!fs.existsSync(STORE_PATH)) {
    return;
  }

  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([companyId, installation]) => {
      if (installation && installation.companyId) {
        installations.set(String(companyId), installation);
      }
    });
  } catch (error) {
    console.warn('Failed to load Pipedrive OAuth installations.', error);
  }
}

function persistInstallations() {
  try {
    const directory = path.dirname(STORE_PATH);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    const data = Object.fromEntries(installations.entries());
    const tmpPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    fs.renameSync(tmpPath, STORE_PATH);
  } catch (error) {
    console.warn('Failed to persist Pipedrive OAuth installations.', error);
  }
}

loadInstallations();

function normalizeCompanyId(companyId) {
  if (companyId === null || companyId === undefined) {
    return null;
  }
  return String(companyId);
}

function storeInstallation({
  companyId,
  userId,
  accessToken,
  refreshToken,
  expiresIn,
  apiDomain,
  scope
}) {
  const normalizedCompanyId = normalizeCompanyId(companyId);
  if (!normalizedCompanyId) {
    throw new Error('Missing companyId for OAuth installation.');
  }

  const expiresAt = Date.now() + Math.max(expiresIn - 60, 0) * 1000;
  installations.set(normalizedCompanyId, {
    companyId: normalizedCompanyId,
    userId,
    accessToken,
    refreshToken,
    expiresAt,
    apiDomain,
    scope
  });

  persistInstallations();
}

function getInstallation(companyId) {
  const normalizedCompanyId = normalizeCompanyId(companyId);
  if (!normalizedCompanyId) {
    return null;
  }
  return installations.get(normalizedCompanyId) || null;
}

async function refreshAccessToken(installation, clientId, clientSecret) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: installation.refreshToken
  });

  const response = await axios.post(
    'https://oauth.pipedrive.com/oauth/token',
    params.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: {
        username: clientId,
        password: clientSecret
      }
    }
  );

  const tokenData = response.data;
  storeInstallation({
    companyId: installation.companyId,
    userId: installation.userId,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    apiDomain: tokenData.api_domain,
    scope: tokenData.scope
  });

  return installations.get(String(installation.companyId));
}

async function getAccessToken(companyId, clientId, clientSecret) {
  const installation = getInstallation(companyId);
  if (!installation) {
    return null;
  }

  if (Date.now() >= installation.expiresAt) {
    if (!clientId || !clientSecret) {
      throw new Error('Missing Pipedrive OAuth client credentials.');
    }
    return refreshAccessToken(installation, clientId, clientSecret);
  }

  return installation;
}

module.exports = {
  storeInstallation,
  getAccessToken
};
