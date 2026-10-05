import type { Metadata } from "next";import "./globals.css";
export const metadata: Metadata = {title:"SIX & OUT — Multiplayer Cricket Duel",description:"Challenge a friend to a cricket duel. Win the toss, pick your shot or delivery, and play one to six overs in your own room.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>;}
