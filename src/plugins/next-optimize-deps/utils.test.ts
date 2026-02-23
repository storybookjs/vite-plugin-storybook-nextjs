import { resolveModulePath } from "exsolve";
import type { NextConfigComplete } from "next/dist/server/config-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as NextUtils from "../../utils/nextjs";
import { getBarrelMapping } from "./utils";

const resolve = async (context: string, moduleName: string) => {
  try {
    return resolveModulePath(moduleName, {
      conditions: ["import", "browser", "module", "node", "main"],
      from: context,
    });
  } catch (e) {
    return null;
  }
};

const nextConfig: NextConfigComplete = {
  // Only the fields read by our code under test are populated here.
  experimental: {
    swcPlugins: [],
  },
  modularizeImports: undefined,
  compiler: undefined,
  distDir: ".next",
  // biome-ignore lint/suspicious/noExplicitAny: we only need a partial shape for this test
} as any;

describe("getBarrelMapping", () => {
  beforeEach(async () => {
    // Clear the cache before each test by re-importing
    await NextUtils.loadSWCBindingsEagerly(nextConfig);

    vi.resetModules();
  });

  it("should return export map for lodash-es", async () => {
    const { exportList } =
      (await getBarrelMapping("lodash-es", ".cache-dir", resolve)) ?? {};
    expect(exportList).toContainEqual(["zip", "./zip.js", "default"]);
  });

  it("should return export map for ramda", async () => {
    const { exportList } =
      (await getBarrelMapping("ramda", ".cache-dir", resolve)) ?? {};
    expect(exportList).toContainEqual(["add", "./add.js", "default"]);
  });

  it("should return export map for date-fns", async () => {
    const { exportList } =
      (await getBarrelMapping("date-fns", ".cache-dir", resolve)) ?? {};

    expect(exportList).toContainEqual(["addDays", "./addDays.js", "addDays"]);
  });

  it("should return export map for antd", async () => {
    const { exportList } =
      (await getBarrelMapping("antd", ".cache-dir", resolve)) ?? {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for react-bootstrap", async () => {
    const { exportList } =
      (await getBarrelMapping("react-bootstrap", ".cache-dir", resolve)) ?? {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for ahooks", async () => {
    const { exportList } =
      (await getBarrelMapping("ahooks", ".cache-dir", resolve)) ?? {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for @ant-design/icons", async () => {
    const { exportList } =
      (await getBarrelMapping("@ant-design/icons", ".cache-dir", resolve)) ??
      {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for @headlessui/react", async () => {
    const { exportList } =
      (await getBarrelMapping("@headlessui/react", ".cache-dir", resolve)) ??
      {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for recharts", async () => {
    const { exportList } =
      (await getBarrelMapping("recharts", ".cache-dir", resolve)) ?? {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for @material-ui/core", async () => {
    const { exportList } =
      (await getBarrelMapping("@material-ui/core", ".cache-dir", resolve)) ??
      {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for react-icons", async () => {
    const { exportList } =
      (await getBarrelMapping("react-icons", ".cache-dir", resolve)) ?? {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for @effect/opentelemetry", async () => {
    const { exportList } =
      (await getBarrelMapping(
        "@effect/opentelemetry",
        ".cache-dir",
        resolve,
      )) ?? {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for @tabler/icons-react", async () => {
    const { exportList } =
      (await getBarrelMapping("@tabler/icons-react", ".cache-dir", resolve)) ??
      {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for @material-ui/icons", async () => {
    const { exportList } =
      (await getBarrelMapping("@material-ui/icons", ".cache-dir", resolve)) ??
      {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for react-use", async () => {
    const { exportList } =
      (await getBarrelMapping("react-use", ".cache-dir", resolve)) ?? {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for @tremor/react", async () => {
    const { exportList } =
      (await getBarrelMapping("@tremor/react", ".cache-dir", resolve)) ?? {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for @visx/visx", async () => {
    const { exportList } =
      (await getBarrelMapping("@visx/visx", ".cache-dir", resolve)) ?? {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for @heroicons/react/24/outline", async () => {
    const { exportList } =
      (await getBarrelMapping(
        "@heroicons/react/24/outline",
        ".cache-dir",
        resolve,
      )) ?? {};

    expect(exportList?.length).toBeGreaterThan(0);
  });

  it("should return export map for rxjs", async () => {
    const { exportList } =
      (await getBarrelMapping("rxjs", ".cache-dir", resolve)) ?? {};

    expect(exportList?.length).toBeGreaterThan(0);
  });
});
