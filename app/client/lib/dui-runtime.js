import { renderBlock } from "./dui-registry.js";
import { createFallbackStatus, validateDuiSchema, withStatus } from "./dui-schema.js";

function createShell(page) {
  const shell = document.createElement("main");
  shell.className = `page-shell page-shell--${page}`;
  return shell;
}

function normalizeResponsePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return {
      fallbackMessage: "The server returned an unreadable DUI payload.",
      ok: false,
    };
  }
  return payload;
}

function parseIntentPayload(target) {
  if (!target.dataset.payload) {
    return undefined;
  }
  try {
    return JSON.parse(target.dataset.payload);
  } catch {
    return undefined;
  }
}

export async function requestIntentUpdate({ endpoint = "/api/dui/intent", page, intent, payload }) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      intent,
      page,
      payload,
    }),
  });

  const text = await response.text();
  const data = text ? normalizeResponsePayload(JSON.parse(text)) : { ok: false };

  return {
    data,
    ok: response.ok && data.ok === true,
    status: response.status,
  };
}

export function renderDuiTree(root, schema) {
  const validation = validateDuiSchema(schema);

  if (!validation.ok) {
    return {
      errors: validation.errors,
      ok: false,
    };
  }

  const shell = createShell(schema.page);

  if (schema.status) {
    shell.append(
      renderBlock({
        id: `${schema.page}-status`,
        type: "notice",
        props: schema.status,
      }),
    );
  }

  schema.blocks.forEach((block) => {
    shell.append(renderBlock(block));
  });

  root.replaceChildren(shell);

  return {
    ok: true,
    schema,
  };
}

export function createDuiController({ root, initialSchema, endpoint = "/api/dui/intent" }) {
  let currentSchema = initialSchema;
  let busy = false;

  function render(schemaToRender = currentSchema) {
    const result = renderDuiTree(root, schemaToRender);

    if (!result.ok) {
      const fallbackSchema = withStatus(currentSchema, {
        body: `Validation failed: ${result.errors.join(" | ")}`,
        title: "Schema rejected",
        tone: "warning",
      });
      renderDuiTree(root, fallbackSchema);
      currentSchema = fallbackSchema;
      return {
        errors: result.errors,
        ok: false,
      };
    }

    currentSchema = schemaToRender;
    return result;
  }

  async function dispatchIntent(intent, payload) {
    if (busy) {
      return {
        ok: false,
        reason: "busy",
      };
    }

    busy = true;
    root.dataset.busy = "true";

    try {
      const response = await requestIntentUpdate({
        endpoint,
        intent,
        page: currentSchema.page,
        payload,
      });

      if (!response.ok || !response.data.schema) {
        const fallbackSchema = withStatus(
          currentSchema,
          createFallbackStatus({
            body:
              response.data?.fallbackMessage ??
              "The requested DUI update was rejected, so the previous validated layout stays active.",
          }),
        );
        render(fallbackSchema);
        return {
          ok: false,
          response,
        };
      }

      const validation = validateDuiSchema(response.data.schema);
      if (!validation.ok) {
        const fallbackSchema = withStatus(
          currentSchema,
          createFallbackStatus({
            body: `The server returned an invalid schema: ${validation.errors.join(" | ")}`,
          }),
        );
        render(fallbackSchema);
        return {
          ok: false,
          response,
          validation,
        };
      }

      render(response.data.schema);
      return {
        ok: true,
        response,
      };
    } catch {
      const fallbackSchema = withStatus(currentSchema, createFallbackStatus());
      render(fallbackSchema);
      return {
        ok: false,
        reason: "network",
      };
    } finally {
      busy = false;
      delete root.dataset.busy;
    }
  }

  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-intent]");
    if (!(target instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    const intent = target.dataset.intent;
    if (!intent) {
      return;
    }
    dispatchIntent(intent, parseIntentPayload(target));
  });

  return {
    dispatchIntent,
    getSchema() {
      return currentSchema;
    },
    render,
  };
}
