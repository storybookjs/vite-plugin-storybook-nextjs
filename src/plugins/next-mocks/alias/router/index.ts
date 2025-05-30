import type { NextComponentType, NextPageContext } from "next";
import singletonRouter, * as originalRouter from "next/dist/client/router.js";
import type {
  ExcludeRouterProps,
  WithRouterProps,
} from "next/dist/client/with-router";
import type { NextRouter, SingletonRouter } from "next/router.js";
import type { ComponentType } from "react";
import { NextjsRouterMocksNotAvailable } from "storybook/internal/preview-errors";
import type { Mock } from "storybook/test";
import { fn } from "storybook/test";

const defaultRouterState = {
  route: "/",
  asPath: "/",
  basePath: "/",
  pathname: "/",
  query: {},
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
};

let routerAPI: {
  push: Mock;
  replace: Mock;
  reload: Mock;
  back: Mock;
  forward: Mock;
  prefetch: Mock;
  beforePopState: Mock;
  events: {
    on: Mock;
    off: Mock;
    emit: Mock;
  };
} & typeof defaultRouterState;

/**
 * Creates a next/router router API mock. Used internally.
 * @ignore
 * @internal
 * */
export const createRouter = (overrides: Partial<NextRouter>) => {
  const routerActions: Partial<NextRouter> = {
    push: fn((..._args: unknown[]) => {
      return Promise.resolve(true);
    }).mockName("next/router::useRouter().push"),
    replace: fn((..._args: unknown[]) => {
      return Promise.resolve(true);
    }).mockName("next/router::useRouter().replace"),
    reload: fn((..._args: unknown[]) => {}).mockName(
      "next/router::useRouter().reload",
    ),
    back: fn((..._args: unknown[]) => {}).mockName(
      "next/router::useRouter().back",
    ),
    forward: fn(() => {}).mockName("next/router::useRouter().forward"),
    prefetch: fn((..._args: unknown[]) => {
      return Promise.resolve();
    }).mockName("next/router::useRouter().prefetch"),
    beforePopState: fn((..._args: unknown[]) => {}).mockName(
      "next/router::useRouter().beforePopState",
    ),
  };

  const routerEvents: NextRouter["events"] = {
    on: fn((..._args: unknown[]) => {}).mockName(
      "next/router::useRouter().events.on",
    ),
    off: fn((..._args: unknown[]) => {}).mockName(
      "next/router::useRouter().events.off",
    ),
    emit: fn((..._args: unknown[]) => {}).mockName(
      "next/router::useRouter().events.emit",
    ),
  };

  if (overrides) {
    for (const key of Object.keys(routerActions)) {
      if (key in overrides) {
        // biome-ignore lint/suspicious/noExplicitAny: simply casting to any for convenience
        (routerActions as any)[key] = fn((...args: unknown[]) => {
          // biome-ignore lint/suspicious/noExplicitAny: simply casting to any for convenience
          return (overrides as any)[key](...args);
        }).mockName(`useRouter().${key}`);
      }
    }
  }

  if (overrides?.events) {
    for (const key of Object.keys(routerEvents)) {
      if (key in routerEvents) {
        // biome-ignore lint/suspicious/noExplicitAny: simply casting to any for convenience
        (routerEvents as any)[key] = fn((...args: unknown[]) => {
          // biome-ignore lint/suspicious/noExplicitAny: simply casting to any for convenience
          return (overrides.events as any)[key](...args);
        }).mockName(`useRouter().events.${key}`);
      }
    }
  }

  routerAPI = {
    ...defaultRouterState,
    ...overrides,
    ...routerActions,
    // @ts-expect-error TODO improve typings
    events: routerEvents,
  };

  // overwrite the singleton router from next/router
  // biome-ignore lint/suspicious/noExplicitAny: simply casting to any for convenience
  (singletonRouter as unknown as SingletonRouter).router = routerAPI as any;

  for (const cb of (singletonRouter as unknown as SingletonRouter)
    .readyCallbacks) {
    cb();
  }

  (singletonRouter as unknown as SingletonRouter).readyCallbacks = [];

  return routerAPI as unknown as NextRouter;
};

export const getRouter = () => {
  if (!routerAPI) {
    throw new NextjsRouterMocksNotAvailable({
      importType: "next/router",
    });
  }

  return routerAPI;
};

// re-exports of the actual module
export * from "next/dist/client/router";
export default singletonRouter;

// mock utilities/overrides (as of Next v14.2.0)
// passthrough mocks - keep original implementation but allow for spying
export const useRouter: Mock<() => NextRouter> = fn(
  originalRouter.useRouter,
).mockName("next/router::useRouter");
export const withRouter: Mock<
  (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    ComposedComponent: NextComponentType<NextPageContext, any, WithRouterProps>,
  ) => ComponentType<ExcludeRouterProps<WithRouterProps>>
> = fn(originalRouter.withRouter).mockName("next/router::withRouter");
