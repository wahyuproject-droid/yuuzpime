import { GET_ALL_EPISODES } from "@/constants/query-keys";
import { api } from "@/lib/api";
import type { IEpisodes } from "@/types/episodes";
import type { EpisodeResponse, NextAiringEpisode } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

export interface IEpisodesData extends IEpisodes {
  rawResponse?: EpisodeResponse;
  availableProviders?: string[];
  nextAiringEpisode?: NextAiringEpisode | null;
  announcedEpisodes?: number | null;
  metadataOnly?: boolean;
}

const getAllEpisodes = async (animeId:string):Promise<IEpisodesData> => {
  const {data} = await api.get<IEpisodesData>("/episodes/"+encodeURIComponent(animeId));
  if(!Array.isArray(data.episodes)) throw new Error("Invalid episode catalog");
  return data;
};
export const useGetAllEpisodes = (animeId:string) => useQuery({
  queryFn:()=>getAllEpisodes(animeId),
  queryKey:[GET_ALL_EPISODES,animeId],
  enabled:/^\d+$/.test(animeId),
  staleTime:300000,
  retry:1
});
