const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getPipedriveAuth, buildPipedriveUrl } = require('../utils/pipedrive-auth');

const fieldMapPath =
  process.env.PIPEDRIVE_FIELD_MAP_PATH ||
  path.join(__dirname, '..', 'config', 'pipedrive-field-map.json');

let cachedFieldMap = null;

function loadFieldMap() {
  if (cachedFieldMap) {
    return cachedFieldMap;
  }

  try {
    const raw = fs.readFileSync(fieldMapPath, 'utf8');
    cachedFieldMap = JSON.parse(raw);
  } catch (error) {
    console.warn('⚠️ Unable to load Pipedrive field map:', error.message);
    cachedFieldMap = {};
  }

  return cachedFieldMap;
}

function resolveMappedFields(source, mapping = {}) {
  return Object.entries(mapping).reduce((acc, [key, fieldId]) => {
    if (!fieldId) {
      return acc;
    }
    const value = source?.[fieldId];
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
}

/**
 * GET /api/pipedrive/deal/:id
 * Get deal details from Pipedrive
 */
router.get('/deal/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const auth = await getPipedriveAuth(req);

    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Missing Pipedrive authentication.'
      });
    }

    const response = await axios.get(buildPipedriveUrl(auth, `/deals/${id}`), {
      headers: auth.headers
    });

    const deal = response.data.data;
    const fieldMap = loadFieldMap();
    const addressFieldKey = process.env.PIPEDRIVE_DEAL_ADDRESS_FIELD;
    let address =
      (addressFieldKey && deal?.[addressFieldKey]) || deal?.address || deal?.location;

    let organization = null;
    let person = null;

    const organizationId =
      typeof deal?.org_id === 'object' ? deal?.org_id?.value : deal?.org_id;
    const personId =
      typeof deal?.person_id === 'object' ? deal?.person_id?.value : deal?.person_id;

    if (organizationId) {
      const organizationResponse = await axios.get(
        buildPipedriveUrl(auth, `/organizations/${organizationId}`),
        { headers: auth.headers }
      );
      organization = organizationResponse.data?.data || null;
      address = address || organization?.address || organization?.address_formatted;
    }

    if (personId) {
      const personResponse = await axios.get(
        buildPipedriveUrl(auth, `/persons/${personId}`),
        { headers: auth.headers }
      );
      person = personResponse.data?.data || null;
      address = address || person?.address || person?.address_formatted;
    }

    const mappedFields = {
      ...resolveMappedFields(deal, fieldMap.deal),
      ...resolveMappedFields(organization, fieldMap.organization),
      ...resolveMappedFields(person, fieldMap.person)
    };

    res.json({
      success: true,
      deal,
      organization,
      person,
      address,
      fields: mappedFields
    });

  } catch (error) {
    console.error('Pipedrive deal fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pipedrive/deal/:id/products
 * Get products attached to a deal
 */
router.get('/deal/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const auth = await getPipedriveAuth(req);

    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Missing Pipedrive authentication.'
      });
    }

    const response = await axios.get(
      buildPipedriveUrl(auth, `/deals/${id}/products`),
      {
        headers: auth.headers
      }
    );

    res.json({
      success: true,
      products: response.data.data || []
    });

  } catch (error) {
    console.error('Pipedrive products fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
