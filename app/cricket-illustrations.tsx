import {useId} from "react";
import type {Mode} from "@/lib/game";

const shotPoses = [
  {head:[142,43],body:"M145 61 L151 82",legs:"M151 82 L143 108 M151 82 L168 108",arms:"M145 65 L132 77 L129 88",bat:[129,88,125,108],trail:"M125 103 Q106 110 83 110",end:[83,110],arc:"M154 76 Q137 83 125 108",caption:"Protect the stumps"},
  {head:[137,40],body:"M140 58 L132 80",legs:"M132 80 L110 103 L87 110 M132 80 L157 108",arms:"M140 62 L118 72 L102 82",bat:[102,82,78,102],trail:"M78 102 Q55 103 27 99",end:[27,99],arc:"M163 52 Q124 64 78 102",caption:"Through the covers"},
  {head:[143,40],body:"M144 58 L151 81",legs:"M151 81 L141 108 M151 81 L174 106",arms:"M144 62 L118 55 L96 70",bat:[96,70,57,72],trail:"M57 72 Q40 78 23 78",end:[23,78],arc:"M99 32 Q79 44 57 72",caption:"Square on the off side"},
  {head:[148,40],body:"M148 58 L147 81",legs:"M147 81 L124 107 M147 81 L171 108",arms:"M148 62 L126 61 L105 55",bat:[105,55,66,50],trail:"M66 50 Q49 36 24 33",end:[24,33],arc:"M108 90 Q88 66 66 50",caption:"Across to the leg side"},
  {head:[136,66],body:"M138 83 L152 101",legs:"M152 101 L176 110 M142 96 L115 110 L101 110",arms:"M138 82 L114 87 L95 97",bat:[95,97,56,99],trail:"M56 99 Q40 102 23 99",end:[23,99],arc:"M103 63 Q75 77 56 99",caption:"Low, sweeping across"},
  {head:[146,40],body:"M145 58 L139 82",legs:"M139 82 L119 109 M139 82 L161 108",arms:"M145 61 L129 44 L112 34",bat:[112,34,90,17],trail:"M94 81 Q63 27 23 19",end:[23,19],arc:"M81 106 Q65 52 90 17",caption:"Up and over the infield"},
];

export function ShotIllustration({index}:{index:number}) {
  const id=useId(),p=shotPoses[index];
  return <span className="cricket-visual shot-visual">
    <svg viewBox="0 0 220 130" aria-hidden="true" focusable="false">
      <defs><marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="#cefa69"/></marker></defs>
      <ellipse cx="132" cy="111" rx="67" ry="10" fill="#263a35" opacity=".45"/>
      <path d="M16 113 H203 M160 106 H202" stroke="#50655c" strokeWidth="1"/>
      <g stroke="#809788" strokeWidth="2.5"><path d="M186 83 V111 M192 83 V111 M198 83 V111 M184 82 H200"/></g>
      <path d={p.arc} fill="none" stroke="#ffd68a" strokeWidth="13" opacity=".08" strokeLinecap="round"/>
      <path d={p.arc} fill="none" stroke="#ffd68a" strokeWidth="1.5" opacity=".45" strokeDasharray="3 5"/>
      <path d={p.legs} fill="none" stroke="#d7e8e5" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={p.body} fill="none" stroke="#55bca9" strokeWidth="17" strokeLinecap="round"/>
      <path d={p.arms} fill="none" stroke="#8cdbcd" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={p.head[0]} cy={p.head[1]} r="10" fill="#8cdbcd"/>
      <path d={`M${p.head[0]-12} ${p.head[1]-2} h17 M${p.head[0]-9} ${p.head[1]+3} h7`} stroke="#163b37" strokeWidth="2" strokeLinecap="round"/>
      <path d={`M${p.bat[0]} ${p.bat[1]} L${p.bat[2]} ${p.bat[3]}`} stroke="#ffd68a" strokeWidth="9" strokeLinecap="round"/>
      <circle cx={p.bat[0]} cy={p.bat[1]} r="4" fill="#f0f7ee"/>
      <path d={p.trail} fill="none" stroke="#cefa69" strokeWidth="2.2" strokeDasharray="4 4" markerEnd={`url(#${id})`}/>
      <circle cx={p.end[0]} cy={p.end[1]} r="4" fill="#ff9d81" stroke="#ffe0cc" strokeWidth="1"/>
    </svg>
    <span className="visual-caption">{p.caption}</span>
  </span>;
}

// Sample trajectories explain each variation; pace/flight do not prescribe a fixed length.
const pacePaths = [
  {bounce:[172,104],before:"M22 26 Q105 57 172 104",after:"M172 104 Q182 96 192 95",end:[192,95],caption:"At the toes",view:"SIDE VIEW"},
  {bounce:[123,104],before:"M22 26 Q75 56 123 104",after:"M123 104 Q158 68 192 79",end:[192,79],caption:"Good length",view:"SIDE VIEW"},
  {bounce:[132,59],before:"M22 80 Q86 80 132 59",after:"M132 59 L191 37",end:[191,37],caption:"Swing away in the air",view:"TOP VIEW"},
  {bounce:[77,104],before:"M22 26 Q48 56 77 104",after:"M77 104 Q132 24 192 42",end:[192,42],caption:"Short, rising high",view:"SIDE VIEW"},
  {bounce:[123,104],before:"M22 26 Q69 48 123 104",after:"M123 104 Q158 78 192 87",end:[192,87],caption:"Less pace · sample length",view:"SIDE VIEW"},
  {bounce:null,before:"M22 26 Q107 42 192 80",after:"",end:[192,80],caption:"No bounce before the bat",view:"SIDE VIEW"},
];
const spinPaths = [
  {bounce:[125,55],before:"M22 58 Q75 45 125 55",after:"M125 55 Q158 67 191 83",end:[191,83],caption:"Off break · turns in",view:"TOP VIEW"},
  {bounce:[125,75],before:"M22 70 Q74 84 125 75",after:"M125 75 Q158 55 191 36",end:[191,36],caption:"Leg break · turns away",view:"TOP VIEW"},
  {bounce:[125,70],before:"M22 58 Q72 79 125 70",after:"M125 70 Q158 75 191 91",end:[191,91],caption:"Wrong’un · turns back in",view:"TOP VIEW"},
  {bounce:[123,104],before:"M22 37 Q86 4 123 104",after:"M123 104 Q151 33 192 51",end:[192,51],caption:"Dips, then extra bounce",view:"SIDE VIEW"},
  {bounce:[125,63],before:"M22 63 L125 63",after:"M125 63 L191 63",end:[191,63],caption:"Skids on straight",view:"TOP VIEW"},
  {bounce:[151,104],before:"M22 37 Q101 -18 151 104",after:"M151 104 Q171 73 192 88",end:[192,88],caption:"Higher flight · sample length",view:"SIDE VIEW"},
];

export function DeliveryIllustration({mode,index}:{mode:Mode;index:number}) {
  const id=useId(),p=(mode==="pace"?pacePaths:spinPaths)[index],top=p.view==="TOP VIEW";
  return <span className="cricket-visual delivery-visual">
    <svg viewBox="0 0 220 130" aria-hidden="true" focusable="false">
      <defs><marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="#cefa69"/></marker></defs>
      <text x="12" y="14" className="diagram-view">{p.view}</text>
      {top?<>
        <rect x="19" y="39" width="183" height="49" rx="3" fill="#33453c"/>
        <path d="M35 39 V88 M177 39 V88" stroke="#829082" strokeWidth="1.2"/>
        <path d="M19 63 H202" stroke="#a8ba9f" opacity=".18" strokeDasharray="3 4"/>
        <path d="M195 57 V69 M199 57 V69 M203 57 V69" stroke="#d1d8ba" strokeWidth="2"/>
        <text x="160" y="28" className="diagram-side">OFF SIDE</text>
        <text x="160" y="105" className="diagram-side">LEG SIDE</text>
      </>:<>
        <path d="M16 104 H205 L214 119 H10 Z" fill="#33453c"/>
        <path d="M16 104 H205 M171 104 L177 119" stroke="#829082" strokeWidth="1.2"/>
        <g stroke="#d1d8ba" strokeWidth="2"><path d="M199 75 V104 M204 75 V104 M209 75 V104 M197 74 H211"/></g>
        <g fill="none" stroke="#607d77" strokeLinecap="round"><circle cx="189" cy="40" r="6" fill="#607d77" stroke="none"/><path d="M188 52 L189 75 M189 75 L180 100 M189 75 L194 100 M188 56 L178 73" strokeWidth="5"/></g>
        <text x="13" y="128" className="diagram-side">BOWLER</text><text x="163" y="128" className="diagram-side">BATTER</text>
      </>}
      <path d={p.before} fill="none" stroke="#78b7c7" strokeWidth="2.5" strokeDasharray="4 4"/>
      {p.after&&<path d={p.after} fill="none" stroke="#cefa69" strokeWidth="2.5" markerEnd={`url(#${id})`}/>}
      {!p.after&&<path d={p.before} fill="none" stroke="#cefa69" strokeWidth="2" markerEnd={`url(#${id})`}/>}
      {p.bounce&&<g><ellipse cx={p.bounce[0]} cy={p.bounce[1]} rx="10" ry={top?7:3.5} fill="#ffd68a" opacity=".16"/><circle cx={p.bounce[0]} cy={p.bounce[1]} r="4.5" fill="#ffd68a" stroke="#fff2cf" strokeWidth="1.5"/></g>}
      <circle cx={p.end[0]} cy={p.end[1]} r="3.5" fill="#ff9d81"/>
      {mode==="pace"&&index===4&&<path d="M59 36 H71 M55 43 H65 M51 50 H59" stroke="#78b7c7" strokeWidth="2" strokeLinecap="round"/>}
    </svg>
    <span className="visual-caption">{p.caption}</span>
  </span>;
}
