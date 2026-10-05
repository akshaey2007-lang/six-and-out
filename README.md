# SIX & OUT

A two-player online cricket duel with room codes, a coin toss, six batting shots, six pace deliveries, six spin deliveries, and one to six overs per innings. Three wickets end an innings. Both players commit secret choices; the published matchup table determines each result.

Rooms expire after 24 hours. Browser storage retains player credentials for reconnecting, while the database stores authoritative match state. Concurrent moves use version checks to prevent overwriting the other player's choice.

## Render

Create a Blueprint in Render from this repository and select the main branch. The included render.yaml creates a free Node web service in Singapore. Create a Neon Free PostgreSQL project in Singapore and add its pooled connection URL as DATABASE_URL in Render's Environment settings. No database password belongs in this repository.

Build: npm ci --include=dev && npm run build:render

Start: npm run start:render

Health check: /healthz (checks the database connection).

The build reuses the game's existing React interface and shared match rules. The Node server serves the interface and room API. PostgreSQL tables are created on startup; room data survives web service restarts and deployments. Connections to Neon use TLS with certificate verification and channel binding.

Render's free web service sleeps after 15 idle minutes and can take about a minute to wake. The Neon database has no scheduled 30-day expiry, but its Free plan has storage, compute, and transfer quotas. Stay on Free plans and within quotas to avoid costs. Hosting terms and free allowances can change; this setup is not a guarantee of permanent free availability. See https://render.com/docs/free and https://neon.com/pricing.

To switch an existing database, temporarily set MIGRATE_DATABASE_URL to the old internal URL and DATABASE_URL to the new Neon URL. On startup, active rooms are copied with their credentials and versions. Existing target rooms are preserved. After verifying the switch, remove MIGRATE_DATABASE_URL so future restarts no longer depend on the old database.

Verify the Render runtime with npm run build:render and npm run test:render. For local PostgreSQL, set DATABASE_URL in your environment and run npm run start:render (default port 10000).

## Sites

The original Sites deployment uses Cloudflare Workers and D1. Run npm run dev to preview this runtime. Generate D1 schema migrations with npm run db:generate. npm run build and npm run start retain the original Sites behavior.
