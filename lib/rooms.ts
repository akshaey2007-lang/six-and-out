import {env} from "cloudflare:workers";
import {GameError, type RoomState, publicRoom} from "./game";
export function roomDb(){if(!env.DB)throw new Error("Room storage is unavailable");return env.DB;}
export async function hashToken(token:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));return Array.from(new Uint8Array(digest)).map(v=>v.toString(16).padStart(2,"0")).join("");}
export const token=()=>crypto.randomUUID()+crypto.randomUUID();
export function roomCode(){const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return Array.from(crypto.getRandomValues(new Uint8Array(6))).map(v=>alphabet[v%32]).join("");}
export function cleanCode(value:unknown){if(typeof value!=="string"||! /^[A-Z2-9]{6}$/.test(value))throw new GameError("Enter a valid six-character room code.");return value;}
export function cleanName(value:unknown){if(typeof value!=="string"||value.trim().length<1||value.trim().length>20)throw new GameError("Use a player name between 1 and 20 characters.");return value.trim();}
export async function readRoom(code:string){const row=await roomDb().prepare("SELECT state,version,expires FROM rooms WHERE code=?").bind(code).first<{state:string;version:number;expires:number}>();if(!row||row.expires<Date.now())throw new GameError("This room has expired or does not exist. Create a new room.",404);return {state:JSON.parse(row.state) as RoomState,version:row.version};}
export async function playerIndex(request:Request,state:RoomState){const auth=request.headers.get("Authorization")??"";if(!auth.startsWith("Bearer ")||auth.length>180)throw new GameError("Join this room to play.",401);const hash=await hashToken(auth.slice(7));const you=state.players.findIndex(p=>p.hash===hash);if(you<0)throw new GameError("Your player session is invalid. Rejoin the room.",401);return you;}
export async function writeRoom(code:string,state:RoomState,version:number){const result=await roomDb().prepare("UPDATE rooms SET state=?,version=version+1 WHERE code=? AND version=?").bind(JSON.stringify(state),code,version).run();return result.meta.changes===1;}
export async function body(request:Request){const origin=request.headers.get("Origin");if(origin&&origin!==new URL(request.url).origin)throw new GameError("This request is not allowed.",403);const raw=await request.text();if(raw.length>4096)throw new GameError("Request too large.",413);try{const value=JSON.parse(raw);if(!value||typeof value!=="object"||Array.isArray(value))throw 0;return value as Record<string,unknown>;}catch{throw new GameError("Invalid request.");}}
export function reply(value:unknown,status=200){return Response.json(value,{status,headers:{"Cache-Control":"no-store"}});}
export function handleError(error:unknown){if(error instanceof GameError)return reply({error:error.message},error.status);console.error("Match storage error",error);return reply({error:"The stadium connection is unavailable. Your match is saved; try again."},503);}
export {publicRoom};
