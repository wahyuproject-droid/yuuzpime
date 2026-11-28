import { NextRequest, NextResponse } from 'next/server';

type Entry = { id: number; title: string; cover: string; chapters: number | null; status: string; score: number | null };
type Catalog = { data: Entry[]; hasMore: boolean; source: string };
const SIZE = 12;
const cache = new Map<string, { value: Catalog; at: number }>();
const pending = new Map<string, Promise<Catalog>>();
const blocked = new Set(['Hentai','Erotica','Ecchi']);
const starter: Entry[] = [
  {id:13,title:'One Piece',cover:'',chapters:null,status:'Manga',score:null},
  {id:11,title:'Naruto',cover:'',chapters:null,status:'Manga',score:null},
  {id:42,title:'Dragon Ball',cover:'',chapters:null,status:'Manga',score:null},
  {id:35243,title:'Haikyu!!',cover:'',chapters:null,status:'Manga',score:null},
  {id:119161,title:'Spy x Family',cover:'',chapters:null,status:'Manga',score:null},
];
const queryText = `query ($page:Int!, $search:String, $sort:[MediaSort]) {
  Page(page:$page,perPage:12) {
    pageInfo { hasNextPage }
    media(type:MANGA,isAdult:false,search:$search,sort:$sort) {
      idMal title { english romaji } coverImage { medium } chapters status averageScore genres isAdult
    }
  }
}`;
async function anilist(q:string,page:number):Promise<Catalog> {
  const response=await fetch('https://graphql.anilist.co',{
    method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({query:queryText,variables:{page,search:q||undefined,sort:q?['SEARCH_MATCH']:['POPULARITY_DESC']}}),
    signal:AbortSignal.timeout(4000),cache:'no-store'
  });
  if(!response.ok) throw new Error('AniList '+response.status);
  const json=await response.json();
  const p=json.data?.Page;
  if(!Array.isArray(p?.media))throw new Error('AniList invalid response');
  const data:Entry[]=p.media.filter((m:any)=>m.isAdult===false && Number.isInteger(m.idMal) && !m.genres?.some((g:string)=>blocked.has(g))).map((m:any)=>({
    id:m.idMal,title:m.title?.english||m.title?.romaji||'Manga',cover:m.coverImage?.medium||'',chapters:m.chapters??null,status:m.status||'Manga',score:m.averageScore?m.averageScore/10:null
  }));
  return {data,hasMore:Boolean(p.pageInfo?.hasNextPage),source:'AniList'};
}
async function jikan(q:string,page:number):Promise<Catalog> {
  const params=new URLSearchParams({sfw:'true',page:String(page),limit:String(SIZE)});
  if(q)params.set('q',q);else {params.set('order_by','popularity');params.set('sort','asc');}
  const response=await fetch('https://api.jikan.moe/v4/manga?'+params.toString(),{signal:AbortSignal.timeout(4000),next:{revalidate:600}});
  if(!response.ok)throw new Error('Jikan '+response.status);
  const json=await response.json();
  if(!Array.isArray(json.data))throw new Error('Jikan invalid response');
  const data:Entry[]=json.data.filter((m:any)=>Number.isInteger(m.mal_id)&&!m.explicit_genres?.length&&!m.genres?.some((g:any)=>blocked.has(g.name))).map((m:any)=>({
    id:m.mal_id,title:m.title_english||m.title,cover:m.images?.jpg?.image_url||'',chapters:m.chapters??null,status:m.status||'Manga',score:m.score??null
  }));
  return {data,hasMore:Boolean(json.pagination?.has_next_page),source:'Jikan'};
}
async function load(q:string,page:number,key:string):Promise<Catalog> {
  try {
    const value=await anilist(q,page).catch(e=>{console.warn('Manga AniList:',e.message);return jikan(q,page);});
    if(cache.size>=128)cache.delete(cache.keys().next().value!);
    cache.set(key,{value,at:Date.now()});return value;
  } catch(e) {
    console.warn('Manga catalog fallback:',e instanceof Error?e.message:'unavailable');
    const old=cache.get(key);
    if(old)return {...old.value,source:'Cache sementara'};
    return {data:page===1?starter.filter(m=>!q||m.title.toLowerCase().includes(q.toLowerCase())):[],hasMore:false,source:'Koleksi cadangan'};
  }
}
export async function GET(req:NextRequest) {
  const q=(req.nextUrl.searchParams.get('q')||'').trim().slice(0,100);
  const page=Math.min(100,Math.max(1,Number.parseInt(req.nextUrl.searchParams.get('page')||'1',10)||1));
  const key=JSON.stringify([q.toLowerCase(),page]);
  const cached=cache.get(key);
  let value:Catalog;
  if(cached&&Date.now()-cached.at<600000)value=cached.value;
  else {
    let job=pending.get(key);
    if(!job){job=load(q,page,key);pending.set(key,job);}
    try {value=await job;}finally {pending.delete(key);}
  }
  return NextResponse.json(value,{headers:{'Cache-Control':value.source==='Koleksi cadangan'?'public, max-age=0, s-maxage=30':'public, max-age=60, s-maxage=300, stale-while-revalidate=600'}});
}
