import { describe, it, expect } from "vitest";
import { parseSpotifyEmbed } from "../spotify.adapter.js";
import { WIDGET_REGISTRY } from "../../widgets/registry.js";

describe("parseSpotifyEmbed", () => {
  it("accepte un lien web et construit l'URL d'intégration", () => {
    const e = parseSpotifyEmbed("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc");
    expect(e).toMatchObject({ kind: "playlist", id: "37i9dQZF1DXcBWIGoYBM5M", embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M" });
  });
  it("accepte un URI spotify:", () => {
    expect(parseSpotifyEmbed("spotify:track:4uLU6hMCjMI75M1A2tKUQC")?.kind).toBe("track");
  });
  it.each(["https://evil.com/playlist/37i9dQZF1DXcBWIGoYBM5M", "https://open.spotify.com.evil.com/track/4uLU6hMCjMI75M1A2tKUQC", "javascript:alert(1)", "https://open.spotify.com/user/abc", ""])(
    "refuse %s",
    (v) => expect(parseSpotifyEmbed(v)).toBeNull(),
  );
});

describe("widgets Spotify / LinkedIn", () => {
  it("hashtag_watch refuse une saisie sans hashtag valide", () => {
    expect(WIDGET_REGISTRY.hashtag_watch.schema.safeParse({ hashtags: "<>, !!" }).success).toBe(false);
    expect(WIDGET_REGISTRY.hashtag_watch.schema.safeParse({ hashtags: "#ia, cloud" }).success).toBe(true);
  });
});
