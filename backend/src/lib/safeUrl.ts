import { lookup } from "node:dns/promises";
import net from "node:net";
import { httpError } from "./httpError.js";

export const FETCH_TIMEOUT_MS = 10_000;

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

/**
 * Garde anti-SSRF pour les URLs fournies par l'utilisateur (flux RSS) : http(s) uniquement
 * et refus des hôtes qui résolvent vers une adresse privée/loopback (api, postgres, metadata…).
 */
export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw httpError(400, "DASHBOARD_CONFIG_INVALID", `URL invalide: ${raw}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw httpError(400, "DASHBOARD_CONFIG_INVALID", "Seules les URLs http(s) sont autorisées");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addresses.some((a) => isPrivateIp(a.address))) {
    throw httpError(400, "DASHBOARD_CONFIG_INVALID", "Adresse non autorisée");
  }
  return url;
}
