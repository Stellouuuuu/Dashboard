import { env } from "../config/env.js";

export interface YoutubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string | null;
  url: string;
}

export interface YoutubeVideoStats {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string | null;
  viewCount: number;
  likeCount: number | null;
  commentCount: number | null;
  publishedAt: string;
  url: string;
}

interface YtThumbnails {
  default?: { url: string };
  medium?: { url: string };
}

interface YtChannelsResponse {
  items?: {
    id: string;
    snippet?: { title: string };
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }[];
}

interface YtPlaylistItemsResponse {
  items?: {
    snippet?: {
      title: string;
      publishedAt: string;
      resourceId?: { videoId: string };
      thumbnails?: YtThumbnails;
    };
  }[];
}

interface YtVideosResponse {
  items?: {
    id: string;
    snippet?: { title: string; channelTitle: string; publishedAt: string; thumbnails?: YtThumbnails };
    statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  }[];
}

function requireApiKey(): string {
  if (!env.YOUTUBE_API_KEY) throw new Error("Clé API YouTube manquante (YOUTUBE_API_KEY)");
  return env.YOUTUBE_API_KEY;
}

/**
 * Accepte un handle (@nom), un ID de chaîne (UCxxxxxxxxxxxxxxxxxxxxxx) ou une
 * URL youtube.com/@..., /channel/..., /c/... ou /user/..., et renvoie de quoi
 * interroger l'API `channels.list` (par id ou par handle).
 */
function parseChannelRef(raw: string): { byId: boolean; value: string } {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/youtube\.com\/(channel\/|@|c\/|user\/)?([^/?#\s]+)/i);
  let ref = trimmed;
  if (urlMatch) {
    const prefix = urlMatch[1] ?? "";
    const name = urlMatch[2];
    if (prefix === "channel/") return { byId: true, value: name };
    ref = prefix === "@" && !name.startsWith("@") ? `@${name}` : name;
  }
  if (/^UC[\w-]{22}$/.test(ref)) return { byId: true, value: ref };
  return { byId: false, value: ref.startsWith("@") ? ref : `@${ref}` };
}

async function resolveChannel(
  raw: string,
  key: string,
): Promise<{ channelId: string; uploadsPlaylistId: string; title: string }> {
  const ref = parseChannelRef(raw);
  const param = ref.byId ? `id=${encodeURIComponent(ref.value)}` : `forHandle=${encodeURIComponent(ref.value)}`;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&${param}&key=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Chaîne YouTube introuvable (${res.status}: ${await res.text()})`);
  const data = (await res.json()) as YtChannelsResponse;
  const item = data.items?.[0];
  const uploads = item?.contentDetails?.relatedPlaylists?.uploads;
  if (!item || !uploads) throw new Error(`Chaîne YouTube introuvable: ${raw}`);
  return { channelId: item.id, uploadsPlaylistId: uploads, title: item.snippet?.title ?? raw };
}

interface ChannelLatestVideosConfig {
  channel: string;
  number: number;
}

/** Adaptateur channel_latest_videos — YouTube Data API v3 (clé gratuite, quota 10 000 unités/jour). */
export async function fetchChannelLatestVideos(config: ChannelLatestVideosConfig): Promise<YoutubeVideo[]> {
  const key = requireApiKey();
  const n = Math.min(Math.max(config.number, 1), 10);
  const channel = await resolveChannel(config.channel, key);

  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${n}&playlistId=${channel.uploadsPlaylistId}&key=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Impossible de récupérer les vidéos (${res.status}: ${await res.text()})`);
  const data = (await res.json()) as YtPlaylistItemsResponse;

  return (data.items ?? [])
    .filter((it) => it.snippet?.resourceId?.videoId)
    .map((it) => {
      const s = it.snippet!;
      const videoId = s.resourceId!.videoId;
      return {
        videoId,
        title: s.title,
        channelTitle: channel.title,
        publishedAt: s.publishedAt,
        thumbnail: s.thumbnails?.medium?.url ?? s.thumbnails?.default?.url ?? null,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    });
}

/** Accepte un ID brut (11 caractères) ou une URL watch?v=/youtu.be/shorts/embed. */
export function parseYoutubeVideoId(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/);
  return m ? m[1] : null;
}

interface VideoStatsConfig {
  video: string;
}

/** Adaptateur video_stats — YouTube Data API v3 (clé gratuite). */
export async function fetchVideoStats(config: VideoStatsConfig): Promise<YoutubeVideoStats> {
  const key = requireApiKey();
  const id = parseYoutubeVideoId(config.video);
  if (!id) throw new Error(`Lien ou ID de vidéo YouTube invalide: ${config.video}`);

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${id}&key=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Impossible de récupérer la vidéo (${res.status}: ${await res.text()})`);
  const data = (await res.json()) as YtVideosResponse;
  const item = data.items?.[0];
  if (!item) throw new Error(`Vidéo introuvable: ${config.video}`);

  return {
    id: item.id,
    title: item.snippet?.title ?? "",
    channelTitle: item.snippet?.channelTitle ?? "",
    thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
    viewCount: Number(item.statistics?.viewCount ?? 0),
    likeCount: item.statistics?.likeCount != null ? Number(item.statistics.likeCount) : null,
    commentCount: item.statistics?.commentCount != null ? Number(item.statistics.commentCount) : null,
    publishedAt: item.snippet?.publishedAt ?? "",
    url: `https://www.youtube.com/watch?v=${item.id}`,
  };
}
