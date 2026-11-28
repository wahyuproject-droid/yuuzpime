'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, FolderOpen, Minus, Plus, Bookmark, Maximize, Minimize } from 'lucide-react';
import { stepReaderWidth } from '@/lib/yomikiru/readerWidth';

type PageImage = { name: string; url: string };
type Mode = 'vertical' | 'ltr' | 'rtl';
const STORE = 'yuuzpime-local-manga-bookmarks-v1';
const control = 'inline-flex items-center justify-center gap-2 rounded-xl border border-ink-700 bg-surface-canvas px-3 py-2 text-sm text-surface-primary disabled:opacity-40';
const safeTypes = new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif','image/apng']);

function readBookmark(key: string): number {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
    const value = saved[key];
    return Number.isInteger(value) && value >= 0 ? value : 0;
  } catch { return 0; }
}

export default function LocalMangaReader() {
  const [pages, setPages] = useState<PageImage[]>([]);
  const [book, setBook] = useState('');
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('vertical');
  const [spread, setSpread] = useState(false);
  const [width, setWidth] = useState(100);
  const [zen, setZen] = useState(false);
  const [notice, setNotice] = useState('');
  const reader = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const restoreIndex = useRef<number | null>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => () => { urls.current.forEach(url => URL.revokeObjectURL(url)); }, []);

  const openFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    const files = selected.filter(file => safeTypes.has(file.type));
    if (!files.length) { setNotice('Pilih file gambar JPG, PNG, WebP, GIF, atau AVIF yang kamu miliki.'); return; }
    if (files.length > 400 || files.reduce((sum, file) => sum + file.size, 0) > 250 * 1024 * 1024) {
      setNotice('Maksimal 400 halaman dan total 250 MB per sesi. Buka chapter secara bertahap.'); return;
    }
    files.sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    const key = JSON.stringify([files.length, files[0].name, files[0].size, files[files.length-1].name, files[files.length-1].size]);
    const start = Math.min(files.length - 1, readBookmark(key));
    const next = files.map(file => ({ name: file.name, url: URL.createObjectURL(file) }));
    urls.current.forEach(url => URL.revokeObjectURL(url));
    urls.current = next.map(page => page.url);
    restoreIndex.current = start;
    setBook(key); setPages(next); setIndex(start);
    setNotice(selected.length !== files.length ? 'File selain gambar tidak dimuat.' : '');
  };

  const go = (next: number) => {
    const target = Math.max(0, Math.min(pages.length - 1, next));
    setIndex(target);
    if (mode === 'vertical') reader.current?.querySelector('[data-page="' + target + '"]')?.scrollIntoView({block:'start', behavior:'smooth'});
  };

  useEffect(() => {
    if (mode !== 'vertical' || !pages.length) return;
    const root = reader.current;
    if (!root) return;
    if (restoreIndex.current !== null) {
      root.querySelector('[data-page="' + restoreIndex.current + '"]')?.scrollIntoView({block:'start'});
      restoreIndex.current = null;
    }
    const ratios = new Map<number, number>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const value = Number((entry.target as HTMLElement).dataset.page);
        ratios.set(value, entry.isIntersecting ? entry.intersectionRatio : 0);
      }
      let best = -1, largest = 0;
      ratios.forEach((ratio, page) => { if (ratio > largest) { best = page; largest = ratio; } });
      if (best >= 0) setIndex(best);
    }, { threshold: [0, 0.05, 0.25, 0.5, 0.75, 1] });
    root.querySelectorAll('[data-page]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [pages, mode]);

  useEffect(() => {
    if (!pages.length || !book) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
      saved[book] = index;
      const recent = Object.fromEntries(Object.entries(saved).slice(-100));
      localStorage.setItem(STORE, JSON.stringify(recent));
    } catch { /* Reader stays usable if storage is unavailable. */ }
  }, [book, index, pages.length]);

  const count = spread && mode !== 'vertical' ? 2 : 1;
  const switchMode = (value: Mode) => { restoreIndex.current = index; setMode(value); };
  const visible = pages.slice(index, index + count);
  const displayed = mode === 'rtl' ? [...visible].reverse() : visible;

  return (
    <section className="mx-auto max-w-6xl space-y-5 pb-20">
      {!zen && <header className="space-y-3">
        <Link href="/manga" className="inline-flex items-center gap-2 text-sm text-ink-300"><ArrowLeft size={16}/> Manga Hub</Link>
        <div className="rounded-2xl border border-ink-700 bg-surface-canvas p-5">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-surface-primary"><BookOpen/> YuuZPime Local Reader</h1>
          <p className="mt-2 text-sm text-ink-400">Baca koleksi manga milikmu. Adaptasi reader Yomikiru; gambar dibuka di perangkat dan tidak diunggah.</p>
          <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/apng" onChange={openFiles} className="hidden"/>
          <button type="button" className={control + ' mt-4'} onClick={() => fileInput.current?.click()}><FolderOpen size={18}/> Pilih halaman gambar</button>
          <p className="mt-2 text-xs text-ink-500">JPG, PNG, WebP, GIF, AVIF. Ekstrak arsip CBZ/ZIP milikmu terlebih dahulu.</p>
          {notice && <p role="status" className="mt-3 text-sm text-ink-300">{notice}</p>}
        </div>
      </header>}
      {!!pages.length && <>
        <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-ink-700 bg-surface-canvas p-3">
          <select aria-label="Mode baca" value={mode} onChange={e => switchMode(e.target.value as Mode)} className={control}>
            <option value="vertical">Vertikal / Webtoon</option><option value="ltr">Kiri ke kanan</option><option value="rtl">Kanan ke kiri</option>
          </select>
          {mode !== 'vertical' && <button type="button" className={control} onClick={() => setSpread(!spread)} aria-pressed={spread}>{spread ? '2 halaman' : '1 halaman'}</button>}
          <button type="button" className={control} disabled={width <= 20} onClick={() => setWidth(value => Math.max(20,stepReaderWidth(value,100,-1)))} aria-label="Perkecil"><Minus size={16}/></button>
          <span className="text-xs text-ink-300">{width}%</span>
          <button type="button" className={control} disabled={width >= 100} onClick={() => setWidth(value => stepReaderWidth(value,100,1))} aria-label="Perbesar"><Plus size={16}/></button>
          <button type="button" className={control} onClick={() => setZen(!zen)} aria-label={zen?'Keluar mode fokus':'Mode fokus'}>{zen?<Minimize size={16}/>:<Maximize size={16}/>}</button>
          <button type="button" className={control} onClick={() => go(index-count)} disabled={index===0} aria-label="Halaman sebelumnya"><ChevronLeft size={18}/></button>
          <span className="text-sm text-surface-primary">{index+1}/{pages.length}</span>
          <button type="button" className={control} onClick={() => go(index+count)} disabled={index+count>=pages.length} aria-label="Halaman selanjutnya"><ChevronRight size={18}/></button>
          <span className="inline-flex gap-1 items-center text-xs text-ink-400"><Bookmark size={14}/> Progres lokal</span>
        </div>
        <div ref={reader} className="mx-auto overflow-hidden rounded-xl bg-black" style={{width: width+'%'}}>
          {mode==='vertical' ? pages.map((page,i)=><img key={page.url} data-page={i} src={page.url} alt={'Halaman '+(i+1)+' — '+page.name} loading={Math.abs(i-index)<3?'eager':'lazy'} className="block h-auto w-full scroll-mt-32"/>) : <div className="flex items-start justify-center">{displayed.map(page=><img key={page.url} src={page.url} alt={page.name} className="block h-auto min-w-0 object-contain" style={{width: displayed.length===2?'50%':'100%'}}/>)}</div>}
        </div>
      </>}
      {!pages.length && <div className="rounded-2xl border border-ink-700 bg-surface-canvas p-10 text-center text-ink-400">Belum ada halaman. Pilih file gambar untuk mulai membaca.</div>}
      <p className="text-center text-xs text-ink-500">YuuZ · Berdasarkan Yomikiru oleh mienaiyami (MIT) · Tanpa login</p>
    </section>
  );
}
