import assert from 'node:assert/strict';
import test from 'node:test';
import {once} from 'node:events';
import {newDb} from 'pg-mem';
import {createStore} from './store.mjs';
import {createApp} from './app.mjs';

test('PostgreSQL room persistence, concurrent moves, privacy, and a full match', async t => {
const db = newDb();
const {Pool} = db.adapters.createPg();
const store = createStore(new Pool());
await store.init();
const server = createApp(store);
server.listen(0, '127.0.0.1');
await once(server, 'listening');
t.after(async () => {await new Promise(resolve => server.close(resolve)); await store.close();});
const origin='http://127.0.0.1:'+server.address().port;
async function call(path,method='GET',data,token,status=200){const r=await fetch(origin+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});const payload=await r.json();assert.equal(r.status,status,JSON.stringify(payload));return payload;}
const a=await call('/api/rooms','POST',{name:'Test Striker',overs:1},undefined,201);
const code=a.room.code,route='/api/rooms/'+code;
const b=await call(route,'POST',{action:'join',name:'Test Spinner'});
const tokens=[a.token,b.token];
assert.equal(b.room.players.length,2);
await call(route,'POST',{action:'join',name:'Third player'},undefined,409);
await call(route,'GET',undefined,'invalid-token',401);
await call('/api/rooms','POST',{name:'Bad overs',overs:7},undefined,400);
let room=(await call(route,'POST',{action:'toss',call:'tails'},b.token)).room;
const firstBatter=room.toss.winner;
room=(await call(route,'POST',{action:'choose',choice:'bat'},tokens[firstBatter])).room;
async function ball(shot,delivery,mode='pace',checkPrivacy=false){
 const batter=room.innings.at(-1).batter,bowler=1-batter,round=room.round;
 await call(route,'POST',{action:'mode',mode,round},tokens[batter],400);
 room=(await call(route,'POST',{action:'mode',mode,round},tokens[bowler])).room;
 if(checkPrivacy){
  room=(await call(route,'POST',{action:'move',move:shot,round},tokens[batter])).room;
  const view=(await call(route,'GET',undefined,tokens[bowler])).room;
  assert.equal(view.myMove,null);assert.equal(view.moves,undefined);assert.equal(view.locked[batter],true);assert.equal(view.innings.at(-1).balls.length,0);
  assert.equal(view.players[0].hash,undefined);assert.equal(view.players[1].hash,undefined);
  await call(route,'POST',{action:'move',move:shot,round},tokens[batter],400);
  room=(await call(route,'POST',{action:'move',move:delivery,round},tokens[bowler])).room;
 }else{
  await Promise.all([call(route,'POST',{action:'move',move:shot,round},tokens[batter]),call(route,'POST',{action:'move',move:delivery,round},tokens[bowler])]);
  room=(await call(route,'GET',undefined,tokens[0])).room;
 }
 if(room.phase==='result'){
  const readyRound=room.round;
  await Promise.all(tokens.map(token=>call(route,'POST',{action:'next',round:readyRound},token)));
  room=(await call(route,'GET',undefined,tokens[0])).room;
 }
}
await ball(1,1,'pace',true);
for(const [s,d] of [[0,0],[5,0],[4,4],[2,2],[3,3]])await ball(s,d);
assert.equal(room.innings.length,2);assert.equal(room.innings[0].runs,20);assert.equal(room.innings[0].wickets,1);assert.equal(room.innings[0].balls.length,6);
for(let i=0;i<4;i++)await ball(5,0);
assert.equal(room.phase,'complete');assert.equal(room.winner,1-firstBatter);assert.equal(room.innings[1].runs,24);assert.equal(room.innings[1].balls.length,4);
const reconnect=(await call(route,'GET',undefined,tokens[1])).room;assert.equal(reconnect.phase,'complete');
await Promise.all(tokens.map(token=>call(route,'POST',{action:'rematch'},token)));
room=(await call(route,'GET',undefined,tokens[0])).room;assert.equal(room.phase,'toss');assert.equal(room.innings.length,0);

const health=await call('/healthz');assert.equal(health.ok,true);
const page=await fetch(origin+'/');assert.equal(page.status,200);assert.match(await page.text(),/SIX &amp; OUT/);
const foreign=await fetch(origin+'/api/rooms',{method:'POST',headers:{Origin:'https://another-site.example','Content-Type':'application/json'},body:JSON.stringify({name:'Other origin',overs:1})});assert.equal(foreign.status,403);
const invalid=await fetch(origin+'/api/rooms',{method:'POST',body:'{'});assert.equal(invalid.status,400);
const oversized=await fetch(origin+'/api/rooms',{method:'POST',body:JSON.stringify({name:'x'.repeat(5000)})});assert.equal(oversized.status,413);
const persisted=await store.read(code);assert.equal(persisted.state.phase,'toss');
const expiredState=structuredClone(persisted.state);await store.create('ABC234',expiredState,Date.now()-1000);
await call('/api/rooms/ABC234','GET',undefined,tokens[0],404);await store.cleanup();
const expired=await store.read('ABC234').catch(e=>e);assert.equal(expired.status,404);
const secondServer=createApp(store);secondServer.listen(0,'127.0.0.1');await once(secondServer,'listening');
const restored=await fetch('http://127.0.0.1:'+secondServer.address().port+route,{headers:{Authorization:'Bearer '+tokens[0]}});assert.equal(restored.status,200);assert.equal((await restored.json()).room.phase,'toss');
await new Promise(resolve=>secondServer.close(resolve));
});
