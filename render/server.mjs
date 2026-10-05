import {createStore} from "./store.mjs";
import {createApp} from "./app.mjs";
import {databasePool} from "./database.mjs";
import {migrateRooms} from "./migrate.mjs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for multiplayer room storage.");
const pool = databasePool(process.env.DATABASE_URL);
const store = createStore(pool);
await store.init();
if (process.env.MIGRATE_DATABASE_URL) {
  const source = databasePool(process.env.MIGRATE_DATABASE_URL);
  try {
    const result = await migrateRooms(source, pool);
    console.log(`Room migration complete: ${result.copied} copied, ${result.available} available.`);
  } finally {await source.end();}
}
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
