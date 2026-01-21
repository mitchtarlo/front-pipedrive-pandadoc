# Buildcert Automation Review

## Scope and limitations
- I reviewed the repository source and documentation for the Buildcert automation service, including the API routes, pricing engine, and the two embedded UI panels (Pipedrive and Front).【F:server.js†L1-L63】【F:routes/quotes.js†L1-L113】【F:routes/pipedrive.js†L1-L57】【F:routes/front.js†L1-L201】【F:routes/planning-portal.js†L1-L150】【F:public/pipedrive-panel.html†L1-L382】【F:public/front-sidebar.html†L1-L386】【F:utils/pricing-calculator.js†L1-L97】
- I attempted to access Pipedrive’s “Custom UI extensions” documentation and Front’s developer documentation, but the requests were blocked by a 403 in this environment. I’m still providing alignment guidance based on the current codebase and general best practices for iframe-based extensions.

## Application intent and architecture (repo-derived)
- **Intent**: Provide a small Node/Express API that calculates quotes, queries NSW planning data, and integrates Front → Pipedrive lead creation, with two embedded UI panels for Pipedrive and Front that call the API endpoints directly.【F:README.md†L1-L101】【F:server.js†L1-L63】【F:routes/quotes.js†L1-L113】【F:routes/front.js†L1-L201】
- **Structure**:
  - `server.js` wires up API routes and serves static HTML panels from `public/`.【F:server.js†L1-L63】
  - `routes/quotes.js` uses a pricing calculator to build line items and optionally pushes Pipedrive products/deal updates with API token auth.【F:routes/quotes.js†L1-L113】
  - `routes/pipedrive.js` provides deal and product lookups for the Pipedrive panel via API token auth.【F:routes/pipedrive.js†L1-L57】
  - `routes/front.js` extracts data from Front conversations, then creates Pipedrive persons/leads and a note.【F:routes/front.js†L1-L201】
  - `routes/planning-portal.js` geocodes the address and queries NSW map services for zoning, heritage, and bushfire attributes.【F:routes/planning-portal.js†L1-L150】
  - `public/pipedrive-panel.html` and `public/front-sidebar.html` are React-in-HTML panels that fetch the API endpoints directly from the same origin.【F:public/pipedrive-panel.html†L1-L382】【F:public/front-sidebar.html†L1-L386】

## Pipedrive custom app alignment (what matches vs. gaps)
- **Panel URL and deal context**: The Pipedrive panel expects either a `dealId` or `id` query param, so the custom panel URL must include a placeholder that Pipedrive replaces at runtime (e.g., `?dealId={dealId}` or `?id={id}`). The current panel code reads both parameters correctly.【F:public/pipedrive-panel.html†L149-L193】
- **OAuth vs. API token**: The OAuth callback route returns a static success page and does not exchange tokens, which is consistent with a private app using API tokens (but not with a public OAuth app). If the app is truly private, this is OK, but installing via OAuth doesn’t actually grant tokens to the backend.【F:routes/oauth.js†L1-L85】
- **API auth method**: The backend uses `?api_token=...` in query strings, which is accepted for private app tokens but is less secure than a bearer token and can leak in logs and network traces. This is the main reason the 401 you saw on Render would happen if the API token is invalid or missing in environment variables.【F:routes/pipedrive.js†L1-L57】【F:routes/quotes.js†L1-L113】
- **Panel visibility**: The repo’s documentation expects the panel to be configured for “Deal Detail View” and to include the deal ID placeholder in the URL. Missing the placeholder causes the panel to load without context, which likely results in a blank/no-op panel experience.【F:DEPLOYMENT.md†L53-L74】【F:README.md†L73-L91】【F:public/pipedrive-panel.html†L149-L207】

## Front app alignment (what matches vs. gaps)
- **Conversation context**: The Front sidebar reads `conversation_id` or `id` from the query string. The plugin URL must include a placeholder so Front passes conversation ID into the iframe; otherwise, extraction never happens and the UI stays empty.【F:public/front-sidebar.html†L115-L171】【F:DEPLOYMENT.md†L76-L84】
- **API usage**: The Front API call uses a bearer token and expects `conversation_id` in the request body, which matches typical Front API patterns. The subsequent Pipedrive lead creation is also tied to API tokens, so token validity and permissions are critical for that flow to succeed.【F:routes/front.js†L9-L120】

## Security and configuration findings (high priority)
- **Secret leakage risk**: `RENDER_ENV.txt` and `DEPLOYMENT.md` contained real-looking API tokens. These should not be in the repo or documentation. I replaced them with placeholders in this change set. Going forward, keep real tokens only in your deployment secrets manager/environment variables.【F:RENDER_ENV.txt†L7-L28】【F:DEPLOYMENT.md†L29-L45】
- **API tokens in query strings**: Pipedrive endpoints are called with query-string tokens, which can leak into logs or proxies. If you continue with API tokens, prefer request headers or proxy calls server-side only; avoid exposing tokens in the browser (even via server logs).【F:routes/pipedrive.js†L1-L57】【F:routes/quotes.js†L1-L113】
- **Wide-open CORS**: `app.use(cors())` defaults to `*`, which is open for any origin. For production, restrict to your Pipedrive and Front origins to reduce unintended access.【F:server.js†L10-L30】

## Reliability and efficiency opportunities
- **Pipedrive product creation**: `ensureProductsExist` calls the search endpoint for each line item sequentially. For larger quote lists this is slow and may hit rate limits. Consider batching or caching product IDs by name/code to reduce redundant requests.【F:routes/quotes.js†L59-L113】
- **Deal/product fetch errors**: The `/api/pipedrive` routes return `500` with `error.message`, but they discard Pipedrive’s response error body and status. Returning the upstream status and message would speed up troubleshooting (e.g., 401 vs 404).【F:routes/pipedrive.js†L1-L57】
- **Front extraction**: `extractDataFromEmail` is regex-based and may miss common real-world patterns (e.g., signatures without “Phone:” labels). Consider expanding patterns or allow manual overrides (the UI already allows manual edits).【F:routes/front.js†L121-L201】【F:public/front-sidebar.html†L205-L360】
- **Panel UX on missing IDs**: The Pipedrive panel sets `loading` false even if no `dealId` is present but doesn’t show a user-facing warning. Adding a “missing deal id” message could prevent confusion when the panel loads without context.【F:public/pipedrive-panel.html†L149-L263】

## Documentation and onboarding improvements
- **Consistency across docs**: `README.md`, `DEPLOYMENT.md`, and `RENDER_ENV.txt` should all use the same placeholder variables and avoid real tokens. I updated the two files that had sensitive values and aligned the README examples to placeholders to reduce confusion.【F:README.md†L21-L33】【F:DEPLOYMENT.md†L29-L45】【F:RENDER_ENV.txt†L7-L28】
- **Explicit iframe placeholders**: The docs already mention `dealId` placeholders, but given validation issues in Pipedrive’s UI, it may help to include both `dealId` and `id` placeholder options and explain URL encoding more clearly (this is already partially covered in README).【F:README.md†L73-L91】

## Next-step recommendations (prioritized)
1. **Fix or validate API token access**: Confirm Pipedrive API token and domain values in deployment environment. The 401 errors in Render logs suggest missing/invalid tokens or a restricted user token.【F:routes/pipedrive.js†L1-L57】
2. **Restrict CORS**: Lock down CORS to the expected origins (Front + Pipedrive) rather than `*` to reduce exposure.【F:server.js†L10-L30】
3. **Improve error responses**: Surface upstream HTTP status and error data from Pipedrive/Front to make diagnosing install issues faster.【F:routes/pipedrive.js†L1-L57】【F:routes/front.js†L9-L120】
4. **Improve panel UX**: Add explicit empty-state handling for missing `dealId` and for authorization errors returned by the API; this is the main cause of “blank panel” confusion.【F:public/pipedrive-panel.html†L149-L382】
5. **Harden documentation**: Keep all tokens and secrets outside the repo, and treat `RENDER_ENV.txt` as a template only (which this update enforces).【F:RENDER_ENV.txt†L1-L36】

## Commands used for this review
- `sed -n '1,200p' README.md`
- `sed -n '1,240p' server.js`
- `sed -n '1,240p' routes/pipedrive.js`
- `sed -n '1,200p' routes/oauth.js`
- `sed -n '1,240p' routes/front.js`
- `sed -n '1,240p' routes/quotes.js`
- `sed -n '1,260p' routes/planning-portal.js`
- `sed -n '1,260p' public/pipedrive-panel.html`
- `sed -n '260,640p' public/pipedrive-panel.html`
- `sed -n '1,260p' public/front-sidebar.html`
- `sed -n '260,640p' public/front-sidebar.html`
- `sed -n '1,200p' START_HERE.txt`
- `sed -n '1,200p' DEPLOYMENT.md`
- `sed -n '1,200p' RENDER_ENV.txt`
- `cat package.json`
- `sed -n '1,200p' test-pricing.js`
- `curl -L https://pipedrive.readme.io/docs/custom-ui-extensions | head -n 200`
- `curl -L https://dev.frontapp.com | head -n 120`
