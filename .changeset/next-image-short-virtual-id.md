---
"vite-plugin-storybook-nextjs": patch
---

Fix `ENAMETOOLONG` during `storybook build` for projects with deeply nested image paths (monorepos, git worktrees, etc.). The `next-image` plugin used to embed the absolute image path as URL-safe base64 inside the virtual module ID, which made chunk filenames grow past the OS NAME_MAX limit. Virtual IDs are now short content-addressed hashes resolved through an instance-scoped lookup map, mirroring the `publicAssetUrlCache` + 8-char hash pattern in [`vitejs/vite`'s `packages/vite/src/node/plugins/asset.ts`](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/asset.ts). Also fixes the matching unit tests that were left out of sync when the IDs switched to base64, and tightens them to assert the exact path-derived hash.
