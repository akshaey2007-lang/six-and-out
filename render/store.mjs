import {readFile} from "node:fs/promises";
import {GameError} from "../.render-server/game.mjs";

export function createStore(pool) {
  return {
    async init() {
      await pool.query(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));
    },
    async create(code, state, expires) {
      const result = await pool.query(
        "INSERT INTO rooms(code,state,version,expires) VALUES($1,$2,0,$3) ON CONFLICT(code) DO NOTHING",
        [code, JSON.stringify(state), expires],
      );
      return result.rowCount === 1;
    },
    async read(code) {
      const {rows} = await pool.query("SELECT state,version,expires FROM rooms WHERE code=$1", [code]);
      const row = rows[0];
      if (!row || Number(row.expires) < Date.now()) {
        throw new GameError("This room has expired or does not exist. Create a new room.", 404);
      }
      return {state: JSON.parse(row.state), version: row.version};
    },
    async write(code, state, version) {
      const result = await pool.query(
        "UPDATE rooms SET state=$1,version=version+1 WHERE code=$2 AND version=$3",
        [JSON.stringify(state), code, version],
      );
      return result.rowCount === 1;
    },
    async health() {await pool.query("SELECT 1");},
    async cleanup() {await pool.query("DELETE FROM rooms WHERE expires < $1", [Date.now()]);},
    async close() {await pool.end();},
  };
}
