import { getAccessToken } from "../modules/auth/oauth-providers.service.js";
import type { WidgetContext } from "../widgets/registry.js";

export interface OutlookMessage {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
}

export interface OutlookUnreadSummary {
  count: number;
  messages: OutlookMessage[];
}

interface GraphMessage {
  id: string;
  subject: string;
  from?: { emailAddress?: { address?: string; name?: string } };
  receivedDateTime: string;
}

interface GraphListResponse {
  value?: GraphMessage[];
}

interface UnreadMessagesConfig {
  folder: string;
  number: number;
}

/** Adaptateur outlook_unread — Microsoft Graph (OAuth, scope Mail.Read). */
export async function fetchUnreadMessages(config: UnreadMessagesConfig, ctx: WidgetContext): Promise<OutlookUnreadSummary> {
  const token = await getAccessToken(ctx.userId, "outlook");
  const n = Math.min(Math.max(config.number, 1), 10);

  const folder = encodeURIComponent(config.folder || "inbox");
  const url =
    `https://graph.microsoft.com/v1.0/me/mailFolders/${folder}/messages` +
    `?$filter=isRead eq false&$top=${n}&$select=subject,from,receivedDateTime&$orderby=receivedDateTime desc`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Outlook API indisponible (${res.status}: ${await res.text()})`);
  const data = (await res.json()) as GraphListResponse;

  const messages = (data.value ?? []).map((m) => ({
    id: m.id,
    subject: m.subject || "(sans objet)",
    from: m.from?.emailAddress?.name ?? m.from?.emailAddress?.address ?? "",
    receivedAt: m.receivedDateTime,
  }));

  return { count: messages.length, messages };
}
