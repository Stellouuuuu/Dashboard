import { describe, it, expect } from "vitest";
import { assertPublicHttpUrl } from "../safeUrl.js";

describe("assertPublicHttpUrl (anti-SSRF)", () => {
  it.each([
    "http://127.0.0.1:3000/",
    "http://10.0.0.5/feed",
    "http://192.168.1.1/",
    "http://172.16.0.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "file:///etc/passwd",
    "ftp://example.com/feed",
    "not a url",
  ])("rejects %s", async (url) => {
    await expect(assertPublicHttpUrl(url)).rejects.toMatchObject({ status: 400 });
  });

  it("accepts a public IP literal", async () => {
    const url = await assertPublicHttpUrl("https://8.8.8.8/rss");
    expect(url.hostname).toBe("8.8.8.8");
  });
});
