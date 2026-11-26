# rules/effect-tracing

Let the application decide which operations to trace.

## Choose a mode

| Mode                     | Rule setting                            | Preset                             |
| ------------------------ | --------------------------------------- | ---------------------------------- |
| `application` (standard) | `"error"` or `["error", "application"]` | `/preset` or `/preset/application` |
| `library`                | `["error", "library"]`                  | `/preset/library`                  |

Preset paths are relative to `@totto2727/oxlint`.
In a workspace with both kinds of code, extend `/preset` and set the `library` mode in an Oxlint override for library files.

## Application mode

Use `Effect.fn` for reusable Effect functions so you can trace failures back to the function's definition and call site.
Use the named form when an operation needs its own span.
The unnamed form records stack frames without creating a span.
`Effect.withSpan` and `Effect.withSpanScoped` are also allowed.
The rule reports calls to `Effect.fnUntraced` and `Effect.fnUntracedEager`.

```ts
import { Effect } from 'effect'

// Reported: the function omits Effect stack frames.
const loadUntraced = Effect.fnUntraced(function* (id: string) {
  return yield* Effect.succeed({ id })
})

// Allowed: the operation gets a span named users.load.
const load = Effect.fn('users.load')(function* (id: string) {
  return yield* Effect.succeed({ id })
})
```

## Library mode

Use `Effect.fnUntraced` for reusable Effect functions.
The caller can name an operation and wrap it in a span at the point of use, where the application knows what the operation means and how much detail to record.
This avoids adding library-defined spans and stack-frame capture to every caller's execution.
The rule reports calls to `Effect.fn`, `Effect.withSpan`, and `Effect.withSpanScoped`.
Both untraced variants are allowed, but `Effect.fnUntracedEager` can run synchronous work at call time.
Use it only when that timing is intentional.

```ts
import { Effect } from 'effect'

// Reported: the library sets the span name for every caller.
const loadTraced = Effect.fn('users.load')(function* (id: string) {
  return yield* Effect.succeed({ id })
})

// Allowed: the application can trace the call if it needs to.
const load = Effect.fnUntraced(function* (id: string) {
  return yield* Effect.succeed({ id })
})
```

## Inline generators in both modes

Keep inline `Effect.gen` callbacks anonymous.
A generator's JavaScript name is not an Effect span name.
Change `Effect.gen(function* loadUser() { /* ... */ })` to `Effect.gen(function* () { /* ... */ })`.
If the body refers to its own name, keep a separate named generator and pass it by reference so the behavior does not change.
To name the trace of an inline effect, add `.pipe(Effect.withSpan('users.load'))` in application code or at the library's call site.

## Fixes and exceptions

There is no automatic fix.
Check evaluation timing before replacing `Effect.fnUntracedEager`.
If an application needs untraced execution on a measured performance-critical path, or a library must emit a span as part of its public contract, suppress only that call with `// oxlint-disable-next-line rules/effect-tracing -- reason`.
State the requirement the standard policy would break.

## Source and tests

[Rule implementation](https://github.com/totto2727-org/oxlint/blob/main/src/rules/effect-tracing.ts) · [Tests](https://github.com/totto2727-org/oxlint/blob/main/src/rules/effect-tracing.test.ts)
