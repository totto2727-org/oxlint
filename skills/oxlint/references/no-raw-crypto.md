# rules/no-raw-crypto

Use Effect crypto services instead of calling Web Crypto or Node.js crypto directly.

## Purpose and behavior

The rule reports direct references to the global `crypto` object, including through `globalThis`, `global`, `self` and `window`.
It also reports imports, direct `require` calls and re-exports with the literal specifier `node:crypto` or `crypto`.
Wrapping a raw API in `Effect.tryPromise` still triggers the rule.
The rule does not trace aliases of global objects and ignores local bindings and type-only references.
The shared preset also keeps `rules/no-node-imports` enabled without exceptions, so a static `node:crypto` import can receive both diagnostics.

## Options

The rule has no options.

## Invalid example

```ts
import { randomUUID } from 'node:crypto'

const id = randomUUID()
```

## Valid example

```ts
import { Effect } from 'effect'
import { SecureRandom } from 'effect/crypto'

const id = Effect.gen(function* () {
  const random = yield* SecureRandom.SecureRandom
  return yield* random.uuidV4()
})
```

Provide `SecureRandom.layerWebCrypto` when composing the application's layers.
For digests, use `Digest.Digest` with `Digest.layerWebCrypto`.
The rule has no automatic fix.

## Source and tests

[Implementation](https://github.com/totto2727-org/oxlint/blob/2ee7fcec82703671bec2b0b5a879ec9704265e0c/src/rules/no-raw-crypto.ts) · [Tests](https://github.com/totto2727-org/oxlint/blob/2ee7fcec82703671bec2b0b5a879ec9704265e0c/src/rules/no-raw-crypto.test.ts)
