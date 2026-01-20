const pricingConfig = require('../pricing-config.json');

/**
 * Calculate quote based on inputs
 * @param {Object} params - Quote parameters
 * @param {string} params.client_category - Client category (Platinum/Gold/Silver/Bronze/Ruby)
 * @param {string} params.development_type - Type of development
 * @param {string} params.approval_type - CDC or CC
 * @param {number} params.cost_of_works - Construction value
 * @returns {Object} Quote breakdown with line items
 */
function calculateQuote(params) {
  const { client_category, development_type, approval_type, cost_of_works } = params;
  
  // Validate inputs
  if (!client_category || !development_type || !approval_type || cost_of_works === undefined) {
    throw new Error('Missing required parameters');
  }

  // Find matching pricing rule
  const matchingRule = pricingConfig.pricing_rules.find(rule => {
    return (
      rule.client_category === client_category &&
      rule.development_type === development_type &&
      rule.approval_type === approval_type &&
      cost_of_works >= rule.value_min &&
      cost_of_works <= rule.value_max
    );
  });

  if (!matchingRule) {
    throw new Error(`No pricing rule found for: ${client_category} / ${development_type} / ${approval_type} / $${cost_of_works}`);
  }

  // Calculate line items
  const lineItems = [];

  // 1. Assessment Fee
  lineItems.push({
    name: `${approval_type} Assessment`,
    description: `${development_type} - ${client_category}`,
    quantity: 1,
    unit_price: matchingRule.assessment_fee,
    subtotal: matchingRule.assessment_fee,
    gst_applicable: true
  });

  // 2. NSW Application Fee (GST-free)
  lineItems.push({
    name: 'NSW Government Application Fee',
    description: 'Statutory fee',
    quantity: 1,
    unit_price: pricingConfig.nsw_fees.application_fee,
    subtotal: pricingConfig.nsw_fees.application_fee,
    gst_applicable: false
  });

  // 3. NSW Archival Fee (GST-free)
  lineItems.push({
    name: 'NSW Government Archival Fee',
    description: 'Statutory fee',
    quantity: pricingConfig.nsw_fees.archival_quantity,
    unit_price: pricingConfig.nsw_fees.archival_fee,
    subtotal: pricingConfig.nsw_fees.archival_fee * pricingConfig.nsw_fees.archival_quantity,
    gst_applicable: false
  });

  // 4. Inspections
  if (matchingRule.inspection_count > 0) {
    const inspectionTotal = matchingRule.inspection_count * matchingRule.inspection_unit_price;
    lineItems.push({
      name: 'Inspections',
      description: `${matchingRule.inspection_count} mandatory critical inspections`,
      quantity: matchingRule.inspection_count,
      unit_price: matchingRule.inspection_unit_price,
      subtotal: inspectionTotal,
      gst_applicable: true
    });
  }

  // 5. Occupation Certificate
  if (matchingRule.oc_fee > 0) {
    lineItems.push({
      name: 'Occupation Certificate',
      description: 'Final OC upon completion',
      quantity: 1,
      unit_price: matchingRule.oc_fee,
      subtotal: matchingRule.oc_fee,
      gst_applicable: true
    });
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const gstableAmount = lineItems
    .filter(item => item.gst_applicable)
    .reduce((sum, item) => sum + item.subtotal, 0);
  const gst = gstableAmount * pricingConfig.gst_rate;
  const total = subtotal + gst;

  return {
    line_items: lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    total: Math.round(total * 100) / 100,
    metadata: {
      client_category,
      development_type,
      approval_type,
      cost_of_works,
      pricing_rule_used: {
        value_range: matchingRule.value_range_display,
        assessment_fee: matchingRule.assessment_fee,
        inspection_count: matchingRule.inspection_count
      }
    }
  };
}

module.exports = { calculateQuote };
