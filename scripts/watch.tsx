"use client";
import {useState,useEffect,useMemo,useRef,Suspense} from "react";
import dynamic from "next/dynamic";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {useGetAnimeDetails} from "@/query/get-anime-details";
import type {IEpisodeSource,IEpisodeServers} from "@/types/episodes";
import type Artplayer from "artplayer";
const KitsunePlayer=dynamic(()=>import("@/components/kitsune-player"),{ssr:false});
const field="w-full rounded-xl border border-white/15 bg-neutral-900 px-3 py-2.5 text-sm";
const button="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black";
function Watch(){
 const p=useSearchParams(),id=p.get("anime")||"";
 const [ep,setEp]=useState(Math.max(1,Number(p.get("ep"))||1));
 const [url,setUrl]=useState(""),[input,setInput]=useState(""),[subtitle,setSubtitle]=useState(""),[err,setErr]=useState("");
 const [kind,setKind]=useState("mp4"),[autoSkip,setAutoSkip]=useState(false);
 const [introStart,setIntroStart]=useState(0),[introEnd,setIntroEnd]=useState(0),[outroStart,setOutroStart]=useState(0),[outroEnd,setOutroEnd]=useState(0);
 const owned=useRef<string[]>([]);
 const {data}=useGetAnimeDetails(id);
 const info=data?.anime?.info;
 const title=info?.name||"YuuZPime Watch";
 const key="yuuzpime-watch:"+id+":"+ep;
 useEffect(()=>()=>{owned.current.forEach(u=>URL.revokeObjectURL(u));},[]);
 const loadUrl=()=>{try{const u=new URL(input.trim());if(u.protocol!=="https:"||u.username||u.password)throw Error();const path=u.pathname.toLowerCase();if(!path.endsWith(".mp4")&&!path.endsWith(".m3u8")&&!path.endsWith(".webm"))throw Error();setKind(path.endsWith(".m3u8")?"m3u8":"mp4");setErr("");setUrl(u.href);}catch{setErr("Gunakan URL HTTPS langsung MP4, WebM, atau HLS (m3u8) dari sumber yang kamu punya izin untuk gunakan.");}};
 const source=useMemo<IEpisodeSource>(()=>({headers:{Referer:""},sources:url?[{url,type:kind}]:[],subtitles:subtitle?[{url:subtitle,lang:"Subtitle",default:true}]:[],intro:{start:introStart,end:introEnd},outro:{start:outroStart,end:outroEnd},anilistID:Number(id)||0,malID:0}),[url,kind,subtitle,introStart,introEnd,outroStart,outroEnd,id]);
 const server=useMemo<IEpisodeServers>(()=>({episodeId:String(ep),episodeNo:String(ep),sub:[],dub:[],raw:[]}),[ep]);
 function connect(art:Artplayer){
   art.on("ready",()=>{try{const t=Number(localStorage.getItem(key));if(t>0&&t<art.duration-2)art.seek=t;}catch{}});
   let last=0;const save=()=>{try{localStorage.setItem(key,String(art.currentTime));if(id&&info&&art.currentTime>=10){const list=JSON.parse(localStorage.getItem("watched")||"[]");const other=Array.isArray(list)?list.filter((x:any)=>x.anime?.id!==id):[];const old=Array.isArray(list)?list.find((x:any)=>x.anime?.id===id):null;localStorage.setItem("watched",JSON.stringify([...other.slice(-99),{anime:{id,title,poster:info.poster},episodes:[...new Set([...(old?.episodes||[]),String(ep)])]}]));}}catch{}};
   art.on("video:timeupdate",()=>{if(Date.now()-last>10000){last=Date.now();save();}});art.on("video:pause",save);art.on("video:ended",save);
 }
 return <section className="mx-auto max-w-6xl px-4 pb-20 pt-28 space-y-5">
 <Link href="/" className="text-sm text-neutral-400">← Beranda</Link>
 <h1 className="text-xl sm:text-3xl font-bold">{title}</h1>
 <div className="grid lg:grid-cols-[1fr_270px] gap-4">
 <div className="space-y-3">{url?<KitsunePlayer key={key+url+subtitle+introStart+introEnd+outroStart+outroEnd} episodeInfo={source} animeInfo={{id,title,image:info?.poster||""}} subOrDub="sub" serversData={server} autoSkip={autoSkip} getInstance={connect} onError={()=>setErr("Video tidak dapat dimuat. Periksa format, koneksi, dan izin CORS sumber video.")}/>:<div className="aspect-video rounded-xl bg-black border border-white/10 flex items-center justify-center text-center p-6 text-neutral-400">Pilih video milikmu atau sumber video berizin untuk mulai menonton.</div>}
 {err&&<p role="alert" className="text-sm text-neutral-300">{err}</p>}
 <div className="rounded-xl bg-neutral-900 border border-white/10 p-4 space-y-3"><h2 className="font-bold">Sumber video</h2><label className="block text-xs text-neutral-400">File video lokal (tidak diunggah)<input className={field} type="file" accept="video/mp4,video/webm" onChange={e=>{const f=e.target.files?.[0];if(f){const u=URL.createObjectURL(f);owned.current.push(u);setUrl(u);setKind("mp4");setErr("");}}}/></label><form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();loadUrl();}}><input className={field+" flex-1 min-w-0"} placeholder="URL HTTPS video berizin" value={input} onChange={e=>setInput(e.target.value)}/><button className={button}>Putar</button></form><label className="block text-xs text-neutral-400">Subtitle VTT lokal<input type="file" accept=".vtt,text/vtt" className={field} onChange={e=>{const f=e.target.files?.[0];if(f){const u=URL.createObjectURL(f);owned.current.push(u);setSubtitle(u);}}}/></label><details className="text-sm"><summary>Skip intro / outro</summary><div className="grid grid-cols-2 gap-2 pt-2">{[["Intro awal",introStart,setIntroStart],["Intro akhir",introEnd,setIntroEnd],["Outro awal",outroStart,setOutroStart],["Outro akhir",outroEnd,setOutroEnd]].map(([label,value,setter]:any)=><label key={label} className="text-xs">{label} (detik)<input className={field} type="number" min="0" max="100000" value={value} onChange={e=>setter(Math.max(0,Math.min(100000,Number(e.target.value)||0)))}/></label>)}</div><label className="block mt-3"><input type="checkbox" checked={autoSkip} onChange={e=>setAutoSkip(e.target.checked)}/> Auto skip</label></details></div></div>
 <aside className="rounded-xl border border-white/10 bg-neutral-900 p-4 space-y-3"><h2 className="font-bold">Episode {ep}</h2><label className="text-sm">Nomor episode<input className={field} type="number" min="1" max="10000" value={ep} onChange={e=>{setEp(Math.max(1,Math.min(10000,Number(e.target.value)||1)));setUrl("");setSubtitle("");}}/></label><div className="flex gap-2"><button className={button} disabled={ep<=1} onClick={()=>{setEp(x=>x-1);setUrl("");setSubtitle("");}}>Prev</button><button className={button} onClick={()=>{setEp(x=>x+1);setUrl("");setSubtitle("");}}>Next</button></div><p className="text-xs text-neutral-400">Pilih sumber video berizin untuk setiap episode. Kualitas dan audio HLS tersedia jika stream menyediakan beberapa track.</p></aside>
 </div></section>;
}
export default function Page(){return <Suspense fallback={<div className="p-24">Memuat Watch…</div>}><Watch/></Suspense>;}
