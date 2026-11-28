import Link from 'next/link';
import { Play, ExternalLink, ArrowLeft } from 'lucide-react';

type Media = {
  id: number; isAdult: boolean; genres: string[];
  title: { english?: string; romaji?: string };
  coverImage?: { large?: string };
  episodes?: number; status?: string; format?: string; averageScore?: number;
  trailer?: { id?: string; site?: string };
  externalLinks?: { site: string; url: string }[];
  streamingEpisodes?: { title: string; url: string; site: string }[];
};
const domains = ['crunchyroll.com','netflix.com','hidive.com','disneyplus.com','iq.com','bilibili.tv','primevideo.com','hulu.com'];
function official(url:string) {
  try { const u = new URL(url); return u.protocol==='https:' && domains.some(d=>u.hostname===d||u.hostname.endsWith('.'+d)); }
  catch { return false; }
}
async function load(id:number): Promise<Media|null> {
  const r = await fetch('https://graphql.anilist.co', {
    method:'POST', headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({query:'query($id:Int){Media(id:$id,type:ANIME,isAdult:false){id isAdult genres title{english romaji} coverImage{large} episodes status format averageScore trailer{id site} externalLinks{site url} streamingEpisodes{title url site}}}',variables:{id}}),
    signal:AbortSignal.timeout(9000), next:{revalidate:300}
  });
  if(!r.ok)throw new Error('Catalog unavailable');
  const j=await r.json();if(j.errors?.length)throw new Error('Catalog unavailable');
  const m=j.data?.Media as Media|undefined;
  return m?.isAdult===false&&!m.genres?.some(g=>['Hentai','Erotica','Ecchi'].includes(g))?m:null;
}
export default async function Page({searchParams}:{searchParams:Promise<{anime?:string;ep?:string}>}) {
  const params=await searchParams;
  const id=Number(params.anime);
  let m:Media|null=null;
  if(Number.isSafeInteger(id)&&id>0){try{m=await load(id)}catch{}}
  if(!m)return <section className="mx-auto max-w-4xl px-4 py-20 text-center"><h1 className="text-xl font-bold">Anime tidak tersedia</h1><p className="mt-2 text-sm text-neutral-400">Periksa koneksi atau pilih judul dari katalog.</p><Link href="/" className="mt-5 inline-block rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">Kembali</Link></section>;
  const title=m.title.english||m.title.romaji||'Anime';
  const trailer=m.trailer?.site==='youtube'&&/^[A-Za-z0-9_-]{11}$/.test(m.trailer.id||'')?m.trailer.id:undefined;
  const providers=(m.externalLinks||[]).filter(x=>official(x.url));
  const episodes=(m.streamingEpisodes||[]).filter(x=>official(x.url));
  return <section className="mx-auto max-w-5xl space-y-5 px-2 pb-16 pt-12">
    <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-300"><ArrowLeft size={16}/> Beranda</Link>
    <header className="flex items-center gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-4">
      {m.coverImage?.large&&<img src={m.coverImage.large} alt={title} className="h-28 w-20 shrink-0 rounded-lg object-cover" loading="lazy"/>}
      <div className="min-w-0"><h1 className="text-xl font-bold sm:text-3xl">{title}</h1><p className="mt-2 text-sm text-neutral-400">{m.format||'Anime'} · {m.episodes??'—'} episode · {m.averageScore??'—'}%</p></div>
    </header>
    {trailer&&<section className="overflow-hidden rounded-2xl border border-white/10 bg-black"><h2 className="flex items-center gap-2 p-4 text-sm font-semibold"><Play size={18}/> Trailer (bukan episode penuh)</h2><iframe title={'Trailer '+title} src={'https://www.youtube-nocookie.com/embed/'+trailer} className="aspect-video w-full border-0" sandbox="allow-scripts allow-same-origin allow-presentation" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/></section>}
    <section className="space-y-3"><h2 className="text-lg font-bold">Tonton di penyedia resmi</h2><p className="text-xs text-neutral-400">Ketersediaan episode, wilayah, dan langganan mengikuti masing-masing penyedia. Tidak ada proxy pemutaran eksternal.</p>
      {providers.length? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{providers.map((x,i)=><a key={i} href={x.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-900 p-4 text-sm font-medium">{x.site}<ExternalLink size={16}/></a>)}</div>:<p className="rounded-xl border border-white/10 p-4 text-sm text-neutral-400">Belum ada tautan streaming resmi di katalog.</p>}
    </section>
    {episodes.length>0&&<section className="space-y-2"><h2 className="text-lg font-bold">Episode tersedia</h2>{episodes.slice(0,100).map((e,i)=><a key={i} href={e.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/10 p-3 text-sm"><Play size={16}/><span className="min-w-0 flex-1">{e.title}<span className="block text-xs text-neutral-400">{e.site}</span></span><ExternalLink size={16}/></a>)}</section>}
  </section>;
}
