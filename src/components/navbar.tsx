"use client";
import Link from "next/link";
import SearchBar from "./search-bar";
import { Menu, X, Home, Search } from "lucide-react";
import { useState } from "react";
export default function NavBar(){
  const [open,setOpen]=useState(false);
  return <header className="sticky top-0 z-[100] border-b border-white/10 bg-[#101010]">
    <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:gap-5">
      <Link href="/" className="flex shrink-0 items-center gap-2 text-white" aria-label="YuuZPime home">
        <img src="/yuuz-logo.svg" alt="YuuZPime" width={34} height={34}/>
        <span className="hidden font-extrabold tracking-tight sm:block">YuuZPime</span>
      </Link>
      <div className="min-w-0 flex-1"><SearchBar/></div>
      <button className="shrink-0 rounded-lg p-2" aria-label="Menu" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    </div>
    {open&&<nav className="mx-auto flex max-w-[1400px] gap-3 border-t border-white/10 px-4 py-3 text-sm">
      <Link href="/" onClick={()=>setOpen(false)} className="flex items-center gap-2"><Home size={16}/> Home</Link>
      <Link href="/search" onClick={()=>setOpen(false)} className="flex items-center gap-2"><Search size={16}/> Katalog</Link>
      <span className="ml-auto text-neutral-400">Guest</span>
    </nav>}
  </header>;
}
