export type Mode = "pace" | "spin";
export const shots = [
 {name:"Defensive block",desc:"Keep it steady. Protect your wicket.",cue:"Safe singles"},
 {name:"Cover drive",desc:"Lean into the gap through the covers.",cue:"Find the gap"},
 {name:"Square cut",desc:"Punish width with a crisp cut.",cue:"Play it late"},
 {name:"Pull shot",desc:"Meet the short ball with power.",cue:"Attack the bounce"},
 {name:"Sweep",desc:"Get low and take on the turn.",cue:"Beat the spin"},
 {name:"Lofted drive",desc:"Go aerial. Big reward, big risk.",cue:"Clear the ropes"}
] as const;
export const deliveries = {
 pace:[{name:"Yorker",desc:"Full and fast at the toes."},{name:"Good length",desc:"The corridor of uncertainty."},{name:"Outswinger",desc:"Shape it away from the bat."},{name:"Bouncer",desc:"Short, sharp, and climbing."},{name:"Slower ball",desc:"Take the pace off."},{name:"Full toss",desc:"Tempt the big swing."}],
 spin:[{name:"Off break",desc:"Turn it in towards the batter."},{name:"Leg break",desc:"Rip it away from the bat."},{name:"Googly",desc:"The wrong’un. Disguise the turn."},{name:"Topspinner",desc:"Extra dip and bounce."},{name:"Arm ball",desc:"Skid straight past the bat."},{name:"Flighted ball",desc:"Toss it up. Invite the attack."}]
} as const;
export type Outcome = number | "W";
export const matchup:Record<Mode,Outcome[][]> = {
 pace:[[0,1,0,"W",1,2],[2,4,"W",0,1,6],["W",1,4,2,0,4],[0,"W",1,6,2,4],[1,0,2,1,"W",4],[6,2,1,4,4,"W"]],
 spin:[[0,1,"W",0,1,2],[4,0,1,2,"W",4],[1,4,0,"W",2,1],["W",2,1,4,0,2],[6,"W",4,1,2,0],[2,6,0,1,4,"W"]]
};
export type Player = {name:string;hash:string};
export type Ball = {number:number;shot:number;delivery:number;mode:Mode;outcome:Outcome};
export type Innings = {batter:number;runs:number;wickets:number;balls:Ball[]};
export type RoomState = {players:Player[];overs:number;phase:"waiting"|"toss"|"choose"|"playing"|"result"|"complete";toss:null|{call:"heads"|"tails";face:"heads"|"tails";winner:number};innings:Innings[];mode:Mode|null;moves:[number|null,number|null];ready:[boolean,boolean];winner:number|null;votes:[boolean,boolean]};
export type PublicRoom = Omit<RoomState,"players"|"moves"> & {players:{name:string}[];locked:[boolean,boolean];myMove:number|null;you:number;code:string;version:number;round:string};
export class GameError extends Error {constructor(message:string,public status=400){super(message);}}
function requireThat(condition:unknown,message:string,status=400):asserts condition{if(!condition)throw new GameError(message,status);}
export function initialState(name:string,hash:string,overs:number):RoomState{return {players:[{name,hash}],overs,phase:"waiting",toss:null,innings:[],mode:null,moves:[null,null],ready:[false,false],winner:null,votes:[false,false]};}
export function roundKey(s:RoomState){return s.innings.length+"-"+(s.innings.at(-1)?.balls.length??0);}
export function inningsEnded(s:RoomState){const i=s.innings.at(-1);return !!i&&(i.wickets>=3||i.balls.length>=s.overs*6);}
export function publicRoom(s:RoomState,you:number,code:string,version:number):PublicRoom{return {...s,players:s.players.map(p=>({name:p.name})),moves:undefined,locked:s.moves.map(x=>x!==null) as [boolean,boolean],myMove:s.moves[you],you,code,version,round:roundKey(s)} as PublicRoom;}
export function playAction(s:RoomState,you:number,a:Record<string,unknown>,coin:"heads"|"tails"="heads"):RoomState{
 const next=structuredClone(s);
 if(a.action==="toss"){
  requireThat(s.phase==="toss"&&you===1,"The joining player calls the toss.");
  requireThat(a.call==="heads"||a.call==="tails","Choose heads or tails.");
  next.toss={call:a.call,face:coin,winner:a.call===coin?1:0};next.phase="choose";return next;
 }
 if(a.action==="choose"){
  requireThat(s.phase==="choose"&&s.toss?.winner===you,"Only the toss winner can choose.");
  requireThat(a.choice==="bat"||a.choice==="bowl","Choose to bat or bowl.");
  next.innings=[{batter:a.choice==="bat"?you:1-you,runs:0,wickets:0,balls:[]}];next.phase="playing";return next;
 }
 if(a.action==="rematch"){
  requireThat(s.phase==="complete","Finish the current match first.");
  next.votes[you]=true;
  if(next.votes.every(Boolean)){next.phase="toss";next.toss=null;next.innings=[];next.mode=null;next.moves=[null,null];next.ready=[false,false];next.winner=null;next.votes=[false,false];}
  return next;
 }
 requireThat(a.round===roundKey(s),"The ball has changed. Please choose again.",409);
 const innings=next.innings.at(-1);requireThat(innings,"The innings has not started.");
 if(a.action==="mode"){
  requireThat(s.phase==="playing"&&you!==innings.batter,"Only the bowler can choose the bowling style.");
  requireThat(s.mode===null,"Bowling style is already locked for this ball.");
  requireThat(a.mode==="spin"||a.mode==="pace","Choose spin or pace.");
  next.mode=a.mode;return next;
 }
 if(a.action==="move"){
  requireThat(s.phase==="playing"&&s.mode!==null,"Wait for the bowling style.");
  requireThat(s.moves[you]===null,"Your choice is already locked.");
  requireThat(Number.isInteger(a.move)&&Number(a.move)>=0&&Number(a.move)<=5,"Choose one of the six moves.");
  next.moves[you]=Number(a.move);
  if(next.moves.every(x=>x!==null)){
   const shot=next.moves[innings.batter]!,delivery=next.moves[1-innings.batter]!,mode=next.mode!;
   const outcome=matchup[mode][shot][delivery];
   innings.balls.push({number:innings.balls.length+1,shot,delivery,mode,outcome});
   if(outcome==="W")innings.wickets++;else innings.runs+=outcome;
   next.ready=[false,false];next.phase="result";
   if(next.innings.length===2){
    const first=next.innings[0];
    if(innings.runs>first.runs){next.phase="complete";next.winner=innings.batter;}
    else if(inningsEnded(next)){next.phase="complete";next.winner=innings.runs===first.runs?null:first.batter;}
   }
  }
  return next;
 }
 if(a.action==="next"){
  requireThat(s.phase==="result","The ball is still in play.");
  next.ready[you]=true;
  if(next.ready.every(Boolean)){
   if(inningsEnded(next)&&next.innings.length===1)next.innings.push({batter:1-innings.batter,runs:0,wickets:0,balls:[]});
   next.mode=null;next.moves=[null,null];next.ready=[false,false];next.phase="playing";
  }
  return next;
 }
 throw new GameError("Unknown match action.");
}
