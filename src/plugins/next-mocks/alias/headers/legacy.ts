import { fn } from "@storybook/test";
// @ts-ignore: Exists in next.js 14 or earlier
import type { DraftMode } from "next/dist/client/components/draft-mode";
// @ts-ignore: Exists in next.js 14 or earlier
import * as originalHeaders from "next/dist/client/components/headers.js";
import type { Mock } from "vitest";

// mock utilities/overrides (as of Next v14.2.0)
export { headers } from "./headers";
export { cookies } from "./cookies";

// passthrough mocks - keep original implementation but allow for spying
const draftMode: Mock<() => DraftMode> = fn(originalHeaders.draftMode).mockName(
  "draftMode",
);
export { draftMode };
