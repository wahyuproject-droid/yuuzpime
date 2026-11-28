import { normalizeMediaList, fetchMediaPage, anilistQuery } from './kitsune-browser-core';
export const fetchAniListGraphQL = anilistQuery;
export const getAniListTrending = (page=1,perPage=12)=>fetchMediaPage({page,perPage,sort:['TRENDING_DESC']});
export const getAniListPopular = (page=1,perPage=12)=>fetchMediaPage({page,perPage,sort:['POPULARITY_DESC']});
export const getAniListUpcoming = (page=1,perPage=12)=>fetchMediaPage({page,perPage,sort:['POPULARITY_DESC'],status:'NOT_YET_RELEASED'});
export const getAniListRecent = (page=1,perPage=12)=>fetchMediaPage({page,perPage,sort:['END_DATE_DESC'],status:'FINISHED'});
export async function getAniListSpotlight(){return (await getAniListTrending(1,6)).results;}
export async function getAniListAnimeSchedule(date?:string){
  const start=date?new Date(date+'T00:00:00'):new Date();start.setHours(0,0,0,0);
  const end=new Date(start);end.setDate(end.getDate()+1);
  const raw=await anilistQuery('query($from:Int,$to:Int){Page(page:1,perPage:50){airingSchedules(airingAt_greater:$from,airingAt_lesser:$to,sort:TIME){episode airingAt media{id isAdult genres title{english romaji native} coverImage{large medium}}}}}',{from:Math.floor(start.getTime()/1000)-1,to:Math.floor(end.getTime()/1000)});
  return {scheduledAnimes:(raw?.Page?.airingSchedules||[]).filter((x:any)=>x.media?.isAdult===false&&!x.media?.genres?.some((g:string)=>['Hentai','Ecchi','Erotica'].includes(g))).map((x:any)=>({id:String(x.media.id),name:x.media.title.english||x.media.title.romaji,jname:x.media.title.native||'',poster:x.media.coverImage?.medium||x.media.coverImage?.large||'',episode:x.episode,airingTimestamp:x.airingAt*1000,secondsUntilAiring:Math.max(0,x.airingAt-Math.floor(Date.now()/1000))}))};
}
