import fs from "node:fs";
import { transform } from "next/dist/build/swc/index.js";
import { dirname } from "pathe";

// This is a in-memory cache for the mapping of barrel exports. This only applies
// to the packages that we optimize. It will never change (e.g. upgrading packages)
// during the lifetime of the server so we can safely cache it.
// There is also no need to collect the cache for the same reason.
const barrelTransformMappingCache = new Map<
  string,
  {
    exportList: [string, string, string][];
    wildcardExports: string[];
    isClientEntry: boolean;
  } | null
>();

export async function getBarrelMapping(
  moduleName: string,
  swcCacheDir: string,
  resolve: (context: string, moduleName: string) => Promise<string | null>,
) {
  if (barrelTransformMappingCache.has(moduleName)) {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    return barrelTransformMappingCache.get(moduleName)!;
  }

  // This is a SWC transform specifically for `optimizeBarrelExports`. We don't
  // care about other things but the export map only.
  async function transpileSource(
    filename: string,
    source: string,
    isWildcard: boolean,
  ) {
    const isTypeScript = filename.endsWith(".ts") || filename.endsWith(".tsx");

    return new Promise<string>((res) =>
      transform(source, {
        filename,
        inputSourceMap: undefined,
        sourceFileName: filename,
        optimizeBarrelExports: {
          wildcard: isWildcard,
        },
        jsc: {
          parser: {
            syntax: isTypeScript ? "typescript" : "ecmascript",
            [isTypeScript ? "tsx" : "jsx"]: true,
          },
          experimental: {
            cacheRoot: swcCacheDir,
          },
        },
      }).then((output) => {
        res(output.code);
      }),
    );
  }

  // Avoid circular `export *` dependencies
  const visited = new Set<string>();
  const resolvedModulePath = await resolve(process.cwd(), moduleName);

  async function getMatches(
    file: string | null,
    isWildcard: boolean,
    isClientEntry: boolean,
  ) {
    if (!file || visited.has(file)) {
      return null;
    }
    visited.add(file);

    const source = await new Promise<string>((res, rej) => {
      fs.readFile(file, (err, data) => {
        if (err || data === undefined) {
          rej(err);
        } else {
          res(data.toString());
        }
      });
    });

    const output = await transpileSource(file, source, isWildcard);

    const matches = output.match(
      // biome-ignore lint/correctness/noEmptyCharacterClassInRegex: <explanation>
      /^([^]*)export (const|var) __next_private_export_map__ = ('[^']+'|"[^"]+")/,
    );

    if (!matches || !resolvedModulePath) {
      return null;
    }

    const matchedDirectives = output.match(
      // biome-ignore lint/correctness/noEmptyCharacterClassInRegex: <explanation>
      /^([^]*)export (const|var) __next_private_directive_list__ = '([^']+)'/,
    );
    const directiveList = matchedDirectives
      ? JSON.parse(matchedDirectives[3])
      : [];
    // "use client" in barrel files has to be transferred to the target file.
    const resolvedIsClientEntry =
      isClientEntry || directiveList.includes("use client");

    let exportList = JSON.parse(matches[3].slice(1, -1)) as [
      string,
      string,
      string,
    ][];
    const wildcardExports = [
      ...output.matchAll(/export \* from "([^"]+)"/g),
    ].map((match) => match[1]);

    // In the wildcard case, if the value is exported from another file, we
    // redirect to that file (decl[0]). Otherwise, export from the current
    // file itself.
    if (isWildcard) {
      for (const decl of exportList) {
        decl[1] = file;
        decl[2] = decl[0];
      }
    }

    // This recursively handles the wildcard exports (e.g. `export * from './a'`)
    if (wildcardExports.length) {
      await Promise.all(
        wildcardExports.map(async (req) => {
          const reqPath = req.replace(
            "__barrel_optimize__?names=__PLACEHOLDER__!=!",
            "",
          );
          const targetPath = await resolve(
            dirname(resolvedModulePath),
            reqPath,
          );

          const targetMatches = await getMatches(
            targetPath,
            true,
            resolvedIsClientEntry,
          );

          if (targetMatches) {
            // Merge the export list
            exportList = exportList
              .concat(targetMatches.exportList)
              .map((decl) =>
                decl.map((part) => {
                  return part.replace(dirname(resolvedModulePath), ".");
                }),
              ) as [string, string, string][];
          }
        }),
      );
    }

    return {
      exportList,
      wildcardExports,
      isClientEntry: resolvedIsClientEntry,
    };
  }

  const res = await getMatches(resolvedModulePath, false, false);
  barrelTransformMappingCache.set(moduleName, res);

  return res;
}
