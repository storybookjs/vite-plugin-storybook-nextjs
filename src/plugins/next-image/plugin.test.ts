import { createHash } from "node:crypto";
import path from "node:path";
import type { NextConfigComplete } from "next/dist/server/config-shared.js";
import type { PluginContext } from "rollup";
import { describe, expect, it, vi } from "vitest";

const requireResolveMock = vi.hoisted(() => vi.fn());

vi.mock("node:module", () => ({
  createRequire: () => ({
    resolve: requireResolveMock,
  }),
}));

import { vitePluginNextImage } from "./plugin";

const VIRTUAL_IMAGE_PREFIX = "\0virtual:next-image:";
// `\0virtual:next-image:` (20) + 8 hex chars = 28
const MAX_EXPECTED_ID_LENGTH = 50;

function expectedId(absolutePath: string): string {
  const hash = createHash("sha256")
    .update(absolutePath)
    .digest("hex")
    .slice(0, 8);
  return `${VIRTUAL_IMAGE_PREFIX}${hash}`;
}

describe("vitePluginNextImage resolveId", () => {
  const nextConfigResolver = {
    promise: Promise.resolve({} as NextConfigComplete),
    resolve: vi.fn(),
    reject: vi.fn(),
  } as PromiseWithResolvers<NextConfigComplete>;

  const createContext = (resolve: PluginContext["resolve"]) =>
    ({ resolve }) as PluginContext;

  it("resolves relative image imports against importer", async () => {
    const plugin = vitePluginNextImage(nextConfigResolver);
    const resolve = vi.fn();
    const importer = "/project/src/Component.tsx";

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const result = await plugin.resolveId!.call(
      createContext(resolve),
      "./images/avatar.png",
      importer,
    );

    expect(resolve).not.toHaveBeenCalled();
    expect(result).toBe(
      expectedId(path.join(path.dirname(importer), "./images/avatar.png")),
    );
  });

  it("uses Vite resolver for package image imports", async () => {
    const plugin = vitePluginNextImage(nextConfigResolver);
    const resolvedPath = "/project/packages/assets/src/images/avatar.png";
    const resolve = vi.fn().mockResolvedValue({ id: resolvedPath });
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const result = await plugin.resolveId!.call(
      createContext(resolve),
      "@myorg/assets/images/avatar.png",
      "/project/src/Component.tsx",
    );

    expect(resolve).toHaveBeenCalledWith(
      "@myorg/assets/images/avatar.png",
      "/project/src/Component.tsx",
      { skipSelf: true },
    );
    expect(result).toBe(expectedId(resolvedPath));
  });

  it("falls back to require.resolve when Vite resolution fails", async () => {
    const plugin = vitePluginNextImage(nextConfigResolver);
    const importer = "/project/src/Component.tsx?import";
    const resolvedPath = "/project/packages/assets/src/images/avatar.png";
    const resolve = vi.fn().mockResolvedValue(null);

    requireResolveMock.mockReturnValueOnce(resolvedPath);
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const result = await plugin.resolveId!.call(
      createContext(resolve),
      "@myorg/assets/images/avatar.png",
      importer,
    );

    expect(resolve).toHaveBeenCalled();
    expect(requireResolveMock).toHaveBeenCalledWith(
      "@myorg/assets/images/avatar.png",
      { paths: [path.dirname(importer.split("?")[0])] },
    );
    expect(result).toBe(expectedId(resolvedPath));
  });

  it("produces a short, stable ID even for deeply nested monorepo paths", async () => {
    const plugin = vitePluginNextImage(nextConfigResolver);
    // 250+ char absolute path that would blow up the old base64 ID
    const deepDir = `/Users/x/dev/${"nested-".repeat(30)}leaf`;
    const importer = `${deepDir}/Component.tsx`;
    const resolve = vi.fn();
    const expectedImagePath = path.join(deepDir, "./images/avatar.png");

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const result = await plugin.resolveId!.call(
      createContext(resolve),
      "./images/avatar.png",
      importer,
    );

    expect(result).toBe(expectedId(expectedImagePath));
    expect((result as string).length).toBeLessThanOrEqual(
      MAX_EXPECTED_ID_LENGTH,
    );

    // Calling again with the same path is stable.
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const second = await plugin.resolveId!.call(
      createContext(resolve),
      "./images/avatar.png",
      importer,
    );
    expect(second).toBe(result);
  });

  it("keeps the ID safe for paths with characters Vite's decodeURI would mangle", async () => {
    const plugin = vitePluginNextImage(nextConfigResolver);
    // Square brackets historically broke the query-string form.
    const importer = "/project/src/[locale]/[slug]/Component.tsx";
    const resolve = vi.fn();
    const expectedImagePath = path.join(
      path.dirname(importer),
      "./images/avatar.png",
    );

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const result = await plugin.resolveId!.call(
      createContext(resolve),
      "./images/avatar.png",
      importer,
    );

    expect(result).toBe(expectedId(expectedImagePath));
    expect(result as string).toMatch(/^\0virtual:next-image:[0-9a-f]+$/);
  });

  it("returns distinct IDs for distinct image paths", async () => {
    const plugin = vitePluginNextImage(nextConfigResolver);
    const importer = "/project/src/Component.tsx";
    const resolve = vi.fn();

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const a = await plugin.resolveId!.call(
      createContext(resolve),
      "./images/a.png",
      importer,
    );
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const b = await plugin.resolveId!.call(
      createContext(resolve),
      "./images/b.png",
      importer,
    );

    expect(a).toBe(
      expectedId(path.join(path.dirname(importer), "./images/a.png")),
    );
    expect(b).toBe(
      expectedId(path.join(path.dirname(importer), "./images/b.png")),
    );
    expect(a).not.toBe(b);
  });
});
