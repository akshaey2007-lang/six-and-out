import {createServer} from "node:http";
import {randomBytes, randomUUID, createHash} from "node:crypto";
import {stat} from "node:fs/promises";
import {createReadStream} from "node:fs";
import {resolve, extname, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {GameError, initialState, publicRoom, playAction} from "../.render-server/game.mjs";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const roomCode = () => [...randomBytes(6)].map(v => alphabet[v % 32]).join("");
const token = () => randomUUID() + randomUUID();
const hashToken = secret => createHash("sha256").update(secret).digest("hex");
function cleanName(value) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 20) {
    throw new GameError("Use a player name between 1 and 20 characters.");
  }
  return value.trim();
}
function cleanCode(value) {
  if (!/^[A-Z2-9]{6}$/.test(value)) throw new GameError("Enter a valid six-character room code.");
  return value;
}
function playerIndex(request, state) {
  const auth = request.headers.authorization ?? "";
  if (!auth.startsWith("Bearer ") || auth.length > 180) throw new GameError("Join this room to play.", 401);
  const hash = hashToken(auth.slice(7));
  const you = state.players.findIndex(p => p.hash === hash);
  if (you < 0) throw new GameError("Your player session is invalid. Rejoin the room.", 401);
  return you;
}
async function body(request) {
  const origin = request.headers.origin;
  if (origin) {
    let parsed;
    try {parsed = new URL(origin);} catch {throw new GameError("This request is not allowed.", 403);}
    if (parsed.host !== request.headers.host || !["http:", "https:"].includes(parsed.protocol)) {
      throw new GameError("This request is not allowed.", 403);
    }
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 4096) throw new GameError("Request too large.", 413);
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {throw new GameError("Invalid request.");}
}
function reply(response, value, status = 200) {
  response.writeHead(status, {"Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"});
  response.end(JSON.stringify(value));
}
const types = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2"};

export function createApp(store, {staticDir = fileURLToPath(new URL("../dist-render", import.meta.url))} = {}) {
  const root = resolve(staticDir);
  return createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    try {
      const url = new URL(request.url, "http://localhost");
      if (url.pathname === "/healthz" && request.method === "GET") {
        await store.health();
        return reply(response, {ok: true});
      }
      if (url.pathname === "/api/rooms" && request.method === "POST") {
        const a = await body(request), name = cleanName(a.name), overs = Number(a.overs);
        if (!Number.isInteger(overs) || overs < 1 || overs > 6) throw new GameError("Choose between one and six overs.");
        const secret = token(), state = initialState(name, hashToken(secret), overs);
        for (let attempt = 0; attempt < 5; attempt++) {
          const code = roomCode();
          if (await store.create(code, state, Date.now() + 86400000)) {
            return reply(response, {room: publicRoom(state, 0, code, 0), token: secret}, 201);
          }
        }
        throw new GameError("Could not create a room. Please try again.", 503);
      }
      const match = url.pathname.match(/^\/api\/rooms\/([^/]+)$/);
      if (match && ["GET", "POST"].includes(request.method)) {
        const code = cleanCode(match[1]);
        if (request.method === "GET") {
          const {state, version} = await store.read(code);
          return reply(response, {room: publicRoom(state, playerIndex(request, state), code, version)});
        }
        const a = await body(request), joining = a.action === "join";
        const secret = joining ? token() : null, hash = secret ? hashToken(secret) : null;
        const coin = randomBytes(1)[0] % 2 === 0 ? "heads" : "tails";
        for (let attempt = 0; attempt < 6; attempt++) {
          const {state, version} = await store.read(code);
          let you, next;
          if (joining) {
            if (state.players.length >= 2) throw new GameError("This room already has two players.", 409);
            if (state.phase !== "waiting") throw new GameError("This match has already started.", 409);
            you = 1;
            next = structuredClone(state);
            next.players.push({name: cleanName(a.name), hash});
            next.phase = "toss";
          } else {
            you = playerIndex(request, state);
            next = playAction(state, you, a, coin);
          }
          if (await store.write(code, next, version)) {
            return reply(response, {room: publicRoom(next, you, code, version + 1), ...(secret ? {token: secret} : {})});
          }
        }
        throw new GameError("Both players moved together. Please try again.", 409);
      }
      if (url.pathname.startsWith("/api/")) return reply(response, {error: "Unknown match route."}, 404);
      if (!["GET", "HEAD"].includes(request.method)) return reply(response, {error: "Method not allowed."}, 405);
      let pathname;
      try {pathname = decodeURIComponent(url.pathname);} catch {throw new GameError("Invalid path.");}
      let filename = resolve(root, "." + pathname);
      if (filename !== root && !filename.startsWith(root + sep)) throw new GameError("Invalid path.", 403);
      let info;
      try {info = await stat(filename);} catch (e) {if (e.code !== "ENOENT") throw e;}
      if (!info?.isFile()) {
        if (extname(pathname)) return reply(response, {error: "File not found."}, 404);
        filename = resolve(root, "index.html");
        info = await stat(filename);
      }
      response.writeHead(200, {
        "Content-Type": types[extname(filename)] ?? "application/octet-stream",
        "Content-Length": info.size,
        "Cache-Control": pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
      });
      if (request.method === "HEAD") return response.end();
      const stream = createReadStream(filename);
      stream.on("error", () => response.destroy());
      stream.pipe(response);
    } catch (error) {
      if (response.headersSent) return response.destroy();
      if (error instanceof GameError) return reply(response, {error: error.message}, error.status);
      console.error("Match storage error:", error.code ?? error.name);
      reply(response, {error: "The stadium connection is unavailable. Your match is saved; try again."}, 503);
    }
  });
}
