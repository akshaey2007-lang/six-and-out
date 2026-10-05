import pg from "pg";
import {createStore} from "./store.mjs";
import {createApp} from "./app.mjs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for multiplayer room storage.");
const databaseUrl = new URL(process.env.DATABASE_URL);
// Render's external database endpoints require TLS. Internal endpoints use its private network.
const ssl = databaseUrl.hostname.endsWith(".render.com") ? {rejectUnauthorized: true} : undefined;
const pool = new pg.Pool({connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000, ssl});
pool.on("error", error => console.error("Database connection error:", error.code ?? error.name));
const store = createStore(pool);
await store.init();
await store.cleanup();
const server = createApp(store);
const cleanup = setInterval(() => store.cleanup().catch(error => console.error("Room cleanup error:", error.code ?? error.name)), 3600000);
cleanup.unref();
server.listen(Number(process.env.PORT || 10000), "0.0.0.0", () => console.log("SIX & OUT is ready."));
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  clearInterval(cleanup);
  const forced = setTimeout(() => process.exit(1), 10000);
  forced.unref();
  server.close(async () => {await store.close(); clearTimeout(forced); process.exit(0);});
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
