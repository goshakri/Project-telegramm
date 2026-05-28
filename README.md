# primitives-dui-mvp

[video](https://youtu.be/U32FdySVc5M?si=ECvtO-d8uAILpPu2)

## Run

- `node --run start` starts the local DUI MVP on [http://127.0.0.1:3000](http://127.0.0.1:3000).
- `node --run build` validates that the required app/runtime files are present.
- `node --run test` runs the unit and contract smoke suite.
- `http://127.0.0.1:3000/dashboard?intent=tighten-queue` is a shareable QA/demo URL that boots the dashboard and immediately runs one hidden-AI transform through the same intent pipeline.

## Testing

- `node --run test` runs the `node:test` suite.
- `node scripts/contract-smoke.mjs` runs only the HTTP contract smoke against a disposable local server process.

The test setup intentionally uses only built-in Node modules and avoids external test helpers.
