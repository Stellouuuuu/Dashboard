import { parseStringPromise } from "xml2js";

interface FeedSummaryConfig {
  links: string;
  number: number;
}

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
  source: string;
}

async function parseFeed(link: string): Promise<FeedItem[]> {
  const res = await fetch(link, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!res.ok) throw new Error(`Impossible de récupérer le flux RSS: ${res.status}`);
  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true });
  const channel = parsed?.rss?.channel ?? parsed?.feed;
  if (!channel) throw new Error("Format RSS non reconnu");

  const rawItems: any[] = channel.item
    ? Array.isArray(channel.item)
      ? channel.item
      : [channel.item]
    : channel.entry
      ? Array.isArray(channel.entry)
        ? channel.entry
        : [channel.entry]
      : [];

  const feedTitle: string =
    (typeof channel.title === "string" ? channel.title : channel.title?._) ??
    new URL(link).hostname;

  return rawItems.map((item) => {
    const title = typeof item.title === "string" ? item.title : (item.title?._ ?? "(sans titre)");
    const itemLink = typeof item.link === "string" ? item.link : (item.link?.href ?? item.link?._ ?? "");
    const pubDate = item.pubDate ?? item.published ?? item.updated ?? null;
    const description =
      typeof item.description === "string"
        ? item.description
        : (item.summary?._ ?? item.summary ?? null);
    return {
      title: title.trim(),
      link: itemLink,
      pubDate,
      description: description ? description.replace(/<[^>]+>/g, "").slice(0, 200) : null,
      source: feedTitle,
    };
  });
}

// Nom de paramètre du sujet : "link" (un seul flux, contrairement à feed_summary
// qui prend "links" en pluriel).
interface ArticleListConfig {
  link: string;
  number: number;
}

/**
 * Adaptateur article_list — derniers articles d'un seul flux RSS/Atom (PLAN.md §5).
 * Contrairement à feed_summary (Membre B, plusieurs flux fusionnés et triés), on
 * garde ici l'ordre natif du flux, qui est déjà du plus récent au plus ancien.
 */
export async function fetchArticleList(config: ArticleListConfig): Promise<FeedItem[]> {
  const items = await parseFeed(config.link);
  return items.slice(0, config.number);
}

/**
 * Adaptateur feed_summary — fusionne plusieurs flux RSS/Atom (paramètre `links`,
 * séparé par des virgules), triés par date décroissante. C'est ce qui le distingue
 * de article_list (Membre A, un seul flux) — PLAN.md §5.
 */
export async function fetchFeedSummary(config: FeedSummaryConfig): Promise<FeedItem[]> {
  const links = config.links
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  if (links.length === 0) throw new Error("Au moins un lien de flux est requis");

  const results = await Promise.all(links.map((link) => parseFeed(link)));
  const merged = results.flat();
  merged.sort((a, b) => {
    const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return dateB - dateA;
  });

  return merged.slice(0, config.number);
}
