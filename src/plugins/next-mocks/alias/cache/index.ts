import { fn } from "storybook/test";
import type { Mock } from "vitest";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Callback = (...args: any[]) => Promise<any>;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Procedure = (...args: any[]) => any;

// mock utilities/overrides (as of Next v14.2.0)
const revalidatePath: Mock<Procedure> = fn().mockName(
  "next/cache::revalidatePath",
);
const revalidateTag: Mock<Procedure> = fn().mockName(
  "next/cache::revalidateTag",
);
const updateTag: Mock<Procedure> = fn().mockName("next/cache::updateTag");
const unstable_cache: Mock<Procedure> = fn()
  .mockName("next/cache::unstable_cache")
  .mockImplementation((cb: Callback) => cb);
const unstable_noStore: Mock<Procedure> = fn().mockName(
  "next/cache::unstable_noStore",
);
const refresh: Mock<Procedure> = fn().mockName("next/cache::refresh");

const cacheExports = {
  unstable_cache,
  revalidateTag,
  revalidatePath,
  updateTag,
  refresh,
  unstable_noStore,
};

export default cacheExports;
export {
  unstable_cache,
  revalidateTag,
  revalidatePath,
  unstable_noStore,
  refresh,
  updateTag,
};
