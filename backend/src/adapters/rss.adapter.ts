import { parseStringPromise } from "xml2js";

type FeedConfig = { link: string; number: number };

type FeedItem = {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
  source: string;
};

/**
 * Adaptateur feed_summary – Membre B
 * Récupère les N derniers articles d'un flux RSS et retourne un résumé agrégé.
 * Paramètres : link (URL RSS), number (nb articles max)
 */
export async function fetchFeedSummary(config: FeedConfig): Promise<FeedItem[]> {
  const res = await fetch(config.link, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!res.ok) throw new Error(`Impossible de récupérer le flux RSS: ${res.status}`);

  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true });

  const channel = parsed?.rss?.channel ?? parsed?.feed;
  if (!channel) throw new Error("Format RSS non reconnu");

  // Supporte RSS 2.0 et Atom
  const rawItems: unknown[] = channel.item
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
    new URL(config.link).hostname;

  const items = rawItems.slice(0, config.number).map((item: any): FeedItem => {
    const title =
      typeof item.title === "string" ? item.title : item.title?._ ?? "(sans titre)";
    const link =
      typeof item.link === "string"
        ? item.link
        : item.link?.href ?? item.link?._ ?? "";
    const pubDate = item.pubDate ?? item.published ?? item.updated ?? null;
    const description =
      typeof item.description === "string"
        ? item.description
        : item.summary?._ ?? item.summary ?? null;

    return {
      title: title.trim(),
      link,
      pubDate,
      description: description
        ? (description as string).replace(/<[^>]+>/g, "").slice(0, 200)
        : null,
      source: feedTitle,
    };
  });

  return items;
}
