import hashlib, json, pathlib, re, sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
    files={n.split('/',1)[1]:z.read(n) for n in z.namelist() if not n.endswith('/')}
h=hashlib.sha256()
for p,b in sorted(files.items()): h.update(p.encode()+b'\0'+hashlib.sha256(b).digest())
assert len(files)==214 and h.hexdigest()=="f3fc0534e2e729ec82b43956ae6c7f56bf89e2a0541a90526cec0317461b353f"
def write(p,s): files[p]=s.encode()
def read(p): return files[p].decode()
def edit(p,a,b): 
    s=read(p); assert a in s,p; write(p,s.replace(a,b))
pkg=json.loads(read("package.json")); pkg["name"]="yuuzpime"; pkg["engines"]={"node":"22.x"};write("package.json",json.dumps(pkg,indent=2)+"\n")
lock=json.loads(read("package-lock.json"));lock["name"]="yuuzpime";lock["packages"][""]["name"]="yuuzpime";write("package-lock.json",json.dumps(lock,indent=2)+"\n")
write("vercel.json",'{"framework":"nextjs","installCommand":"npm ci --no-audit --no-fund","buildCommand":"npm run build"}\n')
write("src/app/anime/watch/page.tsx",pathlib.Path(sys.argv[3]).read_text())
write("src/app/anime/watch/layout.tsx",'import type {ReactNode} from "react";\nexport default function Layout({children}:{children:ReactNode}){return children;}\n')
# Keep original player but use direct media URLs and no external bypass/proxy.
p="src/lib/local-proxy.ts"
write(p,'''export const LOCAL_PROXY_BASE_URL = "";
export const COMPANION_UI_URL = "";
export const COMPANION_DOWNLOAD_URL = "";
export async function detectLocalProxy(_force=false):Promise<boolean>{return false;}
export function isLocalProxyActive(){return false;}
export async function resolveApiEndpoint(path:string){return "/api"+(path.startsWith("/")?path:"/"+path);}
export function buildStreamProxyUrl(options:{url:string;referer?:string;headers?:Record<string,string>;playlistKey?:string}){
  try{const u=new URL(options.url);if(u.protocol==="https:"||u.protocol==="blob:")return options.url;}catch{}return "";
}
''')
# Remove active provider API endpoints, preserve original implementations as source files.
for p in ["src/app/api/proxy/route.ts","src/app/api/watch/[...slug]/route.ts","src/app/api/map/[id]/route.ts","src/app/api/episodes/[...slug]/route.ts"]:
    write("reference/kitsune/"+p+".txt",read(p))
    write(p,'export async function GET(){return Response.json({error:"Provider not configured",providers:{},streams:[]},{status:503});}\n')
write("src/app/api/health/route.ts",'export async function GET(){return Response.json({ok:true,mode:"guest",player:"ArtPlayer",providers:[]});}\n')
p="src/components/kitsune-player.tsx"
s=read(p).replace("escape: false","escape: true")
s=s.replace('artplayerPluginAmbilight({\n          // Configure Ambilight\n          blur: "30", // Use numbers\n          opacity: 0.8,\n          frequency: 10,\n          duration: 0.3,\n          zIndex: -1,\n        }),','')
s=s.replace('import artplayerPluginAmbilight from "artplayer-plugin-ambilight";\n','')
write(p,s)
# Guest auth only, no network auth refresh, no login UI.
p="src/store/auth-store.ts"
s=read(p);s=s[:s.index("export const useAuthStore")]+'''export const useAuthStore = create<IAuthStore>((set)=>({
  auth:null,setAuth:()=>set({auth:null}),clearAuth:()=>set({auth:null}),isRefreshing:false,setIsRefreshing:()=>set({isRefreshing:false}),
}));
export const useAuthHydrated=()=>true;
'''
s=s.replace('import { useEffect, useState } from "react";\n','').replace('import { persist } from "zustand/middleware";\n','');write(p,s)
p="src/components/navbar.tsx";s=read(p)
a=s.index("  useEffect(() => {");b=s.index("\n  return (",a);s=s[:a]+s[b:]
s=s.replace('{auth.auth ? <NavbarAvatar auth={auth} /> : <LoginPopoverButton />}','<span className="text-xs text-neutral-400">Guest</span>').replace('Kitsunee','YuuZPime').replace('src="/icon.png"','src="/yuuz-logo.svg"').replace('width={70} height={70}','width={42} height={42}').replace('gap-20','gap-3').replace('to-pink-600','to-gray-200')
write(p,s)
p="src/app/profile/[username]/page.tsx";s=read(p);a=s.index("export type TargetProfileUser");b=s.index("\nfunction ProfilePage",a);write(p,'import {redirect} from "next/navigation";\n'+s[a:b]+'\nexport default function Page(){redirect("/");}\n')
p="src/app/layout.tsx";s=read(p);s=re.sub(r'        <Script[\s\S]*?</Script>\n','',s);s=s.replace('import Script from "next/script";\n','').replace('"Kitsune"','"YuuZPime"').replace('Kitsune | Anime Streaming','YuuZPime | Anime').replace('href="/icon.png" type="image/png" sizes="192x192"','href="/yuuz-logo.svg" type="image/svg+xml"').replace('enableSystem','enableSystem={false}');write(p,s)
p="src/app/page.tsx";s=read(p).replace('import RecentCommentsSection from "@/components/recent-comments-section";','').replace('      <RecentCommentsSection />','');write(p,s)
write("src/components/footer.tsx",'''import Link from "next/link";
export default function Footer(){return <footer className="border-t border-white/10 bg-neutral-950 p-8 text-center"><Link href="/" className="font-bold text-lg">YuuZPime</Link><p className="mt-2 text-xs text-neutral-400">Modifikasi YuuZ · <a href="https://sociabuzz.com/yuuzdisini" target="_blank" rel="noopener noreferrer">SociaBuzz</a> · <a href="https://github.com/wahyuproject-droid/yuuzpime/blob/main/LICENSE">MIT / Kitsune</a></p></footer>;}
''')
write("public/yuuz-logo.svg",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><rect width="108" height="108" rx="22" fill="#101010"/><path fill="#fff" d="M22 25H37L54 48 71 25H86L61 60V83H47V60Z"/></svg>')
m=json.loads(read("public/manifest.json"));m.update(name="YuuZPime",short_name="YuuZPime",theme_color="#101010",background_color="#101010",icons=[{"src":"/yuuz-logo.svg","sizes":"any","type":"image/svg+xml"}]);write("public/manifest.json",json.dumps(m,indent=2))
write("public/sw.js",'''self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{await Promise.all((await caches.keys()).filter(k=>/eliasdex|yuuzpime|workbox/i.test(k)).map(k=>caches.delete(k)));await self.registration.unregister();await self.clients.claim();})()));
''')
write("src/app/search/page.tsx",'import Container from "@/components/container";\nimport {Suspense} from "react";\nimport SearchResults from "./search-results";\nexport default function Page(){return <Container><Suspense fallback={<p>Loading...</p>}><SearchResults/></Suspense></Container>;}\n')
p="src/app/globals.css";write(p,read(p)+'''
.dark {--background:0 0% 6%;--card:0 0% 10%;--popover:0 0% 10%;--secondary:0 0% 15%;--muted:0 0% 15%;--accent:0 0% 18%;--border:0 0% 21%;--input:0 0% 21%;--ring:0 0% 65%;}
body{background:#101010;color:#f5f5f5}
@media(max-width:640px){.backdrop-blur-xl,.backdrop-blur-md{backdrop-filter:none!important}.shadow-xl,.shadow-2xl{box-shadow:none!important}}
''')
edit("LICENSE","Copyright (c) 2026 Dovakiin0","Copyright (c) 2026 Dovakiin0\nModifications (c) 2026 YuuZ")
# Avoid running upstream publisher workflows on the destination repository.
for p in list(files):
    if p.startswith(".github/workflows/"):
        files["reference/kitsune/"+p+".txt"]=files.pop(p)
write("README.md","# YuuZPime — Kitsune web edition\n\nVerified original 214-file Kitsune archive. Original components and source retained with guest branding and a direct ArtPlayer/HLS watch page for authorized media. Provider routes and Companion bypass disabled; no bundled streaming catalog. MIT attribution retained. Node 22, npm ci, npm run build.\n\n"+read("README.md"))
root=pathlib.Path(sys.argv[2]).resolve()
for p,b in files.items():
    dest=root/p;assert dest.resolve().is_relative_to(root);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
print("Verified exact 214-file Kitsune archive; prepared",len(files),"files")
