import { fn } from "@storybook/test";
// @ts-ignore Exists in next.js 15 later
import type { UnsafeUnwrappedDraftMode } from "next/dist/server/request/draft-mode";
// @ts-ignore Exists in next.js 15 later
import * as originalHeaders from "next/dist/server/request/draft-mode";
import type { Mock } from "vitest";

// mock utilities/overrides (as of Next v15.0.3)
export { headers } from "./headers";
export { cookies } from "./cookies";

type DraftMode = Promise<UnsafeUnwrappedDraftMode>;

// passthrough mocks - keep original implementation but allow for spying
const draftMode: Mock<() => DraftMode> = fn(originalHeaders.draftMode).mockName(
  "draftMode",
);
export { draftMode };
