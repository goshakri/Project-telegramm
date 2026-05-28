import assert from "node:assert/strict";
import test from "node:test";
import { runContractSmoke } from "../../scripts/contract-smoke.mjs";

test(
  "server contract smoke covers routing and the live mock intent endpoint",
  { timeout: 15_000 },
  async () => {
    const result = await runContractSmoke();

    assert.deepEqual(result.checks, [
      "GET / -> 200 HTML shell",
      "GET /dashboard -> 200 HTML shell",
      "GET /telegram-tasks -> 200 HTML shell",
      "GET /main.js -> 200 static asset",
      "GET /api/dui/intent -> 405 JSON",
      "POST /api/dui/intent -> 200 schema payload",
      "GET /api/comment-tasks -> 200 task store",
      "GET /missing-route -> 404 JSON",
    ]);
  },
);
