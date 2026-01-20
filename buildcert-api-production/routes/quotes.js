const express = require('express');
const router = express.Router();
const { calculateQuote } = require('../utils/pricing-calculator');
const axios = require('axios');

/**
 * POST /api/quotes/calculate
 * Calculate a quote and optionally add products to Pipedrive
 */
router.post('/calculate', async (req, res) => {
  try {
    const { client_category, development_type, approval_type, cost_of_works, deal_id } = req.body;

    // Calculate quote
    const quote = calculateQuote({
      client_category,
      development_type,
      approval_type,
      cost_of_works
    });

    // If deal_id provided, add products to Pipedrive
    if (deal_id && process.env.PIPEDRIVE_API_TOKEN) {
      await addProductsToPipedrive(deal_id, quote);
    }

    res.json({
      success: true,
      quote
    });

  } catch (error) {
    console.error('Quote calculation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Add products to a Pipedrive deal
 */
async function addProductsToPipedrive(dealId, quote) {
  const pipedriveUrl = `https://${process.env.PIPEDRIVE_DOMAIN}/api/v1`;
  const apiToken = process.env.PIPEDRIVE_API_TOKEN;

  // First, get or create products
  const productIds = await ensureProductsExist(quote.line_items);

  // Add each product to the deal
  for (let i = 0; i < quote.line_items.length; i++) {
    const item = quote.line_items[i];
    const productId = productIds[i];

    await axios.post(
      `${pipedriveUrl}/deals/${dealId}/products?api_token=${apiToken}`,
      {
        product_id: productId,
        item_price: item.unit_price,
        quantity: item.quantity,
        discount: 0,
        tax: item.gst_applicable ? 10 : 0,
        enabled_flag: true
      }
    );
  }

  // Update deal value
  await axios.put(
    `${pipedriveUrl}/deals/${dealId}?api_token=${apiToken}`,
    {
      value: quote.total
    }
  );
}

/**
 * Ensure all products exist in Pipedrive, create if they don't
 */
async function ensureProductsExist(lineItems) {
  const pipedriveUrl = `https://${process.env.PIPEDRIVE_DOMAIN}/api/v1`;
  const apiToken = process.env.PIPEDRIVE_API_TOKEN;
  const productIds = [];

  for (const item of lineItems) {
    // Search for existing product
    const searchResponse = await axios.get(
      `${pipedriveUrl}/products/search?term=${encodeURIComponent(item.name)}&api_token=${apiToken}`
    );

    let productId;

    if (searchResponse.data.data && searchResponse.data.data.items && searchResponse.data.data.items.length > 0) {
      // Product exists
      productId = searchResponse.data.data.items[0].item.id;
    } else {
      // Create product
      const createResponse = await axios.post(
        `${pipedriveUrl}/products?api_token=${apiToken}`,
        {
          name: item.name,
          code: item.name.replace(/\s+/g, '_').toUpperCase(),
          prices: [{
            price: item.unit_price,
            currency: 'AUD',
            cost: 0
          }],
          tax: item.gst_applicable ? 10 : 0
        }
      );
      productId = createResponse.data.data.id;
    }

    productIds.push(productId);
  }

  return productIds;
}

module.exports = router;
