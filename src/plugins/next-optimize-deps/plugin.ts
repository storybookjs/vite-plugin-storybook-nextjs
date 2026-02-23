import fs from "node:fs";
import type { NextConfigComplete } from "next/dist/server/config-shared";
import type { Plugin } from "vite";

type ModularizeImportsConfig = Record<
  string,
  {
    transform?: string | Record<string, string>;
    preventFullImport?: boolean;
    skipDefaultConversion?: boolean;
  }
>;

export function vitePluginNextOptimizeDeps(
  nextConfigResolver: PromiseWithResolvers<NextConfigComplete>,
): Plugin {
  let packagesToOptimize: string[] = [];
  let modularizeImportsConfig: ModularizeImportsConfig = {};

  return {
    name: "vite-plugin-storybook-nextjs-optimize-deps",
    enforce: "pre" as const,
    async config(config) {
      const nextConfig = await nextConfigResolver.promise;
      packagesToOptimize =
        nextConfig.experimental?.optimizePackageImports ?? [];
      modularizeImportsConfig = nextConfig.modularizeImports ?? {};

      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [
              {
                name: "transform-optimized-package-imports",
                setup(build) {
                  build.onLoad(
                    { filter: /\.(ts|tsx|js|jsx)$/ },
                    async (args) => {
                      // Skip node_modules to avoid transforming the packages themselves
                      if (args.path.includes("node_modules")) return null;

                      const contents = await fs.promises.readFile(
                        args.path,
                        "utf8",
                      );

                      let transformed = transformOptimizedPackageImports(
                        contents,
                        packagesToOptimize,
                      );

                      transformed = transformModularizeImports(
                        transformed,
                        modularizeImportsConfig,
                      );

                      if (transformed !== contents) {
                        return {
                          contents: transformed,
                          loader: "default",
                        };
                      }
                    },
                  );
                },
              },
            ],
          },
        },
      };
    },
  };
}

/**
 * Transforms imports based on modularizeImports configuration.
 * Converts named imports using custom transform patterns:
 * - `import { Button } from '@acme/ui'` → `import Button from '@acme/ui/dist/Button'`
 * (when transform pattern is '@acme/ui/dist/{{member}}')`
 */
export function transformModularizeImports(
  contents: string,
  modularizeImportsConfig: ModularizeImportsConfig,
): string {
  let transformed = contents;

  // For each package with modularizeImports config
  for (const [packageName, config] of Object.entries(modularizeImportsConfig)) {
    // Skip if transform is not defined or is an object (not simple string)
    if (!config.transform || typeof config.transform !== "string") {
      continue;
    }

    const transformPattern = config.transform;

    // Escape special regex characters in package name
    const escapedPackageName = packageName.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    // Transform: import { x, y, z } from 'package-name'
    // Using the transform pattern from config
    const regex = new RegExp(
      `import\\s*{\\s*([^}]+)\\s*}\\s*from\\s*['"]${escapedPackageName}['"]`,
      "g",
    );

    transformed = transformed.replace(
      regex,
      (match: string, imports: string) => {
        const specifiers = imports
          .split(",")
          .map((spec: string) => spec.trim())
          .filter(Boolean);

        return specifiers
          .map((spec: string) => {
            // Handle: import { foo as bar } from 'package-name'
            const [name] = spec.split(/\s+as\s+/);
            const transformedPath = transformPattern.replace(
              /{{member}}/g,
              name.trim(),
            );
            return `import ${spec} from '${transformedPath}'`;
          })
          .join(";\n");
      },
    );
  }

  return transformed;
}

/**
 * Transforms imports for packages listed in optimizePackageImports.
 * Converts named imports to individual file imports:
 * - `import { x, y } from 'package'` → `import x from 'package/x'; import y from 'package/y'`
 */
export function transformOptimizedPackageImports(
  contents: string,
  packageNames: string[],
): string {
  let transformed = contents;

  // For each package to optimize, transform its imports
  for (const packageName of packageNames) {
    // Escape special regex characters in package name
    const escapedPackageName = packageName.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    // Transform: import { x, y, z } from 'package-name'
    // Into: import x from 'package-name/x'; import y from 'package-name/y'; import z from 'package-name/z';
    const regex = new RegExp(
      `import\\s*{\\s*([^}]+)\\s*}\\s*from\\s*['"]${escapedPackageName}['"]`,
      "g",
    );

    transformed = transformed.replace(
      regex,
      (match: string, imports: string) => {
        const specifiers = imports
          .split(",")
          .map((spec: string) => spec.trim())
          .filter(Boolean);

        return specifiers
          .map((spec: string) => {
            // Handle: import { foo as bar } from 'package-name'
            const [name] = spec.split(/\s+as\s+/);
            return `import ${spec} from '${packageName}/${name.trim()}'`;
          })
          .join(";\n");
      },
    );
  }

  return transformed;
}
