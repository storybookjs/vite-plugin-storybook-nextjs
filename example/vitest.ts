import path from "node:path";
import prettyTime from "pretty-hrtime";
import { createVitest, parseCLI } from "vitest/node";

const dirname = path.dirname(new URL(import.meta.url).pathname);

const state: { currentFile: string | null } = {
  currentFile: null,
};

function reporter() {
  console.log("report to Storybook");
  console.log(state);
}

export async function exec(channel) {
  process.env.TEST = "true";
  process.env.VITEST = "true";
  process.env.NODE_ENV ??= "test";

  console.log("Inside of Vitest Exec", channel);

  const vitest = await createVitest(
    // mode
    "test",
    // User Config
    {
      coverage: {
        reportOnFailure: true,
        reporter: [
          [
            path.join(dirname, "vitest.coverage.js"),
            {
              foo: reporter,
            },
          ],
        ],
        provider: "istanbul",
        enabled: true,
        // include: ["**/Header.tsx"],
        // Can we declare include/exclude later programmatically?
        exclude: ["**/*.stories.ts", "**/*.stories.tsx"],
        cleanOnRerun: true,
        all: false,
      },
    },
    // Vite Overrides
    {},
    // Vitest Options
    {},
  );

  if (!vitest || vitest.projects.length < 1) {
    return;
  }

  await vitest.init();

  // WAIT FOR STORYBOOK EVENT
  const HeaderStory = path.join(dirname, "src", "stories", "Header.stories.ts");
  state.currentFile = HeaderStory;

  await vitest.runFiles(
    vitest.projects.map((project) => [project, HeaderStory]),
    false,
  );
}
