// Copies active rooms without replacing newer state on an already-used target.
// Run on service startup during the database switch, then remove MIGRATE_DATABASE_URL.
export async function migrateRooms(source, target) {
  const {rows} = await source.query("SELECT code,state,version,expires FROM rooms WHERE expires > $1", [Date.now()]);
  const client = await target.connect();
  let copied = 0;
  try {
    await client.query("BEGIN");
    const existing = new Set((await client.query("SELECT code FROM rooms")).rows.map(row => row.code));
    for (const row of rows) {
      if (existing.has(row.code)) continue;
      const result = await client.query(
        "INSERT INTO rooms(code,state,version,expires) VALUES($1,$2,$3,$4) ON CONFLICT(code) DO NOTHING RETURNING code",
        [row.code, row.state, row.version, row.expires],
      );
      copied += result.rows.length;
    }
    await client.query("COMMIT");
    return {available: rows.length, copied};
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {client.release();}
}
