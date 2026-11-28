import { NextRequest, NextResponse } from 'next/server';

type Manga = { mal_id: number; title: string; title_english?: string; images?: { jpg?: { image_url?: string; large_image_url?: string } }; chapters?: number | null; status?: string; score?: number | null; genres?: { name: string }[]; explicit_genres?: { name: string }[] };

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 100);
  const page = Math.min(100, Math.max(1, Number.parseInt(req.nextUrl.searchParams.get('page') || '1', 10) || 1));
  const params = new URLSearchParams({ sfw: 'true', page: String(page), limit: '24' });
  if (query) params.set('q', query);
  else { params.set('order_by','popularity'); params.set('sort','asc'); }
  try {
    const result = await fetch('https://api.jikan.moe/v4/manga?' + params.toString(), { next: { revalidate: 300 }, signal: AbortSignal.timeout(10000) });
    if (!result.ok) throw new Error('Catalog unavailable');
    const raw = await result.json();
    const data = (Array.isArray(raw.data) ? raw.data as Manga[] : []).filter(item => Number.isInteger(item.mal_id) && !item.explicit_genres?.length && !item.genres?.some(g => ['Erotica','Hentai','Ecchi'].includes(g.name))).map(item => ({
      id: item.mal_id, title: item.title_english || item.title,
      cover: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
      chapters: item.chapters, status: item.status, score: item.score,
    }));
    return NextResponse.json({ data, hasMore: Boolean(raw.pagination?.has_next_page) });
  } catch {
    return NextResponse.json({ error: 'Katalog manga sedang tidak tersedia. Coba lagi.' }, { status: 503 });
  }
}
