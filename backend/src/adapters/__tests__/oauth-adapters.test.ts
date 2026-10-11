import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../modules/auth/oauth-providers.service.js", () => ({ getAccessToken: vi.fn(async () => "tok") }));

import { fetchJobSearch, fetchHashtagWatch } from "../linkedin.adapter.js";

const track = {
  id: "t1", name: "Song", duration_ms: 1000,
  artists: [{ name: "A" }, { name: "B" }],
  album: { name: "Album", images: [{ url: "https://i.scdn.co/x" }] },
  external_urls: { spotify: "https://open.spotify.com/track/t1" },
};
const json = (body: unknown, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), { status });

describe("adapters Spotify / LinkedIn (API mockée)", () => {
  const fetchMock = vi.fn();
  beforeEach(() => vi.stubGlobal("fetch", fetchMock));
  afterEach(() => { fetchMock.mockReset(); vi.unstubAllGlobals(); });

  it("job_search : construit l'URL de recherche LinkedIn", async () => {
    const r = await fetchJobSearch({ keywords: "dev react", location: "Paris", job_type: "internship", period: "week" });
    const u = new URL(r.url);
    expect(u.origin + u.pathname).toBe("https://www.linkedin.com/jobs/search/");
    expect(u.searchParams.get("keywords")).toBe("dev react");
    expect(u.searchParams.get("location")).toBe("Paris");
    expect(u.searchParams.get("f_JT")).toBe("I");
    expect(u.searchParams.get("f_TPR")).toBe("r604800");
    const any = new URL((await fetchJobSearch({ keywords: "a", location: "", job_type: "any", period: "any" })).url);
    expect(any.searchParams.has("f_JT") || any.searchParams.has("location") || any.searchParams.has("f_TPR")).toBe(false);
  });

  it("hashtag_watch : nettoie, dédoublonne et encode les hashtags", async () => {
    const r = await fetchHashtagWatch({ hashtags: "#IA, devops  ia; <script> café" });
    expect(r.map((x) => x.tag)).toEqual(["ia", "devops", "café"]);
    expect(r[2].url).toBe("https://www.linkedin.com/feed/hashtag/caf%C3%A9/");
  });
});
