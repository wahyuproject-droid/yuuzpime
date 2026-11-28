import hashlib, json, zipfile, pathlib, sys, re
with zipfile.ZipFile(sys.argv[1]) as z:
    files={n.split('/',1)[1]:z.read(n) for n in z.namelist() if not n.endswith('/')}
h=hashlib.sha256()
for p,b in sorted(files.items()):
    h.update(p.encode()+b'\0'+hashlib.sha256(b).digest())
assert len(files)==159 and h.hexdigest()=="db96945d482af21e4463fcf57982ae6e470fe4a397f61d4be8a2c83c11a68ae1", "Source archive differs from user's ZIP"
def write(p,s): files[p]=s.encode()
def read(p): return files[p].decode()
def replace(p,a,b):
    s=read(p)
    assert a in s,p
    write(p,s.replace(a,b))
pkg=json.loads(read("package.json"))
pkg["name"]="yuuzpime"
pkg["engines"]={"node":"22.x"}
pkg["dependencies"]["next"]="15.5.29"
pkg["devDependencies"]["eslint-config-next"]="15.5.29"
write("package.json",json.dumps(pkg,indent=2)+"\n")
write("vercel.json",json.dumps({"framework":"nextjs","installCommand":"npm install --no-audit --no-fund","buildCommand":"npm run build"},indent=2)+"\n")
replace("LICENSE","Copyright (c) 2026 Dovakiin0","Copyright (c) 2026 Dovakiin0\nModifications (c) 2026 YuuZ")
# Keep original files, but prevent arbitrary server-side requests and unverified external video playback.
write("src/app/api/proxy/route.ts",'''export async function GET() {
  return Response.json({error:"External video proxy is disabled."},{status:403});
}
''')
# Original player implementation remains in video-player-section.tsx and components/miru-player.tsx.
write("src/app/anime/watch/page.tsx",'''import Link from "next/link";
export default function Page() {
  return <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-center">
    <h1 className="text-lg font-bold">YuuZPime</h1>
    <p className="mt-3 text-sm text-neutral-400">Pemutaran langsung belum tersedia. Gunakan penyedia anime resmi yang memiliki izin.</p>
    <Link href="/" className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-sm font-bold text-black">Kembali ke beranda</Link>
  </section>;
}
''')
write("src/app/anime/watch/layout.tsx",'''import type { ReactNode } from "react";
import Container from "@/components/container";
export default function Layout({children}: {children: ReactNode}) {
  return <Container className="py-8">{children}</Container>;
}
''')
# No cloud account authentication in the public guest build.
write("src/store/auth-store.ts",'''import { create } from "zustand";
export type IAuth = { id:string; avatar:string; email:string; username:string; collectionId:string; collectionName:string; autoSkip:boolean; created?:string; };
export interface IAuthStore {
  auth: IAuth | null;
  setAuth: (state: IAuth) => void;
  clearAuth: () => void;
  isRefreshing: boolean;
  setIsRefreshing: (val:boolean) => void;
}
export const useAuthStore = create<IAuthStore>((set)=>({
  auth:null,
  setAuth:()=>set({auth:null}),
  clearAuth:()=>set({auth:null}),
  isRefreshing:false,
  setIsRefreshing:()=>set({isRefreshing:false}),
}));
export const useAuthHydrated = () => true;
''')
# Existing profile subcomponents import the type below; retain the public type but no remote lookup.
write("src/app/profile/[username]/page.tsx",'''import { redirect } from "next/navigation";
export type TargetProfileUser = { id:string; username:string; avatar:string; collectionId:string; collectionName:string; created:string; };
export default function ProfilePage(){redirect("/");}
''')
write("src/components/navbar.tsx",'''"use client";
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
''')
write("src/components/footer.tsx",'''import Link from "next/link";
export default function Footer(){
  return <footer className="mt-10 border-t border-white/10 bg-[#101010] px-4 py-8 text-center">
    <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold"><img src="/yuuz-logo.svg" alt="" width={32} height={32}/>YuuZPime</Link>
    <p className="mt-3 text-xs text-neutral-400">Modifikasi oleh YuuZ · <a className="underline" href="https://sociabuzz.com/yuuzdisini" target="_blank" rel="noopener noreferrer">SociaBuzz</a> · <a className="underline" href="https://github.com/wahyuproject-droid/yuuzpime/blob/main/LICENSE">MIT</a></p>
  </footer>;
}
''')
logo='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><rect width="108" height="108" rx="22" fill="#101010"/><path fill="#fff" d="M22 25H37L54 48 71 25H86L61 60V83H47V60Z"/></svg>\n'
write("public/yuuz-logo.svg",logo)
# Brand manifest and metadata, without using upstream cached icons.
m=json.loads(read("public/manifest.json"))
m.update(name="YuuZPime",short_name="YuuZPime",description="Anime discovery in guest mode",theme_color="#101010",background_color="#101010",icons=[{"src":"/yuuz-logo.svg","sizes":"any","type":"image/svg+xml","purpose":"any"}])
write("public/manifest.json",json.dumps(m,indent=2)+"\n")
s=read("src/app/layout.tsx").replace('import Script from "next/script";\n','')
s=s.replace('  const gaId = process.env.NEXT_PUBLIC_GA_ID;\n','')
s=re.sub(r'\{gaId && \([\s\S]*?\n        \)\}', '',s)
s=s.replace("Miru - Stream Anime with No Ads","YuuZPime — Anime Discovery").replace("Watch your favorite anime anywhere, anytime with ease and no ads on Miru.","Discover anime with YuuZPime, without login.").replace('"Miru"','"YuuZPime"').replace('%s | Miru','%s | YuuZPime').replace('/miru-logo.svg','/yuuz-logo.svg').replace('/icon-192x192.png','/yuuz-logo.svg')
write("src/app/layout.tsx",s)
# No PocketBase comment feed or comments in guest mode.
s=read("src/app/page.tsx").replace('import RecentCommentsSection from "@/components/recent-comments-section";','').replace('      <RecentCommentsSection />','')
write("src/app/page.tsx",s)
replace("src/components/hero-section.tsx","Stream this breathtaking title on Miru with zero ad interruptions and crisp playback.","Explore this anime on YuuZPime.")
# Explicitly prevent prerender search-params failure.
write("src/app/search/page.tsx",'''import Container from "@/components/container";
import { Suspense } from "react";
import SearchResults from "./search-results";
export default function Page(){return <Container><Suspense fallback={<p className="py-8 text-center">Loading...</p>}><SearchResults/></Suspense></Container>;}
''')
# Avoid legacy PWA build/cache interference after replacement. Existing old SW unregisters itself.
write("next.config.mjs",'''/** @type {import('next').NextConfig} */
const nextConfig = {reactStrictMode:true,images:{remotePatterns:[{protocol:"https",hostname:"**"}]}};
export default nextConfig;
''')
write("public/sw.js",'''self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(k=>k.startsWith('eliasdex-')||k.startsWith('yuuzpime-')||k.startsWith('workbox-')).map(k=>caches.delete(k)));
  await self.registration.unregister();
  await self.clients.claim();
})()));
''')
# Neutral theme keeps brand consistent; responsive light rendering on small devices.
css=read("src/app/globals.css")
css+='''
:root,.dark {
  --background: 0 0% 6%; --foreground: 0 0% 96%;
  --card: 0 0% 10%; --card-foreground: 0 0% 96%;
  --popover: 0 0% 12%; --popover-foreground: 0 0% 96%;
  --primary: 0 0% 91%; --primary-foreground: 0 0% 8%;
  --secondary: 0 0% 15%; --secondary-foreground: 0 0% 96%;
  --muted: 0 0% 15%; --muted-foreground: 0 0% 65%;
  --accent: 0 0% 18%; --accent-foreground: 0 0% 96%;
  --border: 0 0% 21%; --input: 0 0% 21%; --ring: 0 0% 65%;
}
body {background:#101010;color:#f5f5f5;background-image:none;}
.glass-panel,.glass-pill {background:#171717;backdrop-filter:none;-webkit-backdrop-filter:none;}
.text-gradient-miru {background:none;-webkit-text-fill-color:currentColor;color:white;}
@media(max-width:640px){body{background-attachment:scroll}.glass-panel,.glass-pill{box-shadow:none}img{max-width:100%}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
'''
write("src/app/globals.css",css)
write("README.md","# YuuZPime\n\nFull Miru Web source replacement, uploaded archive revision 15dd1b636d15f7bf740a4f768463a09c10411dda. Modified by YuuZ, original MIT attribution Dovakiin0 retained. Guest-only, neutral theme, local history source retained. Original player implementation retained but unverified video providers and open proxy not enabled. No Manga Hub in upstream. Node 22, npm install, npm run build. [SociaBuzz](https://sociabuzz.com/yuuzdisini).\n\n---\n\n"+read("README.md"))
root=pathlib.Path(sys.argv[2]).resolve()
for p,b in files.items():
    dest=root/p
    assert dest.resolve().is_relative_to(root)
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(b)
print(f"Verified 159 original ZIP files; prepared {len(files)} files")
