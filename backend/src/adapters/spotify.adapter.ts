import { httpError } from "../lib/httpError.js";

export interface SpotifyEmbed {
  kind: "track" | "album" | "playlist" | "artist" | "episode" | "show";
  id: string;
  embedUrl: string;
  url: string;
}

const EMBED_KINDS = ["track", "album", "playlist", "artist", "episode", "show"];

/** Accepte un lien open.spotify.com/... ou un URI spotify:kind:id et renvoie l'URL d'intégration du lecteur. */
export function parseSpotifyEmbed(raw: string): SpotifyEmbed | null {
  const uri = raw.trim().match(/^spotify:([a-z]+):([A-Za-z0-9]{10,30})$/);
  const web = raw.trim().match(/^https:\/\/open\.spotify\.com\/(?:intl-[a-z]+\/)?([a-z]+)\/([A-Za-z0-9]{10,30})(?:[?#].*)?$/);
  const m = uri ?? web;
  if (!m || !EMBED_KINDS.includes(m[1])) return null;
  const [, kind, id] = m;
  return {
    kind: kind as SpotifyEmbed["kind"],
    id,
    embedUrl: `https://open.spotify.com/embed/${kind}/${id}`,
    url: `https://open.spotify.com/${kind}/${id}`,
  };
}

/** Adaptateur player — aucune requête API : le lecteur est l'iframe officiel, qui lit avec la session Spotify du navigateur. */
export async function fetchPlayer(config: { uri: string }): Promise<SpotifyEmbed> {
  const embed = parseSpotifyEmbed(config.uri);
  if (!embed) throw httpError(400, "DASHBOARD_CONFIG_INVALID", "Lien Spotify invalide");
  return embed;
}
