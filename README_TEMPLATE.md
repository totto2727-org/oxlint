# template-vite-plus-lib

A small TypeScript library for creating a greeting from a supplied name.

## Usage

Create a personalized welcome message:

```ts
import { greet } from 'template-vite-plus-lib'

const message = greet('TypeScript')
console.log(message) // Hello, TypeScript!
```

## Key features

- Named and default greetings with no runtime dependencies.
- ESM exports with TypeScript declarations.

## Prerequisites

- **Node.js**: Version 24 or newer with an ESM project.

## Setup

This starter is not published to npm.
Install a locally supplied package archive as a project dependency:

```bash
npm install ./template-vite-plus-lib-0.0.0.tgz
```

## API

### `greet(name?: string): string`

Returns `Hello, <name>!` without trimming or otherwise changing the supplied name.
Omitting `name` or passing `undefined` returns `Hello, world!`.
An empty string returns `Hello, !`.

```ts
import { greet } from 'template-vite-plus-lib'

console.log(greet()) // Hello, world!
console.log(greet('Ada')) // Hello, Ada!
console.log(greet('')) // Hello, !
```

## Development

For project structure and development commands, see [AGENTS.md](./AGENTS.md).

## License

MIT

_This README was generated from the [share-artifact skill](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/SKILL.md) and [README template](https://raw.githubusercontent.com/totto2727-org/agent/refs/heads/main/plugins/totto2727-coding/skills/share-artifact/readme/template.md)._
