// custom-reporter.cjs
const { ReportBase } = require("istanbul-lib-report");

module.exports = class CustomReporter extends ReportBase {
  constructor(opts) {
    super();

    // Options passed from configuration are available here
    this.file = opts.file;
  }

  onStart(root, context) {
    // console.log("establish Storybook");
    // Establish a connection to the Storybook server
  }

  onDetail(node) {
    const fc = node.getFileCoverage();
    const key = fc.path;
    // console.log({ fc, key });
    // Collect coverage data
  }

  onEnd() {
    // console.log("COVERAGE COLLECTED");
    // Send to Storybook
  }
};
