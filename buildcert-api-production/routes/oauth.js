const express = require('express');
const router = express.Router();

/**
 * GET /oauth/callback
 * Handle Pipedrive OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('Authorization code missing');
    }

    // For a private app, we don't actually need to exchange the code
    // Just redirect to success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Buildcert App Installed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
          }
          h1 {
            color: #4169E1;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .success-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #4169E1;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Buildcert App Installed!</h1>
          <p>The Buildcert Project Panel has been successfully installed. You can now close this window and return to Pipedrive.</p>
          <p>The custom panel will appear in your deal detail views.</p>
          <a href="https://buildcert2.pipedrive.com" class="btn">Go to Pipedrive</a>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Installation failed');
  }
});

module.exports = router;
