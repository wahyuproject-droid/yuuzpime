import { anilistQuery, CACHE_HEADERS } from "@/lib/anilist";
import { NextResponse } from "next/server";
import type { Episode } from "@/types/episodes";

export async function GET(_req: Request, context: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await context.params;
  const id = Number(slug[0]);
  if (slug.length !== 1 || !/^\d+$/.test(slug[0] || "") || !Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({error:"Invalid anime ID"}, {status:400});
  }
  try {
    const data = await anilistQuery(`query($id:Int){Media(id:$id,type:ANIME,isAdult:false){id idMal isAdult genres status episodes nextAiringEpisode{episode airingAt timeUntilAiring} streamingEpisodes{title}}}`, {id});
    const m = data?.Media;
    if (!m || m.isAdult !== false || m.genres?.some((g:string)=>["Hentai","Erotica","Ecchi"].includes(g))) {
      return NextResponse.json({error:"Anime not found"}, {status:404});
    }
    const announced = Number.isSafeInteger(m.episodes) && m.episodes > 0 ? m.episodes : null;
    const next = Number(m.nextAiringEpisode?.episode);
    const titles = new Map<number,string>();
    for(const item of m.streamingEpisodes || []) {
      const match = String(item.title || "").match(/\bEpisode\s+(\d+)\b\s*[-–:]?\s*(.*)/i);
      const n = Number(match?.[1]);
      if (Number.isSafeInteger(n) && n > 0 && n <= 10000) titles.set(n, match?.[2] || "Episode " + n);
    }
    const observed = Math.max(0,...titles.keys());
    const count = Math.min(10000, m.status === "NOT_YET_RELEASED" ? 0 :
      Number.isSafeInteger(next) && next > 0 ? Math.max(0,next-1) :
      m.status === "FINISHED" ? (announced ?? observed) : observed);
    const episodes:Episode[] = Array.from({length:count},(_,i)=>({
      title:titles.get(i+1)||"Episode "+(i+1),
      episodeId:String(i+1), number:i+1, isFiller:false
    }));
    return NextResponse.json({
      totalEpisodes:episodes.length, episodes, announcedEpisodes:announced,
      nextAiringEpisode:m.nextAiringEpisode||null, availableProviders:[],
      mappings:{anilistId:id,malId:m.idMal||undefined,nextAiringEpisode:m.nextAiringEpisode||null},
      providers:{}, source:"AniList", metadataOnly:true
    }, {headers:CACHE_HEADERS});
  } catch {
    return NextResponse.json({error:"Episode catalog unavailable"},{status:503});
  }
}
