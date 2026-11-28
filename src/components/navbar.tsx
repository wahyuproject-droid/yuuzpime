"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Search, CalendarDays, History, Settings2, Menu, X, ChevronRight, UserRound } from "lucide-react";
import SearchBar from "./search-bar";

const links = [
 {href:"/", label:"Home", icon:Home},
 {href:"/search", label:"Cari", icon:Search},
 {href:"/#schedule", label:"Jadwal", icon:CalendarDays},
 {href:"/history", label:"Riwayat", icon:History},
];
export default function NavBar(){
 const pathname=usePathname();
 const [panel,setPanel]=useState<"menu"|"settings"|null>(null);
 const [reduce,setReduce]=useState(false);
 useEffect(()=>{try{const value=localStorage.getItem("yuuz-reduce-motion")==="true";setReduce(value);document.documentElement.classList.toggle("yuuz-reduced",value);}catch{}},[]);
 useEffect(()=>{setPanel(null)},[pathname]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setPanel(null)};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[]);
 function motion(value:boolean){setReduce(value);document.documentElement.classList.toggle("yuuz-reduced",value);try{localStorage.setItem("yuuz-reduce-motion",String(value))}catch{}}
 return <>
 <header className="yuuz-top">
  <div className="yuuz-top-inner">
   <Link href="/" onClick={()=>setPanel(null)} className="yuuz-brand" aria-label="YuuZPime beranda"><Image src="/yuuz-logo.svg" width={34} height={34} alt=""/><span>YuuZPime</span></Link>
   <div className="yuuz-search"><SearchBar onAnimeClick={()=>setPanel(null)}/></div>
   <button type="button" className="yuuz-icon-button" aria-label="Pengaturan" aria-expanded={panel==="settings"} onClick={()=>setPanel(panel==="settings"?null:"settings")}><Settings2 size={18}/></button>
   <button type="button" className="yuuz-icon-button" aria-label="Menu" aria-expanded={panel==="menu"} onClick={()=>setPanel(panel==="menu"?null:"menu")}>{panel==="menu"?<X size={19}/>:<Menu size={19}/>}</button>
  </div>
  {panel&&<><button type="button" className="yuuz-menu-backdrop" aria-label="Tutup menu" onClick={()=>setPanel(null)}/><div className="yuuz-menu" role="dialog" aria-label={panel==="menu"?"Menu":"Pengaturan"}>
   <div className="flex items-center justify-between pb-3 border-b border-white/10"><div className="flex items-center gap-2"><Image src="/yuuz-logo.svg" width={28} height={28} alt=""/><strong>{panel==="menu"?"YuuZPime":"Pengaturan"}</strong></div><button className="yuuz-icon-button" aria-label="Tutup" onClick={()=>setPanel(null)}><X size={18}/></button></div>
   <div className="flex items-center gap-3 py-4 text-sm"><UserRound size={18}/><div>Mode tamu<p className="text-xs text-neutral-400">Tanpa login</p></div></div>
   {panel==="menu"?<div className="space-y-1">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} onClick={()=>setPanel(null)} className="yuuz-menu-link"><Icon size={18}/>{label}<ChevronRight className="ml-auto text-neutral-500" size={16}/></Link>)}<button className="yuuz-menu-link w-full" onClick={()=>setPanel("settings")}><Settings2 size={18}/>Pengaturan<ChevronRight className="ml-auto" size={16}/></button></div>:<label className="flex gap-3 items-center justify-between rounded-xl bg-white/5 p-3 text-sm"><span>Kurangi animasi<p className="text-xs text-neutral-400 mt-1">Untuk perangkat yang lebih lambat</p></span><input type="checkbox" checked={reduce} onChange={e=>motion(e.target.checked)} className="h-5 w-5 accent-white"/></label>}
  </div></>}
 </header>
 <nav className="yuuz-dock yuuz-glass" aria-label="Navigasi utama">{links.map(({href,label,icon:Icon})=>{const active=href!=="/#schedule"&&(href==="/"?pathname==="/":pathname.startsWith(href));return <Link key={href} href={href} aria-current={active?"page":undefined} className={"yuuz-dock-link"+(active?" active":"")}><Icon size={20} strokeWidth={active?2.5:1.8}/><span>{label}</span></Link>})}</nav>
 </>
}
