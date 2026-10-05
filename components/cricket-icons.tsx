type IconProps = {size?:number;className?:string};

export function BattingIcon({size=24,className=""}:IconProps) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`cricket-icon ${className}`} aria-hidden="true" focusable="false">
    <path d="M21 11 L27 5" strokeWidth="3"/>
    <path d="M24 6 L26 8 M22 8 L24 10" strokeWidth="1"/>
    <path d="M18 9 L23 14 L10 28 Q8 30 6 28 L4 26 Q2 24 4 22 Z" fill="currentColor" fillOpacity=".16"/>
    <path d="M17 15 L8 24" opacity=".55"/>
    <path d="M5 23 L9 27"/>
  </svg>;
}

function Ball({cx=16,cy=16,r=11}:{cx?:number;cy?:number;r?:number}) {
  return <g>
    <circle cx={cx} cy={cy} r={r} fill="currentColor" fillOpacity=".14"/>
    <path d={`M${cx-r*.38} ${cy-r*.9} C${cx+r*.45} ${cy-r*.2} ${cx-r*.45} ${cy+r*.2} ${cx+r*.38} ${cy+r*.9}`}/>
    <path d={`M${cx-r*.6} ${cy-r*.73} C${cx+r*.2} ${cy-r*.1} ${cx-r*.7} ${cy+r*.27} ${cx+r*.12} ${cy+r*.98}`} strokeWidth="1" strokeDasharray="1 2"/>
    <path d={`M${cx-r*.5} ${cy-r*.35} L${cx-r*.35} ${cy-r*.5}`} opacity=".65"/>
  </g>;
}

export function BowlingIcon({size=24,className=""}:IconProps) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`cricket-icon ${className}`} aria-hidden="true" focusable="false"><Ball r={12}/></svg>;
}

export function PaceIcon({size=64,className=""}:IconProps) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`cricket-icon ${className}`} aria-hidden="true" focusable="false">
    <path d="M3 8 H13 M1 16 H10 M4 24 H13"/>
    <path d="M1 11 H6 M7 28 H15" strokeWidth="1" opacity=".4"/>
    <Ball cx={21} cy={16} r={9}/>
  </svg>;
}

export function SpinIcon({size=64,className=""}:IconProps) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`cricket-icon ${className}`} aria-hidden="true" focusable="false">
    <Ball r={7}/>
    <path d="M5 12 A12 12 0 0 1 25 6 L28 9 M28 3 V9 H22"/>
    <path d="M27 20 A12 12 0 0 1 7 26 L4 23 M4 29 V23 H10"/>
  </svg>;
}
