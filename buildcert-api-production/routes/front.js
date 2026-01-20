const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * POST /api/front/extract-email
 * Extract data from a Front email conversation
 */
router.post('/extract-email', async (req, res) => {
  try {
    const { conversation_id } = req.body;

    if (!conversation_id) {
      return res.status(400).json({
        success: false,
        error: 'conversation_id is required'
      });
    }

    // Get conversation from Front
    const frontUrl = 'https://api2.frontapp.com';
    const headers = {
      'Authorization': `Bearer ${process.env.FRONT_API_TOKEN}`,
      'Accept': 'application/json'
    };

    const conversationResponse = await axios.get(
      `${frontUrl}/conversations/${conversation_id}`,
      { headers }
    );

    const conversation = conversationResponse.data;

    // Get the latest message
    const messagesResponse = await axios.get(
      `${frontUrl}/conversations/${conversation_id}/messages`,
      { headers }
    );

    const messages = messagesResponse.data._results || [];
    const latestMessage = messages[messages.length - 1];

    // Extract data
    const extracted = extractDataFromEmail(conversation, latestMessage);

    res.json({
      success: true,
      data: extracted
    });

  } catch (error) {
    console.error('Front extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/front/create-lead
 * Create a Pipedrive lead from extracted Front data
 */
router.post('/create-lead', async (req, res) => {
  try {
    const { name, email, address, project_type, phone } = req.body;

    const pipedriveUrl = `https://${process.env.PIPEDRIVE_DOMAIN}/api/v1`;
    const apiToken = process.env.PIPEDRIVE_API_TOKEN;

    // Create or find person
    let personId;
    
    if (email) {
      const searchResponse = await axios.get(
        `${pipedriveUrl}/persons/search?term=${encodeURIComponent(email)}&api_token=${apiToken}`
      );

      if (searchResponse.data.data && searchResponse.data.data.items && searchResponse.data.data.items.length > 0) {
        personId = searchResponse.data.data.items[0].item.id;
      } else {
        // Create person
        const personResponse = await axios.post(
          `${pipedriveUrl}/persons?api_token=${apiToken}`,
          {
            name: name || email,
            email: [{ value: email, primary: true }],
            phone: phone ? [{ value: phone, primary: true }] : []
          }
        );
        personId = personResponse.data.data.id;
      }
    }

    // Create lead
    const leadResponse = await axios.post(
      `${pipedriveUrl}/leads?api_token=${apiToken}`,
      {
        title: `${name || 'Unknown'} - ${project_type || 'Enquiry'}`,
        person_id: personId,
        value: {
          amount: 0,
          currency: 'AUD'
        }
      }
    );

    const leadId = leadResponse.data.data.id;

    // Add note with extracted info
    const noteContent = `
**Extracted from Front email:**

**Property Address:** ${address || 'Not provided'}
**Project Type:** ${project_type || 'Not specified'}
**Contact:** ${name || 'Not provided'}
**Email:** ${email || 'Not provided'}
**Phone:** ${phone || 'Not provided'}
    `.trim();

    await axios.post(
      `${pipedriveUrl}/notes?api_token=${apiToken}`,
      {
        content: noteContent,
        lead_id: leadId
      }
    );

    res.json({
      success: true,
      lead_id: leadId,
      person_id: personId
    });

  } catch (error) {
    console.error('Lead creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Extract relevant data from email content
 */
function extractDataFromEmail(conversation, message) {
  const subject = conversation.subject || '';
  const body = message ? (message.body || message.text || '') : '';
  const fullText = `${subject}\n${body}`;

  // Extract contact info
  const recipient = conversation.recipient || {};
  const name = recipient.name || extractName(fullText);
  const email = recipient.handle || extractEmail(fullText);
  const phone = extractPhone(fullText);

  // Extract property address
  const address = extractAddress(fullText);

  // Extract project type
  const project_type = extractProjectType(fullText);

  // Extract Lot/DP
  const lotDp = extractLotDP(fullText);

  return {
    name: name || null,
    email: email || null,
    phone: phone || null,
    address: address || null,
    project_type: project_type || null,
    lot: lotDp.lot || null,
    dp: lotDp.dp || null,
    raw_subject: subject,
    raw_body: body.substring(0, 500) // First 500 chars
  };
}

function extractName(text) {
  // Simple name extraction - look for common patterns
  const patterns = [
    /(?:Name|Client|Contact):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractEmail(text) {
  const match = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  return match ? match[0] : null;
}

function extractPhone(text) {
  const patterns = [
    /(?:Phone|Mobile|Tel):\s*(\+?61\s?[2-478](?:[ -]?[0-9]){8})/i,
    /(?:Phone|Mobile|Tel):\s*(0[2-478](?:[ -]?[0-9]){8})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractAddress(text) {
  const patterns = [
    /(?:Address|Property|Site):\s*([0-9]+\s+[A-Za-z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Court|Ct|Place|Pl|Lane|Ln|Way),?\s+[A-Z][a-z]+,?\s+NSW\s+\d{4})/i,
    /([0-9]+\s+[A-Za-z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Court|Ct|Place|Pl|Lane|Ln|Way),?\s+[A-Z][a-z]+,?\s+NSW\s+\d{4})/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractProjectType(text) {
  const types = [
    'swimming pool',
    'pool',
    'shed',
    'granny flat',
    'secondary dwelling',
    'alterations and additions',
    'alterations & additions',
    'alts and adds',
    'new dwelling',
    'new home',
    'renovation',
    'extension',
    'deck',
    'carport',
    'garage'
  ];

  const lowerText = text.toLowerCase();
  for (const type of types) {
    if (lowerText.includes(type)) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }
  return null;
}

function extractLotDP(text) {
  const lotMatch = text.match(/Lot\s+(\d+)/i);
  const dpMatch = text.match(/DP\s+(\d+)/i);
  
  return {
    lot: lotMatch ? lotMatch[1] : null,
    dp: dpMatch ? dpMatch[1] : null
  };
}

module.exports = router;
