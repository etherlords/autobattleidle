import { createServer, type ViteDevServer } from "vite";
import { describe, expect, it, afterAll } from "vitest";
import manifest from "../../../public/audio/manifest.json";

let server: ViteDevServer | undefined;
const SHA_256_PATTERN = /^[0-9a-f]{64}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
type ManifestEntry = {
  readonly file: string;
  readonly title: string;
  readonly creator: string;
  readonly source: string;
  readonly license?: string;
  readonly generationId?: string;
  readonly generatedAt?: string;
  readonly downloadedAt?: string;
  readonly rights?: string;
  readonly pack?: string;
  readonly packUrl?: string;
  readonly licenseUrl?: string;
  readonly attribution: string;
  readonly durationSeconds: number;
  readonly bytes: number;
  readonly sha256: string;
};

type ManifestLicenses = {
  readonly manifestVersion: number;
  readonly music: readonly ManifestEntry[];
  readonly sfx: readonly ManifestEntry[];
  readonly licenses: readonly {
    readonly id: string;
    readonly appliesTo: string;
    readonly policyUrls?: readonly string[];
    readonly licenseUrl?: string;
  }[];
};

const data = manifest as ManifestLicenses;

const entries = (): readonly ManifestEntry[] => [...data.music, ...data.sfx];

describe("audio asset manifest", () => {
  it("ships every required music and SFX file with complete provenance", () => {
    expect(data.manifestVersion).toBe(1);
    expect(data.music.map((entry) => entry.title)).toEqual([
      "Pastoral Loop",
      "Idle Fantasy",
      "Idle Dawn",
      "Tran exploration",
      "Guardian's Watch — Dawn Patrol",
      "Guardian's Watch — Quiet Rampart",
      "Guardian's Watch — Ember Sentinel",
      "Guardian's Watch — Night Vigil",
    ]);
    expect(data.music).toHaveLength(8);
    expect(data.sfx.length).toBeGreaterThanOrEqual(16);
    for (const entry of entries()) {
      expect(entry.file).toMatch(/^audio\/(music|sfx)\/[a-zA-Z0-9_-]+\.(mp3|ogg)$/);
      expect(entry.creator.length).toBeGreaterThan(0);
      expect(entry.attribution.length).toBeGreaterThan(0);
      expect(entry.durationSeconds).toBeGreaterThan(0);
      expect(entry.bytes).toBeGreaterThan(0);
      expect(entry.sha256).toMatch(SHA_256_PATTERN);

      if (entry.source === "suno") {
        expect(entry.generationId).toMatch(UUID_PATTERN);
        expect(entry.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(entry.downloadedAt).toBeDefined();
        expect(entry.rights).toContain("Suno Pro");
      } else {
        expect(entry.license).toBe("CC0-1.0");
        expect(entry.licenseUrl).toContain("creativecommons.org/publicdomain/zero");
      }
      expect(entry.source).not.toBe("freesound-cc-by-nc");
      expect(entry.license ?? "").not.toMatch(/NC|NonCommercial/i);
      expect(entry.licenseUrl ?? "").not.toMatch(/NC|NonCommercial/i);
    }
  });

  it("keeps music provenance distinct and non-duplicated", () => {
    const ids = data.music.map((entry) => entry.generationId);
    expect(new Set(ids).size).toBe(ids.length);
    const hashes = entries().map((entry) => entry.sha256);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("keeps a deterministic non-repeating playlist order with distinct labels", () => {
    const titles = data.music.map((entry) => entry.title);
    expect(titles).toContain("Pastoral Loop");
    expect(new Set(titles).size).toBe(data.music.length);
  });

  it("records the Suno policy and Kenney CC0 license receipts", () => {
    expect(data.licenses.length).toBeGreaterThanOrEqual(2);
    const suno = data.licenses.find((license) => license.id === "suno-pro-attestation");
    expect(suno?.appliesTo).toBe("music");
    expect(suno?.policyUrls).toContain("https://help.suno.com/en/articles/2416769");
    const kenney = data.licenses.find((license) => license.id === "kenney-cc0");
    expect(kenney?.appliesTo).toBe("sfx");
  });

  it("matches every shipped file's real bytes and SHA-256 over HTTP", async () => {
    server = await createServer({
      root: new URL("../../..", import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ""),
      logLevel: "silent",
    });
    await server.listen();
    const address = server.resolvedUrls?.local[0];
    if (address === undefined) throw new Error("vite dev server failed to listen");
    const base = new URL(address).origin;
    for (const entry of entries()) {
      const response = await fetch(`${base}/${entry.file}`);
      expect(response.ok, entry.file).toBe(true);
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBe(entry.bytes);
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      const hash = [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      expect(hash, entry.file).toBe(entry.sha256);
    }
  }, 30_000);

  afterAll(async () => {
    await server?.close();
  });
});
