const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getPipedriveAuth, buildPipedriveUrl } = require('../utils/pipedrive-auth');

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

    res.json({
      success: true,
      deal,
      organization,
      person,
      address
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
