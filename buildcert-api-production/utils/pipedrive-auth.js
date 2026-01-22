const jwt = require('jsonwebtoken');
const { getAccessToken } = require('./pipedrive-oauth-store');

function getJwtSecret() {
  return process.env.PIPEDRIVE_JWT_SECRET || process.env.PIPEDRIVE_CLIENT_SECRET;
}

function extractJwt(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return (
    req.query.token ||
    req.headers['x-pipedrive-token'] ||
    req.body?.pipedrive_jwt ||
    null
  );
}

function verifyJwt(token) {
  const secret = getJwtSecret();
  if (!secret || !token) {
    return null;
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Invalid Pipedrive JWT token:', error);
    return null;
  }
}

async function getPipedriveAuth(req) {
  const token = extractJwt(req);
  const jwtPayload = token ? verifyJwt(token) : null;

  if (jwtPayload?.company_id) {
    const clientId = process.env.PIPEDRIVE_CLIENT_ID;
    const clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET;
    const installation = await getAccessToken(
      String(jwtPayload.company_id),
      clientId,
      clientSecret
    );

    if (installation?.accessToken && installation?.apiDomain) {
      return {
        mode: 'oauth',
        baseUrl: `${installation.apiDomain}/api/v1`,
        headers: {
          Authorization: `Bearer ${installation.accessToken}`
        },
        companyId: jwtPayload.company_id,
        userId: jwtPayload.user_id
      };
    }
  }

  if (process.env.PIPEDRIVE_API_TOKEN && process.env.PIPEDRIVE_DOMAIN) {
    return {
      mode: 'api_token',
      baseUrl: `https://${process.env.PIPEDRIVE_DOMAIN}/api/v1`,
      apiToken: process.env.PIPEDRIVE_API_TOKEN
    };
  }

  return null;
}

function buildPipedriveUrl(auth, path) {
  if (auth.mode === 'api_token') {
    const separator = path.includes('?') ? '&' : '?';
    return `${auth.baseUrl}${path}${separator}api_token=${auth.apiToken}`;
  }

  return `${auth.baseUrl}${path}`;
}

module.exports = {
  extractJwt,
  getPipedriveAuth,
  buildPipedriveUrl
};
