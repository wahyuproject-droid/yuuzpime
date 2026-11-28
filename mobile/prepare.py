import hashlib, pathlib, zipfile, sys, json, re, shutil
with zipfile.ZipFile(sys.argv[1]) as z:
    files={n.split('/',1)[1]:z.read(n) for n in z.namelist() if not n.endswith('/')}
h=hashlib.sha256()
for p,b in sorted(files.items()):
    h.update(p.encode()+b'\0'+hashlib.sha256(b).digest())
assert len(files)==214 and h.hexdigest()=="f3fc0534e2e729ec82b43956ae6c7f56bf89e2a0541a90526cec0317461b353f","Original Kitsune archive mismatch"
root=pathlib.Path(sys.argv[2])
for p,b in files.items():
    dest=root/p
    assert dest.resolve().is_relative_to(root.resolve())
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(b)
mobile=pathlib.Path(__file__).resolve().parent
for name in ['android-main.tsx','android-link.tsx','android-image.tsx','mobile.css']:
    shutil.copyfile(mobile/name,root/'src'/name)
for name in ['index.html','vite.config.ts']:
    shutil.copyfile(mobile/name,root/name)
shutil.copyfile(mobile/'android-anilist.ts',root/'src/lib/android-anilist.ts')
original=files['src/lib/anilist.ts'].decode()
fragment=original[original.index('const MEDIA_LIST_FRAGMENT ='):original.index('export async function anilistQuery')]
normalizer=original[original.index('export function normalizeMediaList'):original.index('export async function fetchSpotlight')]
normalizer=normalizer.replace('.map(normalizeMediaList)', '.filter((m:any)=>m.isAdult===false && !m.genres?.some((g:string)=>["Hentai","Ecchi","Erotica"].includes(g))).map(normalizeMediaList)')
(root/'src/lib/kitsune-browser-core.ts').write_text((mobile/'browser-core.ts').read_text()+'\n'+fragment+'\n'+normalizer)
(root/'src/query/get-anime-schedule.ts').write_text('import { useQuery } from "@tanstack/react-query";\nimport { getAniListAnimeSchedule } from "@/lib/android-anilist";\nexport const useGetAnimeSchedule=(date?:string)=>useQuery({queryKey:["schedule",date],queryFn:()=>getAniListAnimeSchedule(date),staleTime:300000,retry:false});\n')
for p in ['public/sw.js','public/workbox-4754cb34.js','public/manifest.json']:
    (root/p).unlink(missing_ok=True)
(root/'public/yuuz-logo.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><rect width="108" height="108" rx="22" fill="#101010"/><path fill="#fff" d="M22 25H37L54 48 71 25H86L61 60V83H47V60Z"/></svg>')
(root/'public/LICENSE.txt').write_bytes(files['LICENSE'])
pkg=json.loads((root/'package.json').read_text())
keep=['react','react-dom','@radix-ui/react-slot','@radix-ui/react-icons','@radix-ui/react-tabs','@radix-ui/react-progress','class-variance-authority','clsx','tailwind-merge','embla-carousel-react','lucide-react','tailwindcss-animate','@tanstack/react-query','framer-motion']
pkg={'name':'yuuzpime-kitsune','version':'4.0.0','private':True,'scripts':{'build':'vite build'},'dependencies':{k:pkg['dependencies'][k] for k in keep},'devDependencies':{'vite':'6.4.1','typescript':'^5.9','tailwindcss':'^3.4.1','postcss':'^8','autoprefixer':'^10'}}
(root/'package.json').write_text(json.dumps(pkg))
(root/'package-lock.json').unlink(missing_ok=True)
(root/'postcss.config.mjs').write_text('export default {plugins:{tailwindcss:{},autoprefixer:{}}};\n')
tailwind=root/'tailwind.config.ts'
tailwind.write_text(tailwind.read_text().replace('content: [','content: [\n "./src/android-main.tsx",'))
css=root/'src/app/globals.css'
css.write_text(css.read_text().replace('@import "tailwindcss";','@tailwind base;\n@tailwind components;\n@tailwind utilities;').replace('@config "../../tailwind.config.ts";',''))
for p in ['src/components/hero-section.tsx','src/components/anime-card.tsx','src/components/anime-sections.tsx','src/components/featured-collection.tsx','src/components/featured-collection-card.tsx','src/components/anime-schedule.tsx','src/components/common/character-card.tsx']:
    f=root/p
    s=f.read_text()
    s=s.replace('h-[80vh]','h-[80vh] mobile-hero').replace('bg-[#e9376b]','bg-[#303030]').replace('text-[#e9376b]','text-neutral-200').replace('border-[#e9376b]','border-neutral-500').replace('⭐ ','').replace('Learn More','Detail Anime')
    s=re.sub(r'(indigo|violet|cyan|blue|slate)-([0-9]+)',r'neutral-\2',s)
    f.write_text(s)
(root/'src/components/ui/blur-fade.tsx').write_text('import type { ReactNode } from "react";\nexport default function BlurFade({children,className}: {children:ReactNode;className?:string;[key:string]:unknown}){return <div className={className}>{children}</div>}\n')
print('Verified 214 original Kitsune files; compiling original UI with browser catalog adapter.')
