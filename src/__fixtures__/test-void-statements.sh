#!/bin/sh
set -eu

# Exercise the native rule with the option exported by the shared preset.
mkdir -p tmp
fixture=$(mktemp -d "$PWD/tmp/void-statements.XXXXXX")
trap 'rm -rf "$fixture"' EXIT
engine="$PWD/node_modules/.bin/oxlint"
node --input-type=module -e '
  import preset from "./src/preset.ts"
  console.log(JSON.stringify({ rules: { "eslint/no-void": preset.rules["eslint/no-void"] } }))
' > "$fixture/config.json"
cat > "$fixture/actions.ts" <<'TS'
declare const upload: () => Promise<void>
export const onDrop = () => {
  void upload()
  return true
}
export const onClick = () => void upload()
export const discarded = void upload()
TS

cd "$fixture"
status=0
"$engine" --threads=1 --config config.json --format=json actions.ts > result.json || status=$?
test "$status" -eq 1
node --input-type=module -e '
  import assert from "node:assert/strict"
  import result from "./result.json" with { type: "json" }
  const lines = result.diagnostics.filter(({ code }) => code === "eslint(no-void)")
    .map(({ labels }) => labels[0].span.line).sort()
  assert.deepEqual(lines, [6, 7])
'
