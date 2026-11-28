"use client";
import { useState,useEffect,useMemo,Suspense } from "react";
import dynamic from "next/dynamic";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {ArrowLeft,ChevronLeft,ChevronRight,Play,RefreshCw,ExternalLink,Film} from "lucide-react";
import {useGetAnimeDetails} from "@/query/get-anime-details";
import type {IEpisodeSource,IEpisodeServers} from "@/types/episodes";
import type Artplayer from "artplayer";
const KitsunePlayer=dynamic(()=>import("@/components/kitsune-player"),{ssr:false});
type Provider={site:string;title:string;url:string};
type MediaSource={url:string;type:"mp4"|"m3u8";subtitle?:string;introEnd?:number;outroStart?:number};
const btn="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1b1b1b] px-3 py-2 text-sm disabled:opacity-35";
const allowed=["crunchyroll.com","netflix.com","hidive.com","disneyplus.com","iq.com","bilibili.tv","primevideo.com","hulu.com"];
function https(raw:unknown){if(typeof raw!=="string")return "";try{const u=new URL(raw);return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}catch{return "";}}
function official(raw:string){try{const u=new URL(raw);return !!https(raw)&&allowed.some(d=>u.hostname===d||u.hostname.endsWith("."+d));}catch{return false;}}
async function lookup(id:string,ep:number,signal:AbortSignal){
 const r=await fetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query:"query($id:Int){Media(id:$id,type:ANIME,isAdult:false){isAdult genres externalLinks{site url} streamingEpisodes{title site url}}}",variables:{id:Number(id)}}),signal});
 if(!r.ok)throw Error("Katalog sedang tidak tersedia");
 const j=await r.json(),m=j.data?.Media;
 if(!m||m.isAdult!==false||m.genres?.some((g:string)=>["Hentai","Erotica","Ecchi"].includes(g)))return [];
 const out:Provider[]=[];
 for(const x of m.streamingEpisodes||[]){const n=String(x.title||"").match(/(?:episode|ep\.?)[\s:#-]*(\d+)/i);if(n&&Number(n[1])===ep&&official(x.url))out.push({site:x.site,title:x.title,url:x.url});}
 for(const x of m.externalLinks||[]){if(official(x.url)&&!out.some(y=>y.site===x.site))out.push({site:x.site,title:"Halaman serial",url:x.url});}
 return out.filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i);
}
async function loadSource(id:string,ep:number,signal:AbortSignal):Promise<MediaSource|null>{
 const response=await fetch("/licensed-episodes.json",{signal});
 if(!response.ok)return null;
 const j=await response.json(),s=j?.series?.[id]?.episodes?.[String(ep)];
 if(!s||!https(s.url)||!["mp4","m3u8"].includes(s.type))return null;
 return {url:https(s.url),type:s.type,subtitle:https(s.subtitle)||undefined,introEnd:Math.max(0,Number(s.introEnd)||0),outroStart:Math.max(0,Number(s.outroStart)||0)};
}
function Watch(){
 const p=useSearchParams(),id=p.get("anime")||"",ep=Math.max(1,Math.min(10000,Math.floor(Number(p.get("ep")||p.get("episode"))||1)));
 const {data}=useGetAnimeDetails(/^\d+$/.test(id)?id:"");
 const info=data?.anime?.info,title=info?.name||"Watch";
 const total=Math.min(10000,Math.max(0,Number(info?.stats?.episodes?.sub)||0));
 const [media,setMedia]=useState<MediaSource|null>(null),[links,setLinks]=useState<Provider[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[reload,setReload]=useState(0),[autoSkip,setAutoSkip]=useState(false),[range,setRange]=useState(Math.floor((ep-1)/50));
 const key="yuuzpime-watch:"+id+":"+ep;
 useEffect(()=>{setRange(Math.floor((ep-1)/50))},[ep]);
 useEffect(()=>{
 const c=new AbortController();let live=true;
 setMedia(null);setLinks([]);setLoading(true);setError("");
 const timer=setTimeout(()=>c.abort(),10000);
 if(!/^\d+$/.test(id)){setLoading(false);setError("Pilih anime dari katalog.");clearTimeout(timer);return;}
 Promise.allSettled([lookup(id,ep,c.signal),loadSource(id,ep,c.signal)]).then(([a,b])=>{if(!live)return;if(a.status==="fulfilled")setLinks(a.value);else setError("Informasi penyedia sedang tidak tersedia.");if(b.status==="fulfilled")setMedia(b.value);setLoading(false);}).finally(()=>clearTimeout(timer));
 return()=>{live=false;c.abort();clearTimeout(timer)};
 },[id,ep,reload]);
 const source=useMemo<IEpisodeSource>(()=>({headers:{Referer:""},sources:media?[{url:media.url,type:media.type}]:[],subtitles:media?.subtitle?[{url:media.subtitle,lang:"Subtitle",default:true}]:[],intro:{start:0,end:media?.introEnd||0},outro:{start:media?.outroStart||0,end:0},anilistID:Number(id)||0,malID:0}),[media,id]);
 const server=useMemo<IEpisodeServers>(()=>({episodeId:String(ep),episodeNo:String(ep),sub:[],dub:[],raw:[]}),[ep]);
 function connect(art:Artplayer){
 art.on("ready",()=>{try{const t=Number(localStorage.getItem(key));if(t>0&&t<art.duration-2)art.seek=t}catch{}});
 let last=0;const save=()=>{try{localStorage.setItem(key,String(art.currentTime));if(id&&info&&art.currentTime>=10){const raw=JSON.parse(localStorage.getItem("watched")||"[]");const list=Array.isArray(raw)?raw:[];const old=list.find((x:any)=>x.anime?.id===id);localStorage.setItem("watched",JSON.stringify([...list.filter((x:any)=>x.anime?.id!==id).slice(-99),{anime:{id,title,poster:info.poster},episodes:[...new Set([...(Array.isArray(old?.episodes)?old.episodes:[]),String(ep)])]}]));}}catch{}};
 art.on("video:timeupdate",()=>{if(Date.now()-last>10000){last=Date.now();save()}});art.on("video:pause",save);art.on("video:ended",save);
 }
 const href=(n:number)=>"/anime/watch?anime="+encodeURIComponent(id)+"&ep="+n;
 return <section className="yuuz-watch">
 <Link href={id?"/anime/"+encodeURIComponent(id):"/"} className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"><ArrowLeft size={16}/> Detail anime</Link>
 <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
 <div className="min-w-0 space-y-4">
 <div className="yuuz-screen">
 {media?<KitsunePlayer key={key+media.url} episodeInfo={source} animeInfo={{id,title,image:info?.poster||""}} subOrDub="sub" serversData={server} autoSkip={autoSkip} getInstance={connect} onError={()=>setError("Video gagal dimuat. Coba lagi.")}/>:<div className="yuuz-unavailable">{info?.bannerImage&&<img className="yuuz-screen-bg" src={info.bannerImage} alt=""/>}<div className="yuuz-screen-message"><div className="yuuz-play-symbol">{loading?<RefreshCw size={24} className="animate-spin"/>:<Play size={24}/>}</div><strong>{loading?"Mencari sumber": "Sumber belum tersedia"}</strong><p>{loading?"Memuat informasi episode…":"Belum ada video yang dapat diputar di sini."}</p>{!loading&&<button className={btn} onClick={()=>setReload(v=>v+1)}><RefreshCw size={15}/> Coba lagi</button>}</div></div>}
 </div>
 <div className="flex items-start gap-3 justify-between"><div className="min-w-0"><p className="text-[11px] tracking-widest text-neutral-400 uppercase">Episode {ep}</p><h1 className="mt-1 text-xl sm:text-3xl font-extrabold leading-tight break-words">{title}</h1></div><span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-neutral-300">{media?"Online":"Watch"}</span></div>
 <div className="flex items-center justify-between gap-2">{ep>1?<Link className={btn} href={href(ep-1)}><ChevronLeft size={16}/> Prev</Link>:<button className={btn} disabled><ChevronLeft size={16}/> Prev</button>}<span className="text-sm font-bold">EP {ep}{total>0?" / "+total:""}</span>{total>0&&ep<total?<Link className={btn} href={href(ep+1)}>Next <ChevronRight size={16}/></Link>:<button className={btn} disabled>Next <ChevronRight size={16}/></button>}</div>
 {error&&<p role="status" className="text-xs text-neutral-400">{error}</p>}
 <div className="yuuz-panel space-y-3"><h2 className="font-semibold text-base">Sumber online</h2>{media?<div className="flex items-center justify-between gap-2 text-sm"><span>Player YuuZPime</span><span className="rounded-lg bg-white/10 px-2 py-1 text-xs">{media.type.toUpperCase()}</span></div>:links.length?<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{links.map(x=><a className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm" key={x.url} href={x.url} target="_blank" rel="noopener noreferrer"><span>{x.site}<small className="block text-neutral-400">{x.title}</small></span><ExternalLink size={16} className="shrink-0"/></a>)}</div>:<p className="text-sm text-neutral-400">{loading?"Memuat sumber…":"Belum ada sumber untuk episode ini."}</p>}{media&&<label className="flex gap-2 items-center text-xs text-neutral-300"><input type="checkbox" checked={autoSkip} onChange={e=>setAutoSkip(e.target.checked)}/> Auto skip intro / outro</label>}{!media&&links.length>0&&<p className="text-xs text-neutral-400">Tautan membuka penyedia resmi, bukan player internal.</p>}</div>
 </div>
 <aside className="yuuz-panel self-start space-y-4"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><Film size={18}/> Episodes</h2><span className="text-xs text-neutral-400">{total||"—"}</span></div>
 {total>50&&<select className="w-full rounded-xl border border-white/10 bg-[#1b1b1b] p-2 text-sm" aria-label="Rentang episode" value={Math.min(range,Math.ceil(total/50)-1)} onChange={e=>setRange(Number(e.target.value))}>{Array.from({length:Math.ceil(total/50)},(_,i)=><option key={i} value={i}>{i*50+1}–{Math.min(total,(i+1)*50)}</option>)}</select>}
 {total>0?<div className="grid grid-cols-5 gap-2">{Array.from({length:Math.max(0,Math.min(50,total-range*50))},(_,i)=>range*50+i+1).map(n=><Link key={n} href={href(n)} aria-current={n===ep?"page":undefined} className={"yuuz-episode"+(n===ep?" active":"")}>{n}</Link>)}</div>:<p className="text-sm text-neutral-400">Jumlah episode belum diketahui.</p>}
 <p className="text-xs text-neutral-500">Nomor episode mengikuti katalog, bukan jaminan video tersedia.</p></aside></div>
 </section>
}
export default function Page(){return <Suspense fallback={<section className="yuuz-watch text-neutral-400">Memuat Watch…</section>}><Watch/></Suspense>}
