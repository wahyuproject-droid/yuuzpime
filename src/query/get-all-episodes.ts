import { GET_ALL_EPISODES } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { resolveApiEndpoint } from "@/lib/local-proxy";
import { Episode, IEpisodes } from "@/types/episodes";
import { EpisodeResponse, NextAiringEpisode } from "@/types/miruro-api";
import { useQuery } from "@tanstack/react-query";

const KNOWN_PROVIDERS = [
  "anizone",
  "reanime",
  "anikoto",
  "aniwaves",
  "animegg",
  "animenosub",
  "kaa",
  "animedunya",
  "animeonsen",
  "senshi",
  "anipm",
  "mkissa",
];

export interface IEpisodesData extends IEpisodes {
  rawResponse?: EpisodeResponse;
  availableProviders?: string[];
  nextAiringEpisode?: NextAiringEpisode | null;
}

const fetchAniListEpisodesFallback = async (
  animeId: string,
): Promise<IEpisodesData> => {
  try {
    const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          id
          episodes
          status
          nextAiringEpisode {
            episode
            airingAt
            timeUntilAiring
          }
        }
      }
    `;
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { id: parseInt(animeId, 10) || 0 },
      }),
    });

    if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
    const json = await res.json();
    const media = json?.data?.Media;
    const released = media?.nextAiringEpisode?.episode
      ? Number(media.nextAiringEpisode.episode) - 1
      : media?.status === "FINISHED" ? Number(media.episodes) : 0;
    const totalEpCount = Number.isSafeInteger(released) && released > 0 ? released : 0;
    const episodes: Episode[] = Array.from(
      { length: totalEpCount },
      (_, i) => {
        const epNum = i + 1;
        return {
          title: `Episode ${epNum}`,
          episodeId: `${epNum}`,
          number: epNum,
          isFiller: false,
          hasSub: false,
          hasDub: false,
        };
      },
    );

    return {
      totalEpisodes: episodes.length,
      episodes,
      availableProviders: [],
      nextAiringEpisode: media?.nextAiringEpisode || null,
    };
  } catch (err) {
    console.error("AniList fallback error:", err);
    return {
      totalEpisodes: 0,
      episodes: [],
      availableProviders: [],
    };
  }
};

const getAllEpisodes = async (animeId: string, signal: AbortSignal): Promise<IEpisodesData> => {
  try {
    const endpointUrl = await resolveApiEndpoint(`/episodes/${animeId}`);
    const deadline = AbortSignal.any([signal, AbortSignal.timeout(25000)]);
    const res = endpointUrl.startsWith("http")
      ? await fetch(endpointUrl, { signal: deadline }).then(async (r) => {
          if (!r.ok) throw new Error(`Episodes HTTP ${r.status}`);
          return { data: await r.json() };
        })
      : await api.get<EpisodeResponse>(`/episodes/${animeId}`, { signal: deadline, timeout: 25000 });
    const data: any = res.data;

    const providersMap: Record<string, any> = { ...(data.providers || {}) };
    for (const p of KNOWN_PROVIDERS) {
      if (!providersMap[p] && data[p] && !data[p].error && data[p].episodes) {
        const subLen = data[p].episodes?.sub?.length || 0;
        const dubLen = data[p].episodes?.dub?.length || 0;
        if (subLen > 0 || dubLen > 0) {
          providersMap[p] = data[p];
        }
      }
    }

    const providerNames = Object.keys(providersMap).sort((a, b) => {
      const idxA = KNOWN_PROVIDERS.indexOf(a);
      const idxB = KNOWN_PROVIDERS.indexOf(b);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    const subEpNumbers = new Set<number>();
    const dubEpNumbers = new Set<number>();

    for (const pName of providerNames) {
      const pData = providersMap[pName]?.episodes;
      if (pData?.sub) {
        pData.sub.forEach((ep: any) => subEpNumbers.add(Number(ep.number)));
      }
      if (pData?.dub) {
        pData.dub.forEach((ep: any) => dubEpNumbers.add(Number(ep.number)));
      }
    }

    const allEpNumbersSet = new Set<number>([
      ...Array.from(subEpNumbers),
      ...Array.from(dubEpNumbers),
    ]);
    const allEpisodeNumbers = Array.from(allEpNumbersSet)
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);

    const episodeList: Episode[] = allEpisodeNumbers.map((epNum) => {
      let epDetail: any = null;
      let fallbackId = "";

      for (const pName of providerNames) {
        const pData = providersMap[pName]?.episodes;
        const subMatch = pData?.sub?.find((e: any) => Number(e.number) === epNum);
        const dubMatch = pData?.dub?.find((e: any) => Number(e.number) === epNum);

        if (subMatch) {
          epDetail = subMatch;
          fallbackId = subMatch.id;
          break;
        }
        if (dubMatch && !epDetail) {
          epDetail = dubMatch;
          fallbackId = dubMatch.id;
        }
      }

      return {
        title: epDetail?.title || `Episode ${epNum}`,
        episodeId: fallbackId || `${epNum}`,
        number: epNum,
        isFiller: !!epDetail?.filler,
        hasSub: subEpNumbers.has(epNum),
        hasDub: dubEpNumbers.has(epNum),
      };
    });

    if (episodeList.length === 0) {
      return await fetchAniListEpisodesFallback(animeId);
    }

    const normalizedRawResponse: EpisodeResponse = {
      ...data,
      mappings: data.mappings || { anilistId: Number(animeId) },
      providers: providersMap,
    };

    return {
      totalEpisodes: episodeList.length,
      episodes: episodeList,
      rawResponse: normalizedRawResponse,
      availableProviders: providerNames,
      nextAiringEpisode: data.mappings?.nextAiringEpisode || null,
    };
  } catch (err) {
    // Preserve network failures as errors instead of implying playable episodes exist.
    throw err;
  }
};

export const useGetAllEpisodes = (animeId: string) => {
  return useQuery({
    queryFn: ({ signal }) => getAllEpisodes(animeId, signal),
    retry: false,
    refetchOnWindowFocus: false,
    queryKey: [GET_ALL_EPISODES, animeId],
    enabled: !!animeId,
  });
};
