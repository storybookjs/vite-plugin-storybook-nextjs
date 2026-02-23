import { describe, expect, it } from "vitest";
import {
  transformModularizeImports,
  transformOptimizedPackageImports,
} from "./plugin";

describe("transformModularizeImports", () => {
  it("transforms imports with custom transform pattern", () => {
    const input = "import { Button } from '@acme/ui'";
    const config = {
      "@acme/ui": {
        transform: "@acme/ui/dist/{{member}}",
      },
    };
    const result = transformModularizeImports(input, config);
    expect(result).toMatchInlineSnapshot(
      `"import Button from '@acme/ui/dist/Button'"`,
    );
  });

  it("transforms multiple imports with custom transform pattern", () => {
    const input = "import { Button, Slider, Dropdown } from '@acme/ui'";
    const config = {
      "@acme/ui": {
        transform: "@acme/ui/dist/{{member}}",
      },
    };
    const result = transformModularizeImports(input, config);
    expect(result).toMatchInlineSnapshot(`
      "import Button from '@acme/ui/dist/Button';
      import Slider from '@acme/ui/dist/Slider';
      import Dropdown from '@acme/ui/dist/Dropdown'"
    `);
  });

  it("transforms imports with aliases using custom transform pattern", () => {
    const input = "import { Button as Btn } from '@acme/ui'";
    const config = {
      "@acme/ui": {
        transform: "@acme/ui/dist/{{member}}",
      },
    };
    const result = transformModularizeImports(input, config);
    expect(result).toMatchInlineSnapshot(
      `"import Button as Btn from '@acme/ui/dist/Button'"`,
    );
  });

  it("handles multiple packages with different transform patterns", () => {
    const input = `import { Button } from '@acme/ui'
import { query } from 'react-query'`;
    const config = {
      "@acme/ui": {
        transform: "@acme/ui/dist/{{member}}",
      },
      "react-query": {
        transform: "react-query/lib/{{member}}",
      },
    };
    const result = transformModularizeImports(input, config);
    expect(result).toMatchInlineSnapshot(`
      "import Button from '@acme/ui/dist/Button'
      import query from 'react-query/lib/query'"
    `);
  });

  it("handles package names with special characters", () => {
    const input = "import { something } from '@react/core'";
    const config = {
      "@react/core": {
        transform: "@react/core/build/{{member}}",
      },
    };
    const result = transformModularizeImports(input, config);
    expect(result).toMatchInlineSnapshot(
      `"import something from '@react/core/build/something'"`,
    );
  });

  it("preserves non-matching imports", () => {
    const input = `import React from 'react'
import { Button } from '@acme/ui'`;
    const config = {
      "@acme/ui": {
        transform: "@acme/ui/dist/{{member}}",
      },
    };
    const result = transformModularizeImports(input, config);
    expect(result).toMatchInlineSnapshot(`
      "import React from 'react'
      import Button from '@acme/ui/dist/Button'"
    `);
  });

  it("handles double quotes in imports", () => {
    const input = 'import { Button } from "@acme/ui"';
    const config = {
      "@acme/ui": {
        transform: "@acme/ui/dist/{{member}}",
      },
    };
    const result = transformModularizeImports(input, config);
    expect(result).toMatchInlineSnapshot(
      `"import Button from '@acme/ui/dist/Button'"`,
    );
  });

  it("returns unchanged content when no packages match", () => {
    const input = "import { Button } from '@other/ui'";
    const config = {
      "@acme/ui": {
        transform: "@acme/ui/dist/{{member}}",
      },
    };
    const result = transformModularizeImports(input, config);
    expect(result).toMatchInlineSnapshot(
      `"import { Button } from '@other/ui'"`,
    );
  });

  it("handles transform pattern with multiple placeholders", () => {
    const input = "import { Button } from 'mylib'";
    const config = {
      mylib: {
        transform: "mylib/esm/components/{{member}}/{{member}}",
      },
    };
    const result = transformModularizeImports(input, config);
    expect(result).toMatchInlineSnapshot(
      `"import Button from 'mylib/esm/components/Button/Button'"`,
    );
  });

  it("handles empty config", () => {
    const input = "import { Button } from '@acme/ui'";
    const result = transformModularizeImports(input, {});
    expect(result).toMatchInlineSnapshot(`"import { Button } from '@acme/ui'"`);
  });
});

describe("transformOptimizedPackageImports", () => {
  it("transforms basic named imports from a single package", () => {
    const input = "import { map, filter } from 'lodash'";
    const result = transformOptimizedPackageImports(input, ["lodash"]);
    expect(result).toMatchInlineSnapshot(`
      "import map from 'lodash/map';
      import filter from 'lodash/filter'"
    `);
  });

  it("transforms named imports with aliases", () => {
    const input = "import { map as mapFn, filter as filterFn } from 'lodash'";
    const result = transformOptimizedPackageImports(input, ["lodash"]);
    expect(result).toMatchInlineSnapshot(`
      "import map as mapFn from 'lodash/map';
      import filter as filterFn from 'lodash/filter'"
    `);
  });

  it("transforms imports with double quotes", () => {
    const input = 'import { map, filter } from "lodash"';
    const result = transformOptimizedPackageImports(input, ["lodash"]);
    expect(result).toMatchInlineSnapshot(`
      "import map from 'lodash/map';
      import filter from 'lodash/filter'"
    `);
  });

  it("handles multiple packages", () => {
    const input = `import { map } from 'lodash'
import { debounce } from 'lodash-es'`;
    const result = transformOptimizedPackageImports(input, [
      "lodash",
      "lodash-es",
    ]);
    expect(result).toMatchInlineSnapshot(`
      "import map from 'lodash/map'
      import debounce from 'lodash-es/debounce'"
    `);
  });

  it("preserves non-matching imports", () => {
    const input = `import React from 'react'
import { map } from 'lodash'
import { useState } from 'react'`;
    const result = transformOptimizedPackageImports(input, ["lodash"]);
    expect(result).toMatchInlineSnapshot(`
      "import React from 'react'
      import map from 'lodash/map'
      import { useState } from 'react'"
    `);
  });

  it("handles package names with special regex characters", () => {
    const input = "import { something } from '@react/core'";
    const result = transformOptimizedPackageImports(input, ["@react/core"]);
    expect(result).toMatchInlineSnapshot(
      `"import something from '@react/core/something'"`,
    );
  });

  it("handles package names with dots", () => {
    const input = "import { query } from 'react-query'";
    const result = transformOptimizedPackageImports(input, ["react-query"]);
    expect(result).toMatchInlineSnapshot(
      `"import query from 'react-query/query'"`,
    );
  });

  it("handles multiple imports with whitespace variations", () => {
    const input = "import {  map  ,  filter  ,  reduce  } from 'lodash'";
    const result = transformOptimizedPackageImports(input, ["lodash"]);
    expect(result).toMatchInlineSnapshot(`
      "import map from 'lodash/map';
      import filter from 'lodash/filter';
      import reduce from 'lodash/reduce'"
    `);
  });

  it("handles single import", () => {
    const input = "import { map } from 'lodash'";
    const result = transformOptimizedPackageImports(input, ["lodash"]);
    expect(result).toMatchInlineSnapshot(`"import map from 'lodash/map'"`);
  });

  it("returns unchanged content when no packages match", () => {
    const input = "import { map } from 'lodash'";
    const result = transformOptimizedPackageImports(input, ["other-package"]);
    expect(result).toMatchInlineSnapshot(`"import { map } from 'lodash'"`);
  });

  it("returns unchanged content when there are no imports", () => {
    const input = "const x = 5;";
    const result = transformOptimizedPackageImports(input, ["lodash"]);
    expect(result).toMatchInlineSnapshot(`"const x = 5;"`);
  });

  it("handles mixed imports and aliases in same package", () => {
    const input = "import { map, filter as f, reduce } from 'lodash'";
    const result = transformOptimizedPackageImports(input, ["lodash"]);
    expect(result).toMatchInlineSnapshot(`
      "import map from 'lodash/map';
      import filter as f from 'lodash/filter';
      import reduce from 'lodash/reduce'"
    `);
  });

  it("handles newlines and indentation in imports", () => {
    const input = `import {
  map,
  filter,
  reduce
} from 'lodash'`;
    const result = transformOptimizedPackageImports(input, ["lodash"]);
    expect(result).toMatchInlineSnapshot(`
      "import map from 'lodash/map';
      import filter from 'lodash/filter';
      import reduce from 'lodash/reduce'"
    `);
  });

  it("does not transform default imports", () => {
    const input = "import lodash from 'lodash'";
    const result = transformOptimizedPackageImports(input, ["lodash"]);
    expect(result).toMatchInlineSnapshot(`"import lodash from 'lodash'"`);
  });

  it("handles multiple imports from the same package on different lines", () => {
    const input = `import { map } from 'lodash'
import { filter } from 'lodash'`;
    const result = transformOptimizedPackageImports(input, ["lodash"]);
    expect(result).toMatchInlineSnapshot(`
      "import map from 'lodash/map'
      import filter from 'lodash/filter'"
    `);
  });

  it("handles empty package list", () => {
    const input = "import { map } from 'lodash'";
    const result = transformOptimizedPackageImports(input, []);
    expect(result).toMatchInlineSnapshot(`"import { map } from 'lodash'"`);
  });
});
