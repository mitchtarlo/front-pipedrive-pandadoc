const express = require('express');
const router = express.Router();
const { calculateQuote } = require('../utils/pricing-calculator');
const axios = require('axios');
const { getPipedriveAuth, buildPipedriveUrl } = require('../utils/pipedrive-auth');

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
    if (deal_id) {
      const auth = await getPipedriveAuth(req);
      if (!auth) {
        return res.status(401).json({
          success: false,
          error: 'Missing Pipedrive authentication.'
        });
      }
      await addProductsToPipedrive(deal_id, quote, auth);
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
async function addProductsToPipedrive(dealId, quote, auth) {
  // First, get or create products
  const productIds = await ensureProductsExist(quote.line_items, auth);

  // Add each product to the deal
  for (let i = 0; i < quote.line_items.length; i++) {
    const item = quote.line_items[i];
    const productId = productIds[i];

    await axios.post(
      buildPipedriveUrl(auth, `/deals/${dealId}/products`),
      {
        product_id: productId,
        item_price: item.unit_price,
        quantity: item.quantity,
        discount: 0,
        tax: item.gst_applicable ? 10 : 0,
        enabled_flag: true
      },
      {
        headers: auth.headers
      }
    );
  }

  // Update deal value
  await axios.put(
    buildPipedriveUrl(auth, `/deals/${dealId}`),
    {
      value: quote.total
    },
    {
      headers: auth.headers
    }
  );
}

/**
 * Ensure all products exist in Pipedrive, create if they don't
 */
async function ensureProductsExist(lineItems, auth) {
  const productIds = [];

  for (const item of lineItems) {
    // Search for existing product
    const searchResponse = await axios.get(
      buildPipedriveUrl(
        auth,
        `/products/search?term=${encodeURIComponent(item.name)}`
      ),
      {
        headers: auth.headers
      }
    );

    let productId;

    if (searchResponse.data.data && searchResponse.data.data.items && searchResponse.data.data.items.length > 0) {
      // Product exists
      productId = searchResponse.data.data.items[0].item.id;
    } else {
      // Create product
      const createResponse = await axios.post(
        buildPipedriveUrl(auth, '/products'),
        {
          name: item.name,
          code: item.name.replace(/\s+/g, '_').toUpperCase(),
          prices: [{
            price: item.unit_price,
            currency: 'AUD',
            cost: 0
          }],
          tax: item.gst_applicable ? 10 : 0
        },
        {
          headers: auth.headers
        }
      );
      productId = createResponse.data.data.id;
    }

    productIds.push(productId);
  }

  return productIds;
}

module.exports = router;
