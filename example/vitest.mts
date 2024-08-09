import { createVitest, parseCLI } from "vitest/node";
import path from "node:path";

const dirname = path.dirname(new URL(import.meta.url).pathname);

async function exec() {
  process.env.TEST = "true";
  process.env.VITEST = "true";
  process.env.NODE_ENV ??= "test";

  const vitest = await createVitest(
    // mode
    "test",
    // User Config
    {
      coverage: {
        reporter: [],
        reportOnFailure: true,
        // reporter: [path.join(dirname, "vitest.coverage.js")],
        provider: "istanbul",
        enabled: true,
        include: ["**/Header.tsx"],
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

  if (!vitest) {
    return;
  }

  await vitest.init();

  console.log("vitest started");

  // TODO: Which project to use?
  const project = vitest?.projects[0]!;
  // WAIT FOR STORYBOOK EVENT
  // Tell coverage reporter to just take current file into account
  // vitest?.configOverride.coverage?.exclude = [...]
  // @ts-expect-error IGNORE
  vitest.configOverride.coverage = {
    ...vitest?.configOverride.coverage,
  };
  const testFiles = await project.globTestFiles();
  const HeaderStory = path.join(dirname, "src", "stories", "Header.stories.ts");
  const ButtonStory = path.join(dirname, "src", "stories", "Button.stories.ts");
  await vitest.runFiles([[project, HeaderStory]], false);
  console.log("DONE");
  await vitest.runFiles([[project, ButtonStory]], false);
}

exec();
