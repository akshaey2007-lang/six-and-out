import assert from "node:assert/strict";
import test from "node:test";
import {newDb} from "pg-mem";
import {createStore} from "./store.mjs";
import {migrateRooms} from "./migrate.mjs";
import {databaseConfig} from "./database.mjs";
import {initialState} from "../.render-server/game.mjs";

test("database migration preserves player sessions and skips expired rooms and newer target records", async t => {
  const SourcePool = newDb().adapters.createPg().Pool;
  const TargetPool = newDb().adapters.createPg().Pool;
  const source = new SourcePool(), target = new TargetPool();
  t.after(async () => {await source.end(); await target.end();});
  const oldStore = createStore(source), newStore = createStore(target);
  await oldStore.init(); await newStore.init();
  const state = initialState("Returning player", "existing-session-hash", 6);
  const expires = Date.now() + 86400000;
  await source.query("INSERT INTO rooms(code,state,version,expires) VALUES($1,$2,$3,$4)", ["ABC234", JSON.stringify(state), 7, expires]);
  await oldStore.create("DEF234", state, Date.now() - 1000);
  await oldStore.create("GHI234", state, expires);
  const newer = {...state, overs: 2};
  await target.query("INSERT INTO rooms(code,state,version,expires) VALUES($1,$2,$3,$4)", ["GHI234", JSON.stringify(newer), 9, expires]);
  assert.deepEqual(await migrateRooms(source, target), {available: 2, copied: 1});
  assert.deepEqual(await newStore.read("ABC234"), {state, version: 7});
  assert.deepEqual(await newStore.read("GHI234"), {state: newer, version: 9});
  await assert.rejects(newStore.read("DEF234"), {status: 404});
  assert.deepEqual(await migrateRooms(source, target), {available: 2, copied: 0});
  assert.equal((await oldStore.read("ABC234")).version, 7);
});

test("managed external database URLs require verified TLS despite connection-string SSL aliases", () => {
  for (const host of ["ep-test-pooler.ap-southeast-1.aws.neon.tech", "dpg-example.singapore-postgres.render.com"]) {
    const config = databaseConfig(`postgresql://example:example@${host}/rooms?sslmode=require&channel_binding=require`);
    assert.deepEqual(config.ssl, {rejectUnauthorized: true});
    assert.equal(new URL(config.connectionString).searchParams.has("sslmode"), false);
    assert.equal(config.enableChannelBinding, true);
  }
  assert.equal(databaseConfig("postgresql://example:example@dpg-private-a/rooms").ssl, undefined);
});
