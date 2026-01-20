const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * POST /api/planning-portal/check
 * Query NSW Planning Portal for property data
 */
router.post('/check', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    // Step 1: Geocode the address
    const coordinates = await geocodeAddress(address);
    
    if (!coordinates) {
      return res.status(404).json({
        success: false,
        error: 'Could not geocode address'
      });
    }

    // Step 2: Query planning layers
    const planningData = await queryPlanningLayers(coordinates);

    res.json({
      success: true,
      data: {
        address,
        coordinates,
        ...planningData
      }
    });

  } catch (error) {
    console.error('Planning portal error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Geocode an address to lat/lon
 */
async function geocodeAddress(address) {
  try {
    // Use NSW Spatial Services Address API
    const response = await axios.get('https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Geocoded_Addressing_Theme/MapServer/find', {
      params: {
        searchText: address,
        contains: 'true',
        searchFields: 'address',
        sr: '4326',
        layers: '0',
        returnGeometry: 'true',
        f: 'json'
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.geometry.y,
        lon: result.geometry.x
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

/**
 * Query planning portal layers for property data
 */
async function queryPlanningLayers(coordinates) {
  const baseUrl = 'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services';
  const { lat, lon } = coordinates;
  const geometry = `${lon},${lat}`;

  const queries = [
    // Zoning
    {
      key: 'zoning',
      url: `${baseUrl}/Planning/EPI_Primary_Planning_Layers/MapServer/2/query`,
      fields: ['SYM_CODE', 'LAY_CLASS', 'LGA_NAME']
    },
    // Bushfire
    {
      key: 'bushfire',
      url: `${baseUrl}/ePlanning/Planning_Portal_Hazard/MapServer/229/query`,
      fields: ['Category', 'd_Category', 'certified_date']
    },
    // Heritage
    {
      key: 'heritage',
      url: `${baseUrl}/Planning/EPI_Primary_Planning_Layers/MapServer/0/query`,
      fields: ['HER_NAME', 'HER_NUMBER']
    }
  ];

  const results = {};

  for (const query of queries) {
    try {
      const response = await axios.get(query.url, {
        params: {
          geometry,
          geometryType: 'esriGeometryPoint',
          inSR: '4326',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: query.fields.join(','),
          returnGeometry: 'false',
          f: 'json'
        },
        timeout: 10000
      });

      if (response.data.features && response.data.features.length > 0) {
        const attributes = response.data.features[0].attributes;
        results[query.key] = attributes;
      } else {
        results[query.key] = null;
      }
    } catch (error) {
      console.error(`Error querying ${query.key}:`, error.message);
      results[query.key] = { error: error.message };
    }
  }

  // Format the response
  return {
    zone: results.zoning ? results.zoning.SYM_CODE : 'Unknown',
    zone_description: results.zoning ? results.zoning.LAY_CLASS : 'Unknown',
    lga: results.zoning ? results.zoning.LGA_NAME : 'Unknown',
    bushfire: results.bushfire ? (results.bushfire.Category || results.bushfire.d_Category || 'No') : 'No',
    bushfire_date: results.bushfire ? results.bushfire.certified_date : null,
    heritage: results.heritage ? results.heritage.HER_NAME : 'No',
    heritage_number: results.heritage ? results.heritage.HER_NUMBER : null,
    lot: 'Manual entry required',
    section: 'Manual entry required',
    dp: 'Manual entry required'
  };
}

module.exports = router;
