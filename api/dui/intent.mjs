import { resolveIntentRequest } from "../../app/client/lib/dui-demo.js";
import { validateDuiSchema } from "../../app/client/lib/dui-schema.js";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  if (!request || typeof request[Symbol.asyncIterator] !== "function") {
    return {};
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const body = Buffer.concat(chunks).toString("utf8");
  if (!body.trim()) {
    return {};
  }

  return JSON.parse(body);
}

function validateIntentRequest(payload) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return {
      error: "invalid_request",
      message: "Intent payload must be a JSON object.",
      ok: false,
    };
  }

  if (typeof payload.page !== "string" || typeof payload.intent !== "string") {
    return {
      error: "invalid_request",
      message: "Intent payload must include string page and intent fields.",
      ok: false,
    };
  }

  return {
    ok: true,
  };
}

export async function handleIntentRequest(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, {
      error: "method_not_allowed",
    });
    return;
  }

  let requestBody;
  try {
    requestBody = await readJsonBody(request);
  } catch {
    sendJson(response, 400, {
      error: "invalid_json",
      message: "Request body must be valid JSON.",
    });
    return;
  }

  const requestValidation = validateIntentRequest(requestBody);
  if (!requestValidation.ok) {
    sendJson(response, 400, requestValidation);
    return;
  }

  if (requestBody.mock?.behavior === "error") {
    sendJson(response, 503, {
      error: "mock_unavailable",
      fallbackMessage: "The mock intent service is offline. The last validated layout should stay visible.",
      ok: false,
    });
    return;
  }

  if (requestBody.mock?.behavior === "invalid") {
    sendJson(response, 200, {
      ok: true,
      schema: {
        version: "1.0",
        page: requestBody.page,
        meta: {
          title: "Invalid schema",
          description: "This payload intentionally violates the registry contract.",
        },
        blocks: [
          {
            id: "broken",
            type: "unknownBlock",
            props: {},
          },
        ],
      },
    });
    return;
  }

  const result = resolveIntentRequest(requestBody);

  if (!result.payload.ok || !result.payload.schema) {
    sendJson(response, result.code, result.payload);
    return;
  }

  const validation = validateDuiSchema(result.payload.schema);
  if (!validation.ok) {
    sendJson(response, 500, {
      error: "server_invalid_schema",
      fallbackMessage: "The intent service produced an invalid schema and was blocked before render.",
      issues: validation.errors,
      ok: false,
    });
    return;
  }

  sendJson(response, result.code, result.payload);
}
