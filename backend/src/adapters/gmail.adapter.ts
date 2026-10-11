import { getAccessToken } from "../modules/auth/oauth-providers.service.js";
import type { WidgetContext } from "../widgets/registry.js";

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  snippet: string;
}

export interface GmailUnreadSummary {
  count: number;
  messages: GmailMessage[];
}

interface GmailListResponse {
  messages?: { id: string }[];
  resultSizeEstimate?: number;
}

interface GmailMessageResponse {
  id: string;
  snippet: string;
  payload?: { headers?: { name: string; value: string }[] };
}

function header(headers: { name: string; value: string }[] | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

interface UnreadMessagesConfig {
  query: string;
  number: number;
}

/** Adaptateur gmail_unread — Gmail API (OAuth Google, scope gmail.readonly). */
export async function fetchUnreadMessages(config: UnreadMessagesConfig, ctx: WidgetContext): Promise<GmailUnreadSummary> {
  const token = await getAccessToken(ctx.userId, "gmail");
  const n = Math.min(Math.max(config.number, 1), 10);

  const listUrl = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(config.query)}&maxResults=${n}`;
  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
  if (!listRes.ok) throw new Error(`Gmail API indisponible (${listRes.status}: ${await listRes.text()})`);
  const list = (await listRes.json()) as GmailListResponse;
  const ids = (list.messages ?? []).map((m) => m.id);

  const messages = await Promise.all(
    ids.map(async (id) => {
      const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`Gmail API indisponible (${res.status})`);
      const m = (await res.json()) as GmailMessageResponse;
      return {
        id: m.id,
        subject: header(m.payload?.headers, "Subject") || "(sans objet)",
        from: header(m.payload?.headers, "From"),
        snippet: m.snippet,
      };
    }),
  );

  return { count: list.resultSizeEstimate ?? messages.length, messages };
}
