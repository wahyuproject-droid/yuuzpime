/**
 * Adapted from Miru Web src/lib/anilist.ts (uploaded revision 15dd1b636d15f7bf740a4f768463a09c10411dda).
 * Copyright (c) 2026 Dovakiin0. MIT; see licenses/MIRU.txt.
 * Combine the original popular, trending and upcoming queries for the YuuZPime UI.
 */
import { fetchAniListGraphQL, normalizeAniListMedia } from '@/lib/anilist';
import type { Anime } from '@/types';

const MEDIA_FIELDS = `
  id idMal title { romaji english native }
  coverImage { medium large extraLarge color } bannerImage
  format season seasonYear episodes duration status averageScore meanScore
  popularity favourites genres countryOfOrigin isAdult description
  nextAiringEpisode { episode airingAt timeUntilAiring }
  startDate { year month day } endDate { year month day }
  studios { nodes { name isAnimationStudio } }
`;
const HOME_QUERY = `query MiruHome {
  spotlight: Page(page:1,perPage:8) {
    media(type:ANIME,status:RELEASING,sort:TRENDING_DESC,isAdult:false) { ${MEDIA_FIELDS} }
  }
  popular: Page(page:1,perPage:12) {
    media(type:ANIME,sort:POPULARITY_DESC,isAdult:false) { ${MEDIA_FIELDS} }
  }
  airing: Page(page:1,perPage:12) {
    media(type:ANIME,status:RELEASING,sort:TRENDING_DESC,isAdult:false) { ${MEDIA_FIELDS} }
  }
  upcoming: Page(page:1,perPage:12) {
    media(type:ANIME,status:NOT_YET_RELEASED,sort:POPULARITY_DESC,isAdult:false) { ${MEDIA_FIELDS} }
  }
}`;
type Group = { media?: Array<{idMal?: number;isAdult?: boolean;genres?: string[]}> };
type Home = { spotlight: Group; popular: Group; airing: Group; upcoming: Group };
export type MiruHome = { featured: Anime[]; popular: Anime[]; airing: Anime[]; upcoming: Anime[] };
let active: Promise<MiruHome> | undefined;
export function getMiruHome(): Promise<MiruHome> {
  if(active) return active;
  active = fetchAniListGraphQL<Home>(HOME_QUERY, {}, 600).then(data => {
    const map = (group: Group): Anime[] => (group?.media || [])
      .filter(item => item.isAdult === false && Number.isInteger(item.idMal) && !item.genres?.some(g => ['Hentai','Erotica','Ecchi'].includes(g)))
      .map(normalizeAniListMedia);
    return { featured: map(data.spotlight), popular: map(data.popular), airing: map(data.airing), upcoming: map(data.upcoming) };
  }).finally(() => { active = undefined; });
  return active;
}
