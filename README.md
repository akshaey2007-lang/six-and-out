# SIX & OUT

A two-player cricket duel with private room codes, a coin toss, six batting shots, six pace deliveries, six spin deliveries, and one to six overs per innings. Three wickets end an innings. Both players commit secret choices; the published matchup table determines each result.

Room state is stored in D1 with optimistic concurrency. Browser storage retains only player credentials for reconnecting. Rooms expire after 24 hours.

Run npm run dev to preview. Generate schema migrations with npm run db:generate. The Sites workflow builds and publishes the Cloudflare Worker.
