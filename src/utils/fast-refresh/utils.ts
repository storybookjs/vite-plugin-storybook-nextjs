// MIT License

// Copyright (c) 2019-present, Yuxi (Evan) You and Vite contributors
// https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/src/fast-refresh.ts

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export const runtimePublicPath = "/@react-refresh";

const _require = createRequire(import.meta.url);
const reactRefreshDir = path.dirname(
	_require.resolve("react-refresh/package.json"),
);
const runtimeFilePath = path.join(
	reactRefreshDir,
	"cjs/react-refresh-runtime.development.js",
);

export const runtimeCode = `
const exports = {}
${fs.readFileSync(runtimeFilePath, "utf-8")}
${fs.readFileSync(_require.resolve("../runtime/refresh-runtime-utils.js"), "utf-8")}
export default exports
`;

export const preambleCode = `
import RefreshRuntime from "__BASE__${runtimePublicPath.slice(1)}"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
`;

const sharedHeader = `
import RefreshRuntime from "${runtimePublicPath}";

const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
`.replace(/\n+/g, "");
const functionHeader = `
let prevRefreshReg;
let prevRefreshSig;

if (import.meta.hot && !inWebWorker) {
  if (!window.__vite_plugin_react_preamble_installed__) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong. " +
      "See https://github.com/vitejs/vite-plugin-react/pull/11#discussion_r430879201"
    );
  }

  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    RefreshRuntime.register(type, __SOURCE__ + " " + id)
  };
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}`.replace(/\n+/g, "");

const functionFooter = `
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}`;
const sharedFooter = `
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh(__SOURCE__, currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate(currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}`;

export function addRefreshWrapper(code: string, id: string): string {
	return (
		sharedHeader +
		functionHeader.replace("__SOURCE__", JSON.stringify(id)) +
		code +
		functionFooter +
		sharedFooter.replace("__SOURCE__", JSON.stringify(id))
	);
}

export function addClassComponentRefreshWrapper(
	code: string,
	id: string,
): string {
	return (
		sharedHeader + code + sharedFooter.replace("__SOURCE__", JSON.stringify(id))
	);
}
