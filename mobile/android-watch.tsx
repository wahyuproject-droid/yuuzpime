import React,{useEffect,useRef,useState} from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import {useSearchParams} from 'next/navigation';
import {useGetAnimeDetails} from '@/query/get-anime-details';
import Container from '@/components/container';
import {ArrowLeft,FolderOpen,Play,Subtitles} from 'lucide-react';
import Link from 'next/link';

export default function LocalWatch(){
 const p=useSearchParams(),id=p.get('anime')||'',ep=Math.max(1,Number(p.get('ep')||p.get('episode'))||1);
 const {data}=useGetAnimeDetails(id),info=data?.anime?.info;
 const target=useRef<HTMLDivElement>(null),[media,setMedia]=useState(''),[format,setFormat]=useState('mp4'),[sub,setSub]=useState(''),[input,setInput]=useState(''),[notice,setNotice]=useState(''),[intro,setIntro]=useState(0),[outro,setOutro]=useState(0),[skip,setSkip]=useState(false);
 const key='yuuzpime-progress:'+id+':'+ep;
 useEffect(()=>()=>{if(media.startsWith('blob:'))URL.revokeObjectURL(media);},[media]);
 useEffect(()=>()=>{if(sub.startsWith('blob:'))URL.revokeObjectURL(sub);},[sub]);
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
 const load=()=>{try{const u=new URL(input.trim());if(u.protocol!=='https:'||u.username||u.password||!(/\.(mp4|m3u8|webm)$/i.test(u.pathname)))throw Error();setMedia(u.href);setFormat(u.pathname.endsWith('.m3u8')?'m3u8':'mp4');setNotice('');}catch{setNotice('Pilih URL HTTPS MP4, WebM, atau HLS berizin.');}};
 const field='w-full rounded-xl border border-white/15 bg-neutral-900 px-3 py-3 text-sm';
 return <Container className="py-5 space-y-4"><Link href={'/anime/'+id} className="flex items-center gap-2 text-neutral-400"><ArrowLeft size={16}/> Detail anime</Link><h1 className="text-xl font-bold">{info?.name||'YuuZPime Watch'}</h1><div className="overflow-hidden rounded-2xl bg-black border border-white/10"><div ref={target} className={'aspect-video w-full '+(!media?'hidden':'')}/>{!media&&<div className="aspect-video relative grid place-items-center overflow-hidden">{info?.poster&&<img src={info.poster} className="absolute w-full h-full object-cover opacity-25" alt=""/>}<div className="relative text-center"><Play className="mx-auto mb-2" size={30}/><p>Episode {ep}</p><p className="text-xs text-neutral-400">Pilih sumber video berizin</p></div></div>}</div><div className="flex justify-between items-center"><Link href={'/anime/watch?anime='+id+'&ep='+Math.max(1,ep-1)} className="rounded-xl bg-neutral-800 p-3 text-xs">Prev</Link><strong>EP {ep}</strong><Link href={'/anime/watch?anime='+id+'&ep='+(ep+1)} className="rounded-xl bg-neutral-800 p-3 text-xs">Next</Link></div>{notice&&<p className="text-sm text-neutral-300">{notice}</p>}<section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 space-y-3"><h2 className="font-bold">Sumber video</h2><label className="block text-xs text-neutral-300"><FolderOpen size={16} className="inline mr-2"/>Video lokal<input type="file" accept="video/mp4,video/webm" className={field} onChange={e=>{const f=e.target.files?.[0];if(f){setFormat('mp4');setMedia(URL.createObjectURL(f));setNotice('');}}}/></label><form onSubmit={e=>{e.preventDefault();load()}} className="space-y-2"><input className={field} placeholder="URL video HTTPS berizin" value={input} onChange={e=>setInput(e.target.value)}/><button className="w-full rounded-xl bg-white text-black font-bold p-3">Putar video</button></form><label className="block text-xs"><Subtitles size={16} className="inline mr-2"/>Subtitle VTT lokal<input className={field} type="file" accept=".vtt,text/vtt" onChange={e=>{const f=e.target.files?.[0];if(f)setSub(URL.createObjectURL(f));}}/></label><details><summary className="text-sm">Auto skip intro/outro</summary><label className="flex gap-2 items-center text-xs mt-3"><input type="checkbox" checked={skip} onChange={e=>setSkip(e.target.checked)}/>Aktifkan</label><div className="grid grid-cols-2 gap-2 mt-3"><label className="text-xs">Akhir intro (detik)<input type="number" min="0" className={field} value={intro} onChange={e=>setIntro(Math.max(0,Number(e.target.value)||0))}/></label><label className="text-xs">Awal outro (detik)<input type="number" min="0" className={field} value={outro} onChange={e=>setOutro(Math.max(0,Number(e.target.value)||0))}/></label></div></details></section></Container>
}
