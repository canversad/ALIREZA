/**
 * YouTube Data API v3 discovery provider (DiscoveryProvider port).
 *
 * The one fully-official, free, ToS-clean discovery path from the research.
 * For each niche keyword:
 *   search.list  (order=viewCount, publishedAfter=window, regionCode=CA, type=video)
 *   → videos.list   (statistics + contentDetails for the hit ids)
 *   → channels.list (subscriber counts, for the "creator baseline" score input)
 * Maps into VideoEvidence with provenance "official-api" (renders "high confidence").
 *
 * Quota note (research §2.5): search.list sits in a small daily bucket, so we
 * cap the number of keyword searches per harvest and dedupe aggressively.
 */
import type { DiscoveryProvider } from "@/core/ports";
import type { Platform, VideoEvidence, VideoMetrics } from "@/core/domain/types";
import { classifyFormat, parseIsoDuration } from "./format-classifier";

const API = "https://www.googleapis.com/youtube/v3";
const MAX_KEYWORDS = Number(process.env.CI_YOUTUBE_MAX_KEYWORDS ?? 6); // quota guard
const RESULTS_PER_KEYWORD = 10;

interface SearchItem {
  id: { videoId: string };
}
interface VideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    tags?: string[];
    defaultAudioLanguage?: string;
    defaultLanguage?: string;
  };
  statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
  contentDetails: { duration: string };
}
interface ChannelItem {
  id: string;
  statistics: { subscriberCount?: string };
}

export class YouTubeDiscoveryProvider implements DiscoveryProvider {
  readonly id = "youtube-data-api-v3";
  private readonly platform: Platform = "youtube";

  constructor(private apiKey = process.env.YOUTUBE_API_KEY ?? "") {
    if (!this.apiKey) throw new Error("YOUTUBE_API_KEY is not set");
  }

  private async get<T>(path: string, params: Record<string, string>): Promise<T> {
    const qs = new URLSearchParams({ ...params, key: this.apiKey });
    const res = await fetch(`${API}/${path}?${qs}`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // Surface the real reason (quota, bad key, disabled API) instead of a generic 500.
      throw new Error(`YouTube API ${path} → HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    return res.json() as Promise<T>;
  }

  async harvest(input: { nicheKeywords: string[]; windowDays: number }): Promise<VideoEvidence[]> {
    const publishedAfter = new Date(Date.now() - input.windowDays * 86_400_000).toISOString();
    const keywords = input.nicheKeywords.slice(0, MAX_KEYWORDS);

    // 1. search.list per keyword → collect unique video ids
    const videoIds = new Set<string>();
    for (const keyword of keywords) {
      const data = await this.get<{ items?: SearchItem[] }>("search", {
        part: "snippet",
        q: keyword,
        type: "video",
        order: "viewCount",
        publishedAfter,
        regionCode: "CA",
        relevanceLanguage: "en",
        maxResults: String(RESULTS_PER_KEYWORD),
      });
      for (const item of data.items ?? []) {
        if (item.id?.videoId) videoIds.add(item.id.videoId);
      }
    }
    if (videoIds.size === 0) return [];

    // 2. videos.list — statistics + contentDetails (batches of 50)
    const videos: VideoItem[] = [];
    const ids = [...videoIds];
    for (let i = 0; i < ids.length; i += 50) {
      const data = await this.get<{ items?: VideoItem[] }>("videos", {
        part: "snippet,statistics,contentDetails",
        id: ids.slice(i, i + 50).join(","),
        maxResults: "50",
      });
      videos.push(...(data.items ?? []));
    }

    // 3. channels.list — subscriber counts for the creator baseline
    const channelIds = [...new Set(videos.map((v) => v.snippet.channelId))];
    const subs = new Map<string, number>();
    for (let i = 0; i < channelIds.length; i += 50) {
      const data = await this.get<{ items?: ChannelItem[] }>("channels", {
        part: "statistics",
        id: channelIds.slice(i, i + 50).join(","),
        maxResults: "50",
      });
      for (const ch of data.items ?? []) {
        subs.set(ch.id, Number(ch.statistics.subscriberCount ?? 0));
      }
    }

    const now = new Date().toISOString();
    return videos.map((v) => this.toEvidence(v, subs.get(v.snippet.channelId) ?? 0, now));
  }

  private toEvidence(v: VideoItem, followerCount: number, fetchedAt: string): VideoEvidence {
    const views = Number(v.statistics.viewCount ?? 0);
    const likes = Number(v.statistics.likeCount ?? 0);
    const comments = Number(v.statistics.commentCount ?? 0);
    const durationSec = parseIsoDuration(v.contentDetails.duration);
    // YouTube exposes no share count; keep it 0 rather than invent one.
    const shares = 0;
    const engagementRate = views > 0 ? (likes + comments + shares) / views : 0;
    const overperformance = followerCount > 0 ? views / followerCount : 0;
    const metrics: VideoMetrics = { views, likes, comments, shares, engagementRate, overperformance };

    const language = v.snippet.defaultAudioLanguage ?? v.snippet.defaultLanguage;

    return {
      platform: this.platform,
      url: `https://www.youtube.com/watch?v=${v.id}`,
      title: v.snippet.title,
      creator: {
        handle: v.snippet.channelId,
        displayName: v.snippet.channelTitle,
        followerCount,
      },
      publishedAt: v.snippet.publishedAt,
      durationSec,
      format: classifyFormat({
        title: v.snippet.title,
        description: v.snippet.description,
        durationSec,
      }),
      tags: (v.snippet.tags ?? []).slice(0, 12),
      metrics,
      provenance: "official-api",
      fetchedAt,
      language: language ? language.split("-")[0] : undefined,
      region: "CA", // regionCode used in the search; not a per-video guarantee
    };
  }
}
