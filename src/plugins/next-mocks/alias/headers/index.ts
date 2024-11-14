import { fn } from "@storybook/test";
import type { UnsafeUnwrappedDraftMode } from "next/dist/server/request/draft-mode";
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
