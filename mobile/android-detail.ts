import {anilistQuery} from '@/lib/kitsune-browser-core';
export async function androidDetail(id:string){
 const r=await anilistQuery('query($id:Int){Media(id:$id,type:ANIME,isAdult:false){id idMal isAdult genres title{english romaji native} coverImage{large extraLarge} bannerImage description averageScore meanScore format episodes duration status season seasonYear synonyms startDate{year month day} studios{nodes{name}} trailer{id site thumbnail} characters(perPage:16,sort:ROLE){edges{role node{id name{full} image{large}} voiceActors(language:JAPANESE){id name{full} image{large} languageV2}}} relations{edges{relationType node{id type isAdult genres title{english romaji native} coverImage{large extraLarge} episodes format}}} recommendations(perPage:12,sort:RATING_DESC){nodes{mediaRecommendation{id type isAdult genres title{english romaji native} coverImage{large extraLarge} episodes format}}}}}',{id:Number(id)});
 const m=r?.Media;if(!safe(m))throw Error('Judul tidak tersedia');
 m.relations.edges=m.relations.edges.filter((e:any)=>e.node.type==='ANIME'&&safe(e.node));
 m.recommendations.nodes=m.recommendations.nodes.filter((e:any)=>e.mediaRecommendation?.type==='ANIME'&&safe(e.mediaRecommendation));
 return m;
}
function safe(m:any){return m&&m.isAdult===false&&!m.genres?.some((g:string)=>['Hentai','Erotica','Ecchi'].includes(g));}
export function getSaved(){try{return JSON.parse(localStorage.getItem('yuuzpime-kitsune-watchlist-v1')||'[]')}catch{return []}}
export function saveMedia(m:any,status:string){const list=getSaved().filter((x:any)=>String(x.id)!==String(m.id));if(status)list.unshift({...m,watchStatus:status});localStorage.setItem('yuuzpime-kitsune-watchlist-v1',JSON.stringify(list.slice(0,100)));}
