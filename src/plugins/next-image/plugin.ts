import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import { type FilterPattern, createFilter } from "@rollup/pluginutils";
import { imageSize } from "image-size";
import type { NextConfigComplete } from "next/dist/server/config-shared.js";
import path from "pathe";
import { dedent } from "ts-dedent";
import type { Plugin } from "vite";
import { VITEST_PLUGIN_NAME, isVitestEnv } from "../../utils";
import { getAlias } from "./alias";

const warnedMessages = new Set<string>();
const warnOnce = (message: string) => {
  if (!warnedMessages.has(message)) {
    console.warn(`[vite-plugin-storybook-nextjs] ${message}`);
    warnedMessages.add(message);
  }
};

const includePattern = /\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/;
const excludeImporterPattern = /\.(css|scss|sass)$/;

// Null byte prefix marks the IDs as internal virtual modules (Rollup convention).
// The trailing token is a short content-addressed hash of the absolute image path,
// not the path itself, so that:
//   * special characters in paths (square brackets, spaces, unicode) cannot leak
//     into the ID and break Vite's decodeURI handling, and
//   * deeply nested paths in monorepos / git worktrees do not blow up the chunk
//     filename past the OS NAME_MAX (255) limit, which previously surfaced as
//     ENAMETOOLONG during `storybook build`.
// Mirrors the `publicAssetUrlCache` + 8-char hash pattern used in
// vitejs/vite's `packages/vite/src/node/plugins/asset.ts`
// (`__VITE_PUBLIC_ASSET__([a-z\d]{8})__`).
const virtualImagePrefix = "\0virtual:next-image:";
const virtualNextImage = "virtual:next/image";
const virtualNextLegacyImage = "virtual:next/legacy/image";

const SHORT_HASH_LEN = 8;

const require = createRequire(import.meta.url);

export type NextImagePluginOptions = {
  includeFiles?: FilterPattern;
  excludeFiles?: FilterPattern;
};

export function vitePluginNextImage(
  nextConfigResolver: PromiseWithResolvers<NextConfigComplete>,
  options: NextImagePluginOptions = {},
) {
  let isBrowser = !isVitestEnv;
  let hasVitePluginSvgr = false;
  const postfixRE = /[?#].*$/s;
  const filter = createFilter(
    [
      "**/*.{png,jpg,jpeg,gif,webp,avif,ico,bmp,svg}",
      "**/*.{png,jpg,jpeg,gif,webp,avif,ico,bmp,svg}?*",
      "**/*.{png,jpg,jpeg,gif,webp,avif,ico,bmp,svg}#*",
    ],
    options.excludeFiles,
  );

  // Plugin-instance-scoped lookup: short hash -> absolute image path.
  // Lifetime is tied to a single Vite build, matching how Vite's
  // `publicAssetUrlCache` is scoped per resolved config.
  const imagePathByHash = new Map<string, string>();

  function registerImagePath(imagePath: string): string {
    const full = createHash("sha256").update(imagePath).digest("hex");
    const short = full.slice(0, SHORT_HASH_LEN);
    const existing = imagePathByHash.get(short);
    if (existing === imagePath) {
      return short;
    }
    if (existing === undefined) {
      imagePathByHash.set(short, imagePath);
      return short;
    }
    // 32-bit prefix collisions are unlikely in practice (~65k distinct image
    // paths for a 50% chance); fall back to the full digest if we hit one.
    imagePathByHash.set(full, imagePath);
    return full;
  }

  return {
    name: "vite-plugin-storybook-nextjs-image",
    enforce: "pre" as const,
    async configResolved(config) {
      // Auto-detect SVGR plugin
      hasVitePluginSvgr = !!config.plugins?.some(
        (plugin) =>
          plugin &&
          typeof plugin === "object" &&
          "name" in plugin &&
          (plugin.name === "vite-plugin-svgr" || plugin.name.includes("svgr")),
      );
    },
    async config(config, env) {
      if (config.test?.browser?.enabled === true) {
        isBrowser = true;
      }

      return {
        resolve: {
          alias: getAlias(isBrowser ? "browser" : "node"),
        },
      };
    },
    async resolveId(id, importer) {
      const [source, queryA] = id.split("?");

      if (queryA === "ignore") {
        return null;
      }

      // For SVG files, only process if they don't have ?react parameter and SVG processing is enabled
      const isSvg = /\.svg$/.test(source);
      if (isSvg && hasVitePluginSvgr && queryA === "react") {
        return null;
      }

      if (
        isSvg &&
        hasVitePluginSvgr &&
        !options.includeFiles &&
        !options.excludeFiles &&
        queryA !== undefined
      ) {
        // If we hit this, it means the user has custom svgr config which we can't do much about
        // So we warn that they should pass include/exclude patterns themselves as framework options.
        warnOnce(
          dedent`Detected vite-plugin-svgr but you are not passing image include or exclude patterns to the nextjs-vite plugin. This may cause a conflict between the two plugins and issues with SVG files.
          
          For more info and recommended configuration, see: https://github.com/storybookjs/vite-plugin-storybook-nextjs/blob/main/README.md#faq-includingexcluding-images`,
        );
      }

      if (
        includePattern.test(source) &&
        !excludeImporterPattern.test(importer ?? "") &&
        !importer?.startsWith(virtualImagePrefix)
      ) {
        const isAbsolute = path.isAbsolute(source);
        const importerPath = importer?.split("?")[0];
        let imagePath = source;

        if (importerPath && !isAbsolute) {
          if (source.startsWith(".")) {
            imagePath = path.join(path.dirname(importerPath), source);
          } else {
            const resolvedByVite = await this.resolve(source, importer, {
              skipSelf: true,
            });

            if (resolvedByVite?.id) {
              imagePath = resolvedByVite.id.split("?")[0];
            } else {
              try {
                imagePath = require.resolve(source, {
                  paths: [path.dirname(importerPath)],
                });
              } catch {
                imagePath = source;
              }
            }
          }
        }

        const pathForFilter = imagePath.replace(postfixRE, "");

        if (!filter(pathForFilter)) {
          return null;
        }

        return `${virtualImagePrefix}${registerImagePath(imagePath)}`;
      }

      if (id === "next/image" && importer !== virtualNextImage) {
        return virtualNextImage;
      }

      if (id === "next/legacy/image" && importer !== virtualNextLegacyImage) {
        return virtualNextLegacyImage;
      }

      return null;
    },

    async load(id) {
      const aliasEnv = isBrowser ? "browser" : "node";
      if (virtualNextImage === id) {
        return (
          await fs.promises.readFile(
            require.resolve(`${VITEST_PLUGIN_NAME}/${aliasEnv}/mocks/image`),
          )
        ).toString("utf-8");
      }

      if (virtualNextLegacyImage === id) {
        return (
          await fs.promises.readFile(
            require.resolve(
              `${VITEST_PLUGIN_NAME}/${aliasEnv}/mocks/legacy-image`,
            ),
          )
        ).toString("utf-8");
      }

      // Handle virtual image modules with null byte prefix
      if (id.startsWith(virtualImagePrefix)) {
        const hash = id.slice(virtualImagePrefix.length);
        const imagePath = imagePathByHash.get(hash);
        if (imagePath === undefined) {
          // Unknown hash — defensive fallback for IDs we did not register.
          return null;
        }

        const nextConfig = await nextConfigResolver.promise;

        try {
          if (nextConfig.images?.disableStaticImages) {
            return dedent`
						import image from "${imagePath}?ignore";
						export default image;
					`;
          }

          const imageData = await fs.promises.readFile(imagePath);

          const { width, height } = imageSize(imageData);

          return dedent`
						import src from "${imagePath}?ignore";
						export default {
							src,
							height: ${height},
							width: ${width},
							blurDataURL: src
						};
					`;
        } catch (err) {
          console.error(`Could not read image file ${imagePath}:`, err);
          return undefined;
        }
      }

      return null;
    },
  } satisfies Plugin;
}
