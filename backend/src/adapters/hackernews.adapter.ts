export interface HnStory {
  objectID: string;
  title: string;
  url: string | null;
  points: number;
  author: string;
  commentsCount: number;
  createdAt: string;
}

interface AlgoliaHit {
  objectID: string;
  title: string | null;
  story_title: string | null;
  url: string | null;
  story_url: string | null;
  points: number | null;
  author: string;
  num_comments: number | null;
  created_at: string;
}

interface AlgoliaResponse {
  hits: AlgoliaHit[];
}

function toStory(hit: AlgoliaHit): HnStory {
  return {
    objectID: hit.objectID,
    title: hit.title ?? hit.story_title ?? "(sans titre)",
    url: hit.url ?? hit.story_url ?? null,
    points: hit.points ?? 0,
    author: hit.author,
    commentsCount: hit.num_comments ?? 0,
    createdAt: hit.created_at,
  };
}

interface TopStoriesConfig {
  number: number;
}

/**
 * Adaptateur top_stories — Hacker News via l'API Algolia (gratuite, sans clé),
 * page d'accueil (`tags=front_page`). Service "Hacker News" : sans compte (PLAN.md §5).
 */
export async function fetchTopStories(config: TopStoriesConfig): Promise<HnStory[]> {
  const n = Math.min(Math.max(config.number, 1), 30);
  const url = `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${n}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hacker News indisponible (${res.status})`);
  const data = (await res.json()) as AlgoliaResponse;
  return data.hits.map(toStory);
}

interface StorySearchConfig {
  query: string;
  number: number;
}

/** Adaptateur story_search — recherche Hacker News par mot-clé via l'API Algolia. */
export async function fetchStorySearch(config: StorySearchConfig): Promise<HnStory[]> {
  const n = Math.min(Math.max(config.number, 1), 30);
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(config.query)}&tags=story&hitsPerPage=${n}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hacker News indisponible (${res.status})`);
  const data = (await res.json()) as AlgoliaResponse;
  return data.hits.map(toStory);
}
