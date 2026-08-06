---
"vite-plugin-storybook-nextjs": patch
---

Replace archived `image-size` dependency with `probe-image-size`

`image-size`'s upstream repo is archived with two unpatched high-severity infinite-loop advisories against `image-size@2.0.2`, the latest published version. `probe-image-size`'s sync Buffer API is a drop-in for the single dimension-reading call site, covers the same formats (including AVIF), is pure JS, and returns `null` instead of hanging on the malformed inputs from the public PoCs.
