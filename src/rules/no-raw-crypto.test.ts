import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { noRawCrypto } from './no-raw-crypto.ts'

// oxlint-disable-next-line rules/require-vitest-hooks -- RuleTester registers Vitest cases during collection, before hooks run.
runRuleTest('no-raw-crypto', noRawCrypto, {
  invalid: [
    {
      code: "import { Effect } from 'effect'; Effect.tryPromise(() => crypto.subtle.digest('SHA-256', bytes))",
      errors: [{ message: /Digest\.Digest.*Digest\.layerWebCrypto/u }],
    },
    { code: 'globalThis.crypto.randomUUID()', errors: 1 },
    { code: 'window?.["crypto"]?.getRandomValues(bytes)', errors: 1 },
    { code: "const { ['crypto']: raw } = self; raw.randomUUID()", errors: 1 },
    { code: '({ crypto: raw } = global)', errors: 1 },
    { code: 'const { subtle } = crypto; subtle.digest(algorithm, bytes)', errors: 1 },
    { code: 'const primitives = { crypto }; primitives.crypto.randomUUID()', errors: 1 },
    { code: 'crypto.getRandomValues(bytes)', errors: 1, languageOptions: { env: { browser: true } } },
    { code: "import { createHash as hash } from 'node:crypto'; hash('sha256')", errors: 1 },
    { code: "import * as primitives from 'crypto'; primitives.randomBytes(8)", errors: 1 },
    { code: "import primitives from 'node:crypto'; primitives.randomUUID()", errors: 1 },
    {
      code: "import { type KeyObject, webcrypto as raw } from 'node:crypto'; raw.randomUUID()",
      errors: 1,
      filename: 'app.ts',
    },
    { code: "import 'node:crypto'", errors: 1 },
    { code: "export * from 'node:crypto'", errors: 1 },
    { code: "export { randomBytes as bytes } from 'crypto'", errors: 1 },
    { code: "export {} from 'crypto'", errors: 1 },
    { code: "const { randomUUID: uuid } = await import('node:crypto'); uuid()", errors: 1 },
    { code: "const { randomBytes: bytes } = require('crypto'); bytes(8)", errors: 1 },
    { code: "import primitives = require('node:crypto'); primitives.randomUUID()", errors: 1, filename: 'app.cts' },
  ],
  valid: [
    {
      code: `import { Effect } from 'effect';
        import { Digest, SecureRandom } from 'effect/crypto';
        Effect.gen(function* () {
          const crypto = yield* Digest.Digest;
          const random = yield* SecureRandom.SecureRandom;
          const bytes = yield* random.randomBytes(size);
          return yield* crypto.digest(Digest.sha256, bytes);
        });`,
    },
    { code: 'function local(crypto) { return crypto.subtle.digest(algorithm, bytes) }' },
    { code: 'function local(globalThis, self, window) { return [globalThis.crypto, self.crypto, window.crypto] }' },
    { code: "import { crypto } from './service.ts'; crypto.subtle.digest(algorithm, bytes)" },
    {
      code: 'const object = { crypto: fake }; object.crypto.randomUUID(); object["crypto"]; const { crypto } = object',
    },
    { code: 'const { [field]: api } = globalThis; globalThis[field]; object.crypto' },
    { code: 'function local(require) { return require("node:crypto") }' },
    { code: "import { crypto as service } from './app.ts'; export { crypto as tool } from './app.ts'" },
    {
      code: `import type { KeyObject } from 'node:crypto';
        import { type Cipheriv as Cipher } from 'crypto';
        export type * from 'node:crypto';
        export { type KeyObject as Key } from 'node:crypto';
        type Web = typeof crypto;
        type WebMember = typeof globalThis.crypto;
        type NodeCrypto = typeof import('node:crypto');
        type Crypto = { crypto: SubtleCrypto };`,
      filename: 'types.ts',
    },
  ],
})
