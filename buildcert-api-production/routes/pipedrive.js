const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * GET /api/pipedrive/deal/:id
 * Get deal details from Pipedrive
 */
router.get('/deal/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pipedriveUrl = `https://${process.env.PIPEDRIVE_DOMAIN}/api/v1`;
    const apiToken = process.env.PIPEDRIVE_API_TOKEN;

    const response = await axios.get(
      `${pipedriveUrl}/deals/${id}?api_token=${apiToken}`
    );

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
    const pipedriveUrl = `https://${process.env.PIPEDRIVE_DOMAIN}/api/v1`;
    const apiToken = process.env.PIPEDRIVE_API_TOKEN;

    const response = await axios.get(
      `${pipedriveUrl}/deals/${id}/products?api_token=${apiToken}`
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
