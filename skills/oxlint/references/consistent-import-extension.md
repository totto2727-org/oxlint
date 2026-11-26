# rules/consistent-import-extension

Match the extension to the file that the runtime or build tool resolves.
TypeScript can resolve some JavaScript extensions to TypeScript sources during type checking, but the runtime might still look for the literal JavaScript path.
Choose a mode based on what resolves the import, not just the language of the file that contains it.

## Choose a mode

| Mode            | Rule setting                               | Use when                                                                                               |
| --------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `ts` (standard) | `"error"` or `["error", { "mode": "ts" }]` | A runtime or tool resolves the TypeScript source files.                                                |
| `js`            | `["error", { "mode": "js" }]`              | Imports refer to JavaScript files at runtime, including builds that preserve specifiers in the output. |

| Input          | `ts` target | `js` target |
| -------------- | ----------- | ----------- |
| `.js`, `.ts`   | `.ts`       | `.js`       |
| `.jsx`, `.tsx` | `.tsx`      | `.js`       |
| `.mjs`, `.mts` | `.mts`      | `.mjs`      |
| `.cjs`, `.cts` | `.cts`      | `.cjs`      |

## TypeScript mode

Point to the source file so the loader can find it without remapping an extension.
If you also emit JavaScript, use this mode only if the build rewrites the specifiers or the output loader can resolve them.

```ts
// Reported when the source file is ./parse.ts.
import './parse.js'
// Corrected path in ts mode:
import './parse.ts'
```

## JavaScript mode

Point to the output file so a JavaScript runtime does not look for a `.ts` file that was not shipped.
The rule assumes JSX compiles to `.js`.
Check your output if your tool preserves `.jsx`.
Both modes keep the explicit ESM and CommonJS extension families separate.

```ts
// Reported when the emitted file is ./parse.js.
import './parse.ts'
// Corrected path in js mode:
import './parse.js'
```

## Scope and fixes

The rule checks relative paths and `#` aliases that contain a slash in static imports, re-exports, and literal dynamic imports.
It ignores bare package names, absolute paths, slashless aliases such as `#utils`, and asset extensions.
Use [require-import-extension](require-import-extension.md) for missing extensions.

The fix changes only the extension and preserves the quotes, query string, and fragment.
The rule does not check whether the target file exists.
Verify the actual source or output extension before accepting the fix.
If an individual import must follow a different loader convention, suppress only that line and name the convention in the reason.

## Source and tests

[Rule implementation](https://github.com/totto2727-org/oxlint/blob/main/src/rules/consistent-import-extension.ts) · [Tests](https://github.com/totto2727-org/oxlint/blob/main/src/rules/consistent-import-extension.test.ts)
