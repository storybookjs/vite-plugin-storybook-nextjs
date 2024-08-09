// custom-reporter.cjs
const { ReportBase } = require("istanbul-lib-report");

module.exports = class CustomReporter extends ReportBase {
  constructor(opts) {
    super();

    console.log({ opts: opts.foo });

    // Options passed from configuration are available here
    this.file = opts.file;
  }

  onStart(root, context) {
    // console.log("establish Storybook");
    // Establish a connection to the Storybook server
  }

  onDetail(node, context) {
    const fc = node.getFileCoverage();
    const key = fc.path;
  }

  onEnd() {
    // console.log("COVERAGE COLLECTED");
    // Send to Storybook
  }
};
