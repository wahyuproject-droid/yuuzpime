import React,{useEffect,useRef,useState} from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import {useSearchParams} from 'next/navigation';
import {useGetAnimeDetails} from '@/query/get-anime-details';
import Container from '@/components/container';
import {ArrowLeft,Play,ExternalLink,RefreshCw} from 'lucide-react';
import {getLicensedEpisode, getOfficialLinks, type OfficialLink} from './android-online';
import Link from 'next/link';

export default function LocalWatch(){
 const p=useSearchParams(),id=p.get('anime')||'',ep=Math.max(1,Number(p.get('ep')||p.get('episode'))||1);
 const {data}=useGetAnimeDetails(id),info=data?.anime?.info;
 const target=useRef<HTMLDivElement>(null),[media,setMedia]=useState(''),[format,setFormat]=useState('mp4'),[sub,setSub]=useState(''),[notice,setNotice]=useState(''),[intro,setIntro]=useState(0),[outro,setOutro]=useState(0),[skip,setSkip]=useState(false),[links,setLinks]=useState<OfficialLink[]>([]),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
 const key='yuuzpime-progress:'+id+':'+ep;
 useEffect(()=>{
 let live=true;setLoading(true);setNotice('');setMedia('');setSub('');setLinks([]);setIntro(0);setOutro(0);setSkip(false);
 Promise.allSettled([getLicensedEpisode(id,ep),getOfficialLinks(id,ep)]).then(([stream,official])=>{
   if(!live)return;
   if(official.status==='fulfilled')setLinks(official.value);
   if(stream.status==='fulfilled'&&stream.value){const s=stream.value;setFormat(s.type);setSub(s.subtitle||'');setIntro(s.introEnd||0);setOutro(s.outroStart||0);setMedia(s.url);}
   else if(stream.status==='rejected')setNotice('Katalog streaming tidak dapat dimuat.');
   setLoading(false);
 });
 return()=>{live=false};
 },[id,ep,retry]);
 useEffect(()=>{
 if(!target.current||!media)return;let hls:Hls|null=null;
 let art:Artplayer;
 try{
 art=new Artplayer({container:target.current,url:media,type:format,theme:'#eeeeee',volume:0.7,autoplay:false,playsInline:true,fullscreen:true,fullscreenWeb:true,setting:true,playbackRate:true,aspectRatio:true,hotkey:true,subtitle:sub?{url:sub,type:'vtt',escape:true}:undefined,customType:{m3u8(video,url,instance){if(Hls.isSupported()){hls=new Hls({maxBufferLength:25,maxMaxBufferLength:45});hls.loadSource(url);hls.attachMedia(video);hls.on(Hls.Events.MANIFEST_PARSED,()=>{const levels=hls?.levels||[];if(levels.length>1)instance.setting.add({name:'quality',html:'Quality',selector:[{html:'Auto',default:true,value:-1},...levels.map((l,i)=>({html:l.height+'p',value:i}))],onSelect:(item:any)=>{if(hls)hls.currentLevel=item.value;return item.html;}});});hls.on(Hls.Events.ERROR,(_,e)=>{if(e.fatal)setNotice('HLS gagal dimuat. Periksa sumber video dan CORS.');});}else if(video.canPlayType('application/vnd.apple.mpegurl'))video.src=url;else setNotice('HLS tidak didukung perangkat.');}}});
 art.on('ready',()=>{try{const time=Number(localStorage.getItem(key));if(time>0&&time<art.duration-1)art.seek=time;}catch{}});
 let last=0;art.on('video:timeupdate',()=>{if(skip&&intro>0&&art.currentTime<intro)art.seek=intro;if(skip&&outro>0&&art.currentTime>=outro&&art.playing)art.pause();if(Date.now()-last>5000){last=Date.now();try{localStorage.setItem(key,String(art.currentTime));}catch{}}});
 art.on('video:pause',()=>{try{localStorage.setItem(key,String(art.currentTime))}catch{}});
 art.on('video:error',()=>setNotice('Video tidak dapat dimuat.'));
 }catch{setNotice('Player gagal dimuat.');}
 return()=>{hls?.destroy();art?.destroy(false);};
 },[media,format,sub,key,intro,outro,skip]);
 return <Container className="py-5 space-y-4">
 <Link href={'/anime/'+id} className="flex items-center gap-2 text-neutral-400"><ArrowLeft size={16}/> Detail anime</Link>
 <h1 className="text-xl font-bold">{info?.name||'YuuZPime Watch'}</h1>
 <div className="overflow-hidden rounded-2xl bg-black border border-white/10"><div ref={target} className={'aspect-video w-full '+(!media?'hidden':'')}/>{!media&&<div className="aspect-video relative grid place-items-center overflow-hidden">{info?.poster&&<img src={info.poster} className="absolute w-full h-full object-cover opacity-25" alt=""/>}<div className="relative text-center px-4"><Play className="mx-auto mb-2" size={30}/><p>Episode {ep}</p><p className="text-xs text-neutral-400">{loading?'Mencari sumber online…':links.length?'Tersedia melalui penyedia resmi di bawah':'Belum tersedia dari katalog streaming berizin'}</p></div></div>}</div>
 <div className="flex justify-between items-center"><Link href={'/anime/watch?anime='+id+'&ep='+Math.max(1,ep-1)} className="rounded-xl bg-neutral-800 p-3 text-xs">Prev</Link><strong>EP {ep}</strong><Link href={'/anime/watch?anime='+id+'&ep='+(ep+1)} className="rounded-xl bg-neutral-800 p-3 text-xs">Next</Link></div>
 {notice&&<p role="alert" className="text-sm text-neutral-300">{notice}</p>}
 {media&&<label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={skip} onChange={e=>setSkip(e.target.checked)}/> Auto skip intro/outro (jika tersedia)</label>}
 <section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 space-y-3"><div className="flex justify-between items-center"><h2 className="font-bold">Sumber online</h2><button type="button" disabled={loading} onClick={()=>setRetry(x=>x+1)} aria-label="Muat ulang"><RefreshCw size={17}/></button></div>
 {loading?<p className="text-xs text-neutral-400">Mencari episode…</p>:media?<p className="text-sm">Sumber streaming terhubung.</p>:!links.length?<p className="text-sm text-neutral-400">Belum ada sumber yang tersedia untuk episode ini.</p>:links.map(x=><a key={x.url} href={x.url} className="flex justify-between items-center rounded-xl border border-white/15 px-4 py-3 text-sm"><span>{x.site}<span className="block text-xs text-neutral-400">{x.title}</span></span><ExternalLink size={16}/></a>)}
 {!media&&links.length>0&&<p className="text-xs text-neutral-400">Tautan dibuka di penyedia resmi. Ketersediaan dan langganan mengikuti penyedia.</p>}
 </section></Container>
}
