'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, ChevronLeft, ChevronRight, RotateCcw, ExternalLink } from 'lucide-react';
type Manga = { id: number; title: string; cover: string; chapters: number | null; status: string; score: number | null };
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-ink-700 bg-surface-canvas px-4 py-2 text-sm text-surface-primary disabled:opacity-40';
export const MangaPage = () => {
  const [input,setInput] = useState('');
  const [q,setQ] = useState('');
  const [page,setPage] = useState(1);
  const [data,setData] = useState<Manga[]>([]);
  const [more,setMore] = useState(false);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [retry,setRetry] = useState(0);
  const [source,setSource] = useState('');
  useEffect(() => { const t=setTimeout(()=>{setQ(input.trim());setPage(1)},650);return()=>clearTimeout(t); },[input]);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);setError('');
    const key='yuuzpime-manga-v2:'+q.toLowerCase()+':'+page;
    if(retry===0){try {const old=JSON.parse(sessionStorage.getItem(key)||'null');if(old&&Date.now()-old.at<300000){setData(old.data);setMore(old.hasMore);setSource(old.source);setLoading(false);return ()=>c.abort();}} catch { /* storage optional */ }}
    fetch('/api/manga/catalog?q='+encodeURIComponent(q)+'&page='+page,{signal:c.signal})
      .then(async r=>{const result=await r.json();if(!r.ok)throw new Error(result.error || 'Katalog tidak tersedia');return result;})
      .then(result=>{if(c.signal.aborted)return;setData(result.data || []);setMore(Boolean(result.hasMore));setSource(result.source || '');setLoading(false);if(result.source!=='Koleksi cadangan'){try{sessionStorage.setItem(key,JSON.stringify({...result,at:Date.now()}));}catch{ /* storage optional */ }}})
      .catch(e=>{if(!c.signal.aborted){setError(e.message);setLoading(false);}});
    return()=>c.abort();
  },[q,page,retry]);
  return <div className="manga-lite min-w-0 space-y-4 sm:space-y-6 pb-16">
    <header className="flex min-w-0 flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink-700">
      <div><h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-surface-primary"><BookOpen/> Manga Hub</h1><p className="mt-2 text-sm text-ink-500">Katalog manga dan manhwa</p></div>
      <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-3 w-4 h-4 text-ink-500"/><input type="search" aria-label="Cari manga" placeholder="Cari judul manga..." value={input} onChange={e=>setInput(e.target.value)} className="w-full rounded-xl border border-ink-700 bg-surface-canvas pl-10 pr-3 py-2.5 text-sm text-surface-primary"/></div>
    </header>
    <Link href="/manga/local" className="flex items-center justify-between gap-3 rounded-2xl border border-ink-700 bg-surface-canvas p-4 text-surface-primary"><span className="flex gap-3 items-center"><BookOpen/><span><strong className="block">Baca Manga Lokal</strong><span className="block text-xs text-ink-500">Reader Yomikiru · Tanpa login</span></span></span><ChevronRight/></Link>
    <div className="rounded-xl border border-ink-700 bg-surface-canvas p-4 text-sm text-ink-400">Katalog ini berisi informasi dan sampul manga, bukan scan chapter. Baca rilisan resmi di <a href="https://mangaplus.shueisha.co.jp/" target="_blank" rel="noopener noreferrer" className="underline text-surface-primary">MANGA Plus</a> jika tersedia.</div>
    <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-surface-primary">{q?'Hasil pencarian':'Manga populer'}</h2><span className="text-xs text-ink-500">{source || "Katalog"} · {page}</span></div>
    {source==="Koleksi cadangan"&&!loading&&<p role="status" className="text-xs text-ink-400">API sedang bermasalah. Menampilkan koleksi cadangan. <button onClick={()=>setRetry(x=>x+1)} className="underline">Coba lagi</button></p>}
    {loading?<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">{Array.from({length:12},(_,i)=><div key={i} className="aspect-[3/4] rounded-xl border border-ink-700 bg-surface-canvas"/>)}</div>:error?<div className="rounded-xl border border-ink-700 p-8 text-center"><p className="text-ink-400">{error}</p><button className={button+' mt-4'} onClick={()=>setRetry(x=>x+1)}><RotateCcw size={16}/> Coba lagi</button></div>:data.length?<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">{data.map(item=><a key={item.id} href={'https://myanimelist.net/manga/'+item.id} target="_blank" rel="noopener noreferrer" className="manga-lite-card min-w-0 overflow-hidden rounded-xl border border-ink-700 bg-surface-canvas text-surface-primary"><div className="aspect-[3/4] bg-surface-raised">{item.cover?<img src={item.cover} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover"/>:<BookOpen className="mx-auto mt-12"/>}</div><div className="p-3 space-y-2"><h3 className="line-clamp-2 font-semibold text-sm">{item.title}</h3><p className="text-xs text-ink-500">{item.chapters?item.chapters+' chapter':item.status || 'Manga'}</p><span className="flex items-center gap-1 text-xs text-ink-400">Info manga <ExternalLink size={12}/></span></div></a>)}</div>:<p className="p-8 text-center text-ink-500">Tidak ada hasil.</p>}
    <div className="flex flex-wrap justify-center gap-2"><button className={button} disabled={loading||page===1} onClick={()=>{setPage(p=>p-1);window.scrollTo({top:0})}}><ChevronLeft size={16}/> Sebelumnya</button><button className={button} disabled={loading||!more} onClick={()=>{setPage(p=>p+1);window.scrollTo({top:0})}}>Selanjutnya <ChevronRight size={16}/></button></div>
  </div>;
};
