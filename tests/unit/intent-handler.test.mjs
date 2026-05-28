import assert from "node:assert/strict";
import test from "node:test";
import { handleIntentRequest } from "../../api/dui/intent.mjs";
import { validateDuiSchema } from "../../app/client/lib/dui-schema.js";
import { createRequest, createResponse, parseJsonBody } from "../helpers/http-doubles.mjs";

test("handleIntentRequest rejects non-POST methods with a stable JSON contract", async () => {
  const request = createRequest({ method: "GET" });
  const response = createResponse();

  await handleIntentRequest(request, response);

  assert.equal(response.statusCode, 405);
  assert.deepEqual(response.headers, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  assert.deepEqual(parseJsonBody(response), {
    error: "method_not_allowed",
  });
  assert.equal(response.ended, true);
});

test("handleIntentRequest rejects malformed JSON payloads", async () => {
  const request = createRequest({ method: "POST", body: "{bad json" });
  const response = createResponse();

  await handleIntentRequest(request, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.headers, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  assert.deepEqual(parseJsonBody(response), {
    error: "invalid_json",
    message: "Request body must be valid JSON.",
  });
  assert.equal(response.ended, true);
});

test("handleIntentRequest rejects incomplete request payloads", async () => {
  const request = createRequest({
    method: "POST",
    body: { intent: "tighten-queue" },
  });
  const response = createResponse();

  await handleIntentRequest(request, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(parseJsonBody(response), {
    error: "invalid_request",
    message: "Intent payload must include string page and intent fields.",
    ok: false,
  });
});

test("handleIntentRequest returns a validated dashboard schema for a known intent", async () => {
  const request = createRequest({
    method: "POST",
    body: { page: "dashboard", intent: "tighten-queue" },
  });
  const response = createResponse();

  await handleIntentRequest(request, response);

  const payload = parseJsonBody(response);
  assert.equal(response.statusCode, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.ui.intent, "tighten-queue");
  assert.equal(validateDuiSchema(payload.schema).ok, true);
});

test("handleIntentRequest can simulate an unavailable service", async () => {
  const request = createRequest({
    method: "POST",
    body: {
      page: "dashboard",
      intent: "tighten-queue",
      mock: { behavior: "error" },
    },
  });
  const response = createResponse();

  await handleIntentRequest(request, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(parseJsonBody(response), {
    error: "mock_unavailable",
    fallbackMessage:
      "The mock intent service is offline. The last validated layout should stay visible.",
    ok: false,
  });
});
