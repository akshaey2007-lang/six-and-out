"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import type {PublicRoom} from "@/lib/game";
type Session={code:string;token:string};
class RequestError extends Error{constructor(message:string,public status:number){super(message);}}
async function request(url:string,method="GET",data?:unknown,token?:string,signal?:AbortSignal){
 const response=await fetch(url,{method,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},...(data?{body:JSON.stringify(data)}:{}),signal,cache:"no-store"});
 const result=await response.json() as {room?:PublicRoom;token?:string;error?:string};
 if(!response.ok)throw new RequestError(result.error??"Could not connect. Try again.",response.status);
 if(!result.room)throw new Error("The stadium sent an incomplete response. Try again.");return result as {room:PublicRoom;token?:string};
}
const storageKey="sixout.player-sessions";
function savedSessions():Record<string,string>{try{return JSON.parse(localStorage.getItem(storageKey)??"{}");}catch{return {};}}
function remember(s:Session){try{const stored=savedSessions();stored[s.code]=s.token;localStorage.setItem(storageKey,JSON.stringify(stored));localStorage.setItem("sixout.active-room",s.code);}catch{}}
type Tool={name:string;description:string;title:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown|Promise<unknown>};
export function useMatch(){
 const [room,setRoom]=useState<PublicRoom|null>(null),[session,setSession]=useState<Session|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const update=useCallback((value:PublicRoom)=>{setRoom(previous=>previous?.code===value.code&&previous.version>value.version?previous:value);},[]);
 useEffect(()=>{try{if(new URLSearchParams(location.search).has("room"))return;const code=localStorage.getItem("sixout.active-room");const token=code?savedSessions()[code]:null;if(code&&token)setSession({code,token});}catch{}},[]);
 useEffect(()=>{if(!session)return;let running=false;const ctrl=new AbortController();async function poll(){if(running)return;running=true;try{const result=await request("/api/rooms/"+session!.code,"GET",undefined,session!.token,ctrl.signal);update(result.room);setError("");}catch(e){if(ctrl.signal.aborted)return;setError(e instanceof Error?e.message:"Lost connection. Reconnecting…");if(e instanceof RequestError&&[401,404].includes(e.status)){setSession(null);setRoom(null);try{localStorage.removeItem("sixout.active-room");}catch{}}}finally{running=false;}}void poll();const timer=setInterval(()=>void poll(),1300);return()=>{clearInterval(timer);ctrl.abort();};},[session,update]);
 const open=useCallback(async(kind:"create"|"join",name:string,overs:number,code:string)=>{
  if(!name.trim()||name.trim().length>20)throw new Error("Enter a player name between 1 and 20 characters.");
  if(kind==="create"&&(!Number.isInteger(overs)||overs<1||overs>6))throw new Error("Choose one to six overs.");
  if(kind==="join"&&!/^[A-Z2-9]{6}$/.test(code))throw new Error("Enter a valid six-character room code.");
  setBusy(true);setError("");try{
   const remembered=kind==="join"?savedSessions()[code]:undefined;
   const result=remembered?await request("/api/rooms/"+code,"GET",undefined,remembered):kind==="create"?await request("/api/rooms","POST",{name,overs}):await request("/api/rooms/"+code,"POST",{action:"join",name});
   const next={code:result.room.code,token:result.token??remembered!};remember(next);setSession(next);update(result.room);
   return {code:result.room.code,phase:result.room.phase,overs:result.room.overs};
  }catch(e){setError(e instanceof Error?e.message:"Could not open the room.");throw e;}finally{setBusy(false);}
 },[update]);
 const act=useCallback(async(data:Record<string,unknown>)=>{if(!session||!room)throw new Error("Join a room first.");setBusy(true);setError("");try{const result=await request("/api/rooms/"+session.code,"POST",{...data,round:room.round},session.token);update(result.room);}catch(e){setError(e instanceof Error?e.message:"Could not save your choice. Try again.");}finally{setBusy(false);}},[session,room,update]);
 function exit(){setSession(null);setRoom(null);setError("");try{localStorage.removeItem("sixout.active-room");history.replaceState(null,"","/");}catch{}}
 const latest=useRef({open,room});latest.current={open,room};
 useEffect(()=>{const context=(document as Document&{modelContext?:{registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;if(!context?.registerTool)return;const life=new AbortController();
 const definitions:Tool[]=[
 {name:"create_cricket_room",title:"Create cricket room",description:"Create a two-player cricket room and update the visible match. Returns the room code.",inputSchema:{type:"object",properties:{name:{type:"string",minLength:1,maxLength:20},overs:{type:"integer",minimum:1,maximum:6}},required:["name","overs"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async input=>{const p=input as {name?:unknown;overs?:unknown};if(!p||typeof p.name!=="string"||typeof p.overs!=="number")throw new Error("A name and overs count are required.");const result=await latest.current.open("create",p.name,p.overs,"");await new Promise(requestAnimationFrame);return result;}},
 {name:"join_cricket_room",title:"Join cricket room",description:"Join an existing cricket room with a name and six-character code, updating the visible match.",inputSchema:{type:"object",properties:{name:{type:"string",minLength:1,maxLength:20},code:{type:"string",pattern:"^[A-Z2-9]{6}$"}},required:["name","code"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async input=>{const p=input as {name?:unknown;code?:unknown};if(!p||typeof p.name!=="string"||typeof p.code!=="string")throw new Error("A name and room code are required.");const result=await latest.current.open("join",p.name,3,p.code);await new Promise(requestAnimationFrame);return result;}},
 {name:"read_cricket_match",title:"Read cricket match",description:"Read the current score, phase, participants, and your role. Opponent choices remain hidden until both lock in.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>{const r=latest.current.room;return r?{code:r.code,phase:r.phase,players:r.players,innings:r.innings,overs:r.overs,you:r.you}: {phase:"lobby"};}}
 ];for(const definition of definitions){try{void Promise.resolve(context.registerTool(definition,{signal:life.signal})).catch(()=>{});}catch{}}return()=>life.abort();
 },[]);
 return {room,busy,error,open,act,exit,clearError:()=>setError("")};
}
