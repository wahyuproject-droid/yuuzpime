// Browser adaptation of the original Kitsune metadata client. MIT, Dovakiin0.
import type { MediaList, PaginatedResponse } from '@/types/miruro-api';
const cache=new Map<string,{at:number,data:any}>();
const pending=new Map<string,Promise<any>>();
export async function anilistQuery<T=any>(query:string,variables:Record<string,any>={},ttlMs=300000):Promise<T>{
  const key=JSON.stringify([query,variables]);
  const old=cache.get(key);
  if(old&&Date.now()-old.at<ttlMs)return old.data;
  let job=pending.get(key);
  if(!job){
    job=(async()=>{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      try{
        const r=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query,variables}),signal:controller.signal});
        if(!r.ok)throw Error('AniList '+r.status);
        const j=await r.json();if(j.errors?.length||!j.data)throw Error('AniList unavailable');
        if(cache.size>=100)cache.delete(cache.keys().next().value!);
        cache.set(key,{at:Date.now(),data:j.data});return j.data;
      }finally{clearTimeout(timer);}
    })();
    pending.set(key,job);
  }
  try{return await job;}finally{pending.delete(key);}
}
