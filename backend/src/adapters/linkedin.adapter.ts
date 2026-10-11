export const JOB_TYPES = ["any", "full_time", "part_time", "contract", "internship"] as const;
export const JOB_PERIODS = ["any", "day", "week", "month"] as const;

const JOB_TYPE_CODE: Record<(typeof JOB_TYPES)[number], string | null> = {
  any: null,
  full_time: "F",
  part_time: "P",
  contract: "C",
  internship: "I",
};
const JOB_PERIOD_CODE: Record<(typeof JOB_PERIODS)[number], string | null> = {
  any: null,
  day: "r86400",
  week: "r604800",
  month: "r2592000",
};

export interface LinkedinJobSearch {
  keywords: string;
  location: string;
  jobType: string;
  period: string;
  url: string;
}

/** Adaptateur job_search — construit l'URL de recherche d'offres LinkedIn (aucun appel API, pas de permission requise). */
export async function fetchJobSearch(config: {
  keywords: string;
  location: string;
  job_type: (typeof JOB_TYPES)[number];
  period: (typeof JOB_PERIODS)[number];
}): Promise<LinkedinJobSearch> {
  const params = new URLSearchParams({ keywords: config.keywords });
  if (config.location) params.set("location", config.location);
  const jt = JOB_TYPE_CODE[config.job_type];
  if (jt) params.set("f_JT", jt);
  const tpr = JOB_PERIOD_CODE[config.period];
  if (tpr) params.set("f_TPR", tpr);
  params.set("sortBy", "DD");
  return {
    keywords: config.keywords,
    location: config.location,
    jobType: config.job_type,
    period: config.period,
    url: `https://www.linkedin.com/jobs/search/?${params.toString()}`,
  };
}

export interface LinkedinHashtag {
  tag: string;
  url: string;
}

/** Extrait les hashtags d'une saisie libre (« #ia, devops cloud ») : lettres/chiffres/_, dédoublonnés, 10 max. */
export function parseHashtags(raw: string): string[] {
  const tags = raw
    .split(/[\s,;]+/)
    .map((t) => t.replace(/^#+/, ""))
    .filter((t) => /^[\p{L}\p{N}_]{1,50}$/u.test(t));
  return [...new Set(tags.map((t) => t.toLowerCase()))].slice(0, 10);
}

/** Adaptateur hashtag_watch — liens vers le fil LinkedIn de chaque hashtag suivi. */
export async function fetchHashtagWatch(config: { hashtags: string }): Promise<LinkedinHashtag[]> {
  return parseHashtags(config.hashtags).map((tag) => ({
    tag,
    url: `https://www.linkedin.com/feed/hashtag/${encodeURIComponent(tag)}/`,
  }));
}
