import pg from "pg";

export function databaseConfig(connectionString) {
  const url = new URL(connectionString);
  const managedExternal = url.hostname.endsWith(".neon.tech") || url.hostname.endsWith(".render.com");
  if (managedExternal) {
    // Connection-string SSL settings override pg's explicit SSL object.
    // Use certificate verification consistently for managed public endpoints.
    for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);
  }
  return {
    connectionString: url.toString(),
    max: 5,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 10000,
    enableChannelBinding: true,
    ...(managedExternal ? {ssl: {rejectUnauthorized: true}} : {}),
  };
}

export function databasePool(connectionString) {
  const pool = new pg.Pool(databaseConfig(connectionString));
  pool.on("error", error => console.error("Database connection error:", error.code ?? error.name));
  return pool;
}
