import {anilistQuery} from '@/lib/kitsune-browser-core';
export type OfficialLink={site:string;url:string;title:string};
type LicensedEpisode={url:string;type:'mp4'|'m3u8';subtitle?:string;introEnd?:number;outroStart?:number};
const officialDomains=['crunchyroll.com','netflix.com','hidive.com','disneyplus.com','iq.com','bilibili.tv','primevideo.com','hulu.com'];
function official(raw:string){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&officialDomains.some(d=>u.hostname===d||u.hostname.endsWith('.'+d));}catch{return false;}}
export async function getOfficialLinks(id:string,ep:number):Promise<OfficialLink[]>{
 const num=Number(id);if(!Number.isSafeInteger(num)||num<1)return [];
 const j=await anilistQuery('query($id:Int){Media(id:$id,type:ANIME,isAdult:false){isAdult genres externalLinks{site url} streamingEpisodes{title site url}}}',{id:num});
 const m=j?.Media;if(!m||m.isAdult!==false||m.genres?.some((g:string)=>['Hentai','Ecchi','Erotica'].includes(g)))return [];
 const result:OfficialLink[]=[];
 for(const x of m.streamingEpisodes||[]){const match=String(x.title||'').match(/(?:episode|ep\.?)[\s:#-]*(\d+)/i);if(match&&Number(match[1])===ep&&official(x.url))result.push({site:x.site,url:x.url,title:x.title});}
 for(const x of m.externalLinks||[]){if(official(x.url)&&!result.some(y=>y.site===x.site))result.push({site:x.site,url:x.url,title:'Halaman serial'});}
 return result.filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i);
}
function mediaUrl(raw:unknown){if(typeof raw!=='string')return '';try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export async function getLicensedEpisode(id:string,ep:number):Promise<LicensedEpisode|null>{
 // A publisher-configured manifest, not an unrestricted scraping or proxy service.
 const endpoint=import.meta.env.VITE_LICENSED_CATALOG_URL as string|undefined;
 const url=endpoint?mediaUrl(endpoint):'/licensed-episodes.json';if(!url)return null;
 const response=await fetch(url,{signal:AbortSignal.timeout(8000),credentials:'omit'});if(!response.ok)throw Error('Catalog unavailable');
 const j=await response.json();const s=j?.series?.[id]?.episodes?.[String(ep)];if(!s)return null;
 const stream=mediaUrl(s.url);if(!stream||!['mp4','m3u8'].includes(s.type))return null;
 return {url:stream,type:s.type,subtitle:mediaUrl(s.subtitle)||undefined,introEnd:Math.max(0,Number(s.introEnd)||0),outroStart:Math.max(0,Number(s.outroStart)||0)};
}
