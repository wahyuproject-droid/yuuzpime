import hashlib, json, zipfile, pathlib, sys, re

with zipfile.ZipFile(sys.argv[1]) as z:
    files={n.split('/',1)[1]:z.read(n) for n in z.namelist() if not n.endswith('/')}
h=hashlib.sha256()
for path,data in sorted(files.items()):
    h.update(path.encode()+b'\0'+hashlib.sha256(data).digest())
assert len(files)==253 and h.hexdigest()=="0aa35b5e4a6fd563a026cf30259c7950e836340bee0830993687d41f97878c69", "Source archive differs from supplied ZIP"
# Keep project source/assets, omit private tooling state and upstream automation.
files={p:b for p,b in files.items() if not p.startswith((".omo/",".github/workflows/")) and p!="tsconfig.tsbuildinfo"}
def change(path,old,new):
    assert old.encode() in files[path], (path,old[:60])
    files[path]=files[path].replace(old.encode(),new.encode())
def write(path,content):
    files[path]=content.encode()
package=json.loads(files["package.json"])
package["name"]="yuuzpime"
package["scripts"]["dev"]="next dev"
package["scripts"]["start"]="next start"
package["engines"]={"node":"22.x"}
write("package.json",json.dumps(package,indent=2)+"\n")
lock=json.loads(files["package-lock.json"])
lock["name"]="yuuzpime"
lock["packages"][""]["name"]="yuuzpime"
lock["packages"][""]["engines"]={"node":"22.x"}
write("package-lock.json",json.dumps(lock,indent=2)+"\n")
write("vercel.json",json.dumps({"framework":"nextjs","installCommand":"npm ci --no-audit --no-fund","buildCommand":"npm run build"},indent=2)+"\n")
change("LICENSE","Copyright (c) 2026 Irvan Farael Hanafi","Copyright (c) 2026 Irvan Farael Hanafi\nModifications (c) 2026 YuuZGilakPrompt")
for p in ["src/components/layout/Navbar.tsx","src/components/layout/Footer.tsx","src/components/pwa/PWAInstallBanner.tsx","src/lib/metadata.ts","src/app/page.tsx","src/app/search/page.tsx","src/views/WatchPage.tsx","src/app/api/health/route.ts","public/manifest.json"]:
    for old in ("EliasDex","Eliasdex"):
        files[p]=files[p].replace(old.encode(),b"YuuZPime")
change("src/components/layout/Footer.tsx",'Elias<span className="text-orange-400">Dex</span>','YuuZ<span className="text-orange-400">Pime</span>')
change("src/components/layout/Footer.tsx","<span>Powered by Next.js</span>",'<span>Modifikasi: YuuZGilakPrompt · <a href="https://sociabuzz.com/yuuzdisini" target="_blank" rel="noopener noreferrer" className="underline">SociaBuzz</a> · MIT · Original: Irvan Farael Hanafi</span>')
change("src/lib/metadata.ts","https://eliasdex.farelhanafi.my.id","https://yuuzpime.vercel.app")
change("src/lib/metadata.ts","@YuuZPimeAnime","")
change("public/manifest.json",'"theme_color": "#f97316"','"theme_color": "#101010"')
css=files["src/app/globals.css"].decode().replace("#0a0e27","#101010").replace("#141a3e","#202020").replace("#F0EDE8","#f2f2f2").replace("#FAF8F5","#ffffff").replace("#2C2C34","#252525").replace("#C8C2B8","#d4d4d4").replace("59, 91, 253","155, 155, 155")
css+="""
/* YuuZPime monochrome accents; retain the original layout and all states. */
@theme {
  --color-orange-50: #fafafa;
  --color-orange-100: #f5f5f5;
  --color-orange-200: #e5e5e5;
  --color-orange-300: #d4d4d4;
  --color-orange-400: #bdbdbd;
  --color-orange-500: #737373;
  --color-orange-600: #525252;
  --color-orange-700: #404040;
  --color-orange-800: #262626;
  --color-orange-900: #171717;
  --color-orange-950: #0a0a0a;
}
[data-theme="light"] .text-orange-300,
[data-theme="light"] .text-orange-400,
[data-theme="light"] .text-orange-500 { color: #404040; }
"""
write("src/app/globals.css",css)
nav=files["src/components/layout/Navbar.tsx"].decode()
nav,n=re.subn(r'<ShadcnButton\b(?=[^>]*onClick=\{\(\) => handleNav\(\'/login\'\)\})[^>]*>\s*Sign In\s*</ShadcnButton>', '<span className="text-xs text-ink-500 px-3">Guest</span>',nav)
assert n==2,n
write("src/components/layout/Navbar.tsx",nav)
# Guest is a real unauthenticated session, never an invented privileged account.
change("src/components/providers/AppProviders.tsx","<SessionProvider>","<SessionProvider session={null} refetchOnWindowFocus={false} refetchInterval={0}>")
change("src/lib/auth.ts","  return getServerSession(authOptions);","  if (!DB_ENABLED || !(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET)) return null;\n  return getServerSession(authOptions);")
for p in ["src/app/login/page.tsx","src/app/register/page.tsx"]:
    write(p,'import { redirect } from "next/navigation";\n\nexport default function Page() {\n  redirect("/");\n}\n')
# Do not expose account/profile or admin functionality without authentication.
# Keep original routes and server checks, but do not run social widgets in guest mode.
change("src/app/layout.tsx","import { GlobalChatWidget } from '@/components/chat/GlobalChatWidget';\n","")
change("src/app/layout.tsx","          <GlobalChatWidget />\n","")
write("README.md","# YuuZPime\n\nModifikasi EliasDex 2 (MIT) oleh YuuZGilakPrompt. Original copyright Irvan Farael Hanafi. [SociaBuzz](https://sociabuzz.com/yuuzdisini).\n\nMode tamu tanpa login: katalog, watchlist dan histori lokal. Akun, sinkronisasi cloud, dan chat tidak aktif pada mode tamu. Backend, player, dan sumber asli dipertahankan; ketersediaan video tergantung penyedia yang berwenang. Node 22, npm ci, npm run build. Vercel Next.js.\n\n---\n\n"+files["README.md"].decode())
root=pathlib.Path(sys.argv[2]).resolve()
for name,data in files.items():
    dest=root/name
    assert dest.resolve().is_relative_to(root)
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(data)
print(f"Verified original 253-file ZIP; prepared {len(files)} files for guest deployment")
