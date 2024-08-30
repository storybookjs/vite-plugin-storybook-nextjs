Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.exec = exec;
var _node = require("vitest/node");
var _nodePath = _interopRequireDefault(require("node:path"));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const dirname = _nodePath.default.dirname(new URL(import.meta.url).pathname);
const state = {
  currentFile: null,
};
function reporter() {
  console.log("report to Storybook");
  console.log(state);
}
async function exec(channel) {
  var _process$env, _process$env$NODE_ENV;
  process.env.TEST = "true";
  process.env.VITEST = "true";
  (_process$env$NODE_ENV = (_process$env = process.env).NODE_ENV) !== null &&
  _process$env$NODE_ENV !== void 0
    ? _process$env$NODE_ENV
    : (_process$env.NODE_ENV = "test");
  console.log("Inside of Vitest Exec", channel);
  const vitest = await (0, _node.createVitest)(
    // mode
    "test",
    // User Config
    {
      coverage: {
        reportOnFailure: true,
        reporter: [
          [
            _nodePath.default.join(dirname, "vitest.coverage.js"),
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
  const HeaderStory = _nodePath.default.join(
    dirname,
    "src",
    "stories",
    "Header.stories.ts",
  );
  state.currentFile = HeaderStory;
  await vitest.runFiles(
    vitest.projects.map((project) => [project, HeaderStory]),
    false,
  );
}
