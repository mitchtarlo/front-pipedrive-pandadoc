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

    res.json({
      success: true,
      deal: response.data.data
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
