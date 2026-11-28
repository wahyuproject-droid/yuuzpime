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
for name in ['android-main.tsx','android-link.tsx','android-image.tsx','mobile.css','android-navigation.ts','android-watch.tsx','android-online.ts']:
    shutil.copyfile(mobile/name,root/'src'/name)
for name in ['index.html','vite.config.ts']:
    shutil.copyfile(mobile/name,root/name)
shutil.copyfile(mobile/'android-anilist.ts',root/'src/lib/android-anilist.ts')
shutil.copyfile(mobile/'licensed-episodes.json',root/'public/licensed-episodes.json')
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
keep=['react','react-dom','@radix-ui/react-slot','@radix-ui/react-icons','@radix-ui/react-tabs','@radix-ui/react-progress','class-variance-authority','clsx','tailwind-merge','embla-carousel-react','lucide-react','tailwindcss-animate','@tanstack/react-query','framer-motion','@radix-ui/react-select','@radix-ui/react-separator','html-react-parser','artplayer','hls.js','sonner']
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

# Compile the original Kitsune detail route rather than a substitute page.
shutil.copyfile(mobile/'android-detail.ts',root/'src/lib/android-detail.ts')
detail=root/'src/app/anime/[slug]/page.tsx'
s=detail.read_text()
s=s.replace('import { useAuthStore } from "@/store/auth-store";','import { androidDetail, getSaved, saveMedia } from "@/lib/android-detail";')
s=s.replace('import useBookMarks from "@/hooks/use-get-bookmark";','')
a=s.index('  const { auth } = useAuthStore();')
b=s.index('  return isLoading || !anime ?',a)
s=s[:a]+'''  const [selected,setSelected]=useState(()=>getSaved().find((x:any)=>String(x.id)===String(slug))?.watchStatus||"");
  const handleSelect=async(value:string)=>{
    try{const raw=await androidDetail(String(slug));saveMedia(raw,value);setSelected(value);toast.success("Watchlist diperbarui");}
    catch{toast.error("Gagal menyimpan watchlist");}
  };
'''+s[b:]
s=s.replace('const { data: anime, isLoading }','const { data: anime, isLoading, isError, refetch }')
s=s.replace('return isLoading || !anime ? (','return isError ? <Container className="py-10"><p>Detail tidak tersedia.</p><button onClick={()=>refetch()} className="underline mt-3">Coba lagi</button></Container> : isLoading || !anime ? (')
s=s.replace('{auth && (','{(').replace('value={selected || normalizeStatus(bookmarks?.[0]?.status)}','value={selected}')
s=s.replace('h-[30vh] md:h-[40vh]','h-[31vh] md:h-[40vh] kitsune-detail-banner')
s=s.replace('from-slate-900 to-transparent','from-neutral-950 via-neutral-950/45 to-transparent')
s=s.replace('className="flex md:mt-[-9.375rem] mt-[-6.25rem] md:flex-row flex-col md:items-end md:gap-20 gap-10 "','className="kitsune-detail-head flex relative items-end gap-4 -mt-24 md:-mt-36"')
s=s.replace('className="shrink-0"','className="shrink-0 !w-full"')
s=s.replace('<AnimeCard\n            title=', '<div className="w-28 sm:w-44 shrink-0"><AnimeCard\n            title=',1)
s=s.replace('          />\n          <div className="flex flex-col md:gap-5 gap-2 pb-16">','          /></div>\n          <div className="flex min-w-0 flex-col gap-3 pb-1 flex-1">',1)
s=s.replace('md:text-5xl text-2xl md:font-black font-extrabold z-[9]','md:text-5xl text-xl leading-tight font-extrabold z-[9]')
s=s.replace('className="flex items-center gap-5"','className="flex flex-wrap items-center gap-2"')
s=s.replace('className="w-full"','className="w-full mt-6"',1)
s=s.replace('className="flex items-center justify-start w-fit text-2xl h-fit"','className="flex items-center justify-start w-full overflow-x-auto text-sm h-fit gap-1"')
s=s.replace('md:text-2xl text-lg font-semibold','text-sm md:text-xl font-semibold')
s=s.replace('className="w-full grid md:grid-cols-5 grid-cols-1 gap-x-20 gap-y-5 mt-10"','className="w-full grid md:grid-cols-5 grid-cols-1 gap-y-5 mt-5"')
s=s.replace('className="grid grid-cols-2 w-full md:text-base text-xs gap-y-2 gap-x-20 md:gap-x-0"','className="grid grid-cols-2 w-full text-sm gap-3 rounded-2xl border border-white/10 p-4 bg-neutral-900"')
s=s.replace('{parse(anime.anime.info.description || "")}','{String(anime.anime.info.description||"").replace(/<[^>]*>/g,"")}')
s=s.replace('<span className="capitalize">{}</span>','<span>{anime.anime.moreInfo.premiered}</span>')
s=s.replace('className="pt-20"','className="pt-8"')
detail.write_text(s)
# Reuse the original detail normalization, replacing only its remote info endpoint.
f=root/'src/query/get-anime-details.ts';s=f.read_text().replace('import { api } from "@/lib/api";','import { androidDetail } from "@/lib/android-detail";').replace('  const res = await api.get<MediaFull>(`/info/${animeId}`);\n  const media = res.data;','  const media = await androidDetail(animeId) as MediaFull;')
f.write_text(s)
# Episode numbers are metadata, not claims of available streams.
(root/'src/query/get-all-episodes.ts').write_text('import {useQuery} from "@tanstack/react-query";\nimport {androidDetail} from "@/lib/android-detail";\nexport function useGetAllEpisodes(id:string){return useQuery({queryKey:["episodes",id],queryFn:async()=>{const m=await androidDetail(id);const n=Math.min(1500,Math.max(0,Number(m.episodes)||0));return {totalEpisodes:n,episodes:Array.from({length:n},(_,i)=>({title:"Episode "+(i+1),episodeId:String(i+1),number:i+1,isFiller:false}))};},enabled:!!id,staleTime:300000});}\n')
(root/'src/components/watch-button.tsx').write_text('import {useParams} from "next/navigation";\nimport {ButtonLink} from "./common/button-link";\nimport {CirclePlay} from "lucide-react";\nexport default function WatchButton(){const {slug}=useParams();return <ButtonLink href={"/anime/watch?anime="+slug+"&ep=1"} LeftIcon={CirclePlay} className="bg-white text-black rounded-xl font-bold text-xs">Watch</ButtonLink>;}\n')
# Keep the original trailer modal, only accept YouTube IDs.
f=root/'src/components/watch-trailer.tsx';s=f.read_text().replace('if (!videoHref) return <></>;','if (!videoHref || !(/^https:\\/\\/www\\.youtube\\.com\\/watch\\?v=[A-Za-z0-9_-]{11}$/.test(videoHref))) return <></>;').replace('absolute md:flex hidden md:bottom-10','absolute flex md:bottom-10').replace('src={embedUrl}','src={embedUrl.replace("www.youtube.com","www.youtube-nocookie.com")} sandbox="allow-scripts allow-same-origin allow-presentation"').replace('accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share','autoplay; encrypted-media; picture-in-picture; fullscreen')
f.write_text(s)
# Episode card imports only local watched state and selected episode; no external account.
(root/'src/store/anime-store.ts').write_text('export const useAnimeStore=()=>({selectedEpisode:""});\n')
# Avoid malformed or stale history from earlier versions.
(root/'src/hooks/use-is-anime-watched.ts').write_text('export function useHasAnimeWatched(id:string,episode?:string){try{const keys=Object.keys(localStorage);const prefix="yuuzpime-progress:"+id+":";return {hasWatchedAnime:keys.some(k=>k.startsWith(prefix)),hasWatchedEpisode:!!episode&&Number(localStorage.getItem(prefix+episode))>0};}catch{return {hasWatchedAnime:false,hasWatchedEpisode:false}}}\n')
