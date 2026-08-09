import { resolve } from "node:path";
import loadJsConfig from "next/dist/build/load-jsconfig.js";
import { PHASE_PRODUCTION_BUILD } from "next/dist/shared/lib/constants.js";
import { expect, it } from "vitest";
import { loadNextConfig } from "./next-config";

it("returns a complete config after the raw config is cached", async () => {
  const exampleDir = resolve(process.cwd(), "example");

  await loadNextConfig(PHASE_PRODUCTION_BUILD, exampleDir);
  const nextConfig = await loadNextConfig(PHASE_PRODUCTION_BUILD, exampleDir);

  await expect(loadJsConfig(exampleDir, nextConfig)).resolves.toBeDefined();
});
