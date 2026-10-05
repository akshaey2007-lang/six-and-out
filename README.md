# SIX & OUT

A two-player online cricket duel with room codes, a coin toss, six batting shots, six pace deliveries, six spin deliveries, and one to six overs per innings. Three wickets end an innings. Both players commit secret choices; the published matchup table determines each result.

Rooms expire after 24 hours. Browser storage retains player credentials for reconnecting, while the database stores authoritative match state. Concurrent moves use version checks to prevent overwriting the other player's choice.

## Render

Create a Blueprint in Render from this repository and select the main branch. The included render.yaml creates a free Node web service and a free PostgreSQL database in Singapore, linking DATABASE_URL automatically over Render's private network. No database password belongs in this repository.

Build: npm ci --include=dev && npm run build:render

Start: npm run start:render

Health check: /healthz (checks the database connection).

The build reuses the game's existing React interface and shared match rules. The Node server serves the interface and room API. PostgreSQL tables are created on startup; room data survives web service restarts and deployments. External database connections are disabled in the Blueprint because the server uses the internal connection.

Render's free web service sleeps after 15 idle minutes and can take about a minute to wake. The free database expires 30 days after creation. Upgrade the database or move room storage to another persistent database before that date for ongoing hosting. See https://render.com/docs/free.

Verify the Render runtime with npm run build:render and npm run test:render. For local PostgreSQL, set DATABASE_URL in your environment and run npm run start:render (default port 10000).

## Sites

The original Sites deployment uses Cloudflare Workers and D1. Run npm run dev to preview this runtime. Generate D1 schema migrations with npm run db:generate. npm run build and npm run start retain the original Sites behavior.
