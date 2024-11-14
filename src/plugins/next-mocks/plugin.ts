import { createRequire } from "node:module";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { VITEST_PLUGIN_NAME, getExecutionEnvironment } from "../../utils";

const require = createRequire(import.meta.url);

type Env = "browser" | "node";

const getEntryPoint = (subPath: string, env: Env) =>
  require.resolve(`${VITEST_PLUGIN_NAME}/${env}/mocks/${subPath}`);

export const getAlias = (env: Env) => {
  const nextPackageJson = require("next/package.json");

  const nextMajorVersion = Number.parseInt(
    String(nextPackageJson?.version).split(".").at(0) ?? "",
    10,
  );

  const headersMock =
    nextMajorVersion <= 14
      ? getEntryPoint("v14-headers", env)
      : getEntryPoint("headers", env);

  return {
    "next/headers": headersMock,
    "@storybook/nextjs/headers.mock": headersMock,
    "@storybook/nextjs-vite/headers.mock": headersMock,
    "@storybook/experimental-nextjs-vite/headers.mock": headersMock,
    "next/navigation": getEntryPoint("navigation", env),
    "@storybook/nextjs/navigation.mock": getEntryPoint("navigation", env),
    "@storybook/nextjs-vite/navigation.mock": getEntryPoint("navigation", env),
    "@storybook/experimental-nextjs-vite/navigation.mock": getEntryPoint(
      "navigation",
      env,
    ),
    "next/router": getEntryPoint("router", env),
    "@storybook/nextjs/router.mock": getEntryPoint("router", env),
    "@storybook/nextjs-vite/router.mock": getEntryPoint("router", env),
    "@storybook/experimental-nextjs-vite/router.mock": getEntryPoint(
      "router",
      env,
    ),
    "next/cache": getEntryPoint("cache", env),
    "@storybook/nextjs/cache.mock": getEntryPoint("cache", env),
    "@storybook/nextjs-vite/cache.mock": getEntryPoint("cache", env),
    "@storybook/experimental-nextjs-vite/cache.mock": getEntryPoint(
      "cache",
      env,
    ),
    "server-only": getEntryPoint("server-only", env),
    "@opentelemetry/api": require.resolve(
      "next/dist/compiled/@opentelemetry/api",
    ),
    "next/dynamic": getEntryPoint("dynamic", env),
  };
};

export const vitePluginNextMocks = () =>
  ({
    name: "vite-plugin-next-mocks",
    config: (config) => {
      const aliasEnv = getExecutionEnvironment(config);
      return {
        resolve: {
          alias: getAlias(aliasEnv),
        },
      };
    },
  }) satisfies Plugin;
