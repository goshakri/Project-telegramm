import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const serverEntry = path.join(projectRoot, "server.mjs");
const host = "127.0.0.1";

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;

      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }

        if (!port) {
          reject(new Error("Failed to allocate a free port."));
          return;
        }

        resolve(port);
      });
    });
  });
}

function createServerHarness({ port }) {
  const child = spawn(process.execPath, [serverEntry], {
    cwd: projectRoot,
    env: {
      ...process.env,
      HOST: host,
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  return {
    child,
    getLogs() {
      return { stdout: stdout.trim(), stderr: stderr.trim() };
    },
    async stop() {
      if (child.exitCode !== null) {
        return;
      }

      child.kill("SIGTERM");

      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (child.exitCode !== null) {
          return;
        }
        await delay(50);
      }

      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
    },
  };
}

function formatLogs(logs) {
  const sections = [];

  if (logs.stdout) {
    sections.push(`stdout:\n${logs.stdout}`);
  }

  if (logs.stderr) {
    sections.push(`stderr:\n${logs.stderr}`);
  }

  return sections.join("\n\n");
}

async function waitForServerReady(baseUrl, harness, timeoutMs) {
  const startTime = Date.now();
  let lastError = null;

  while (Date.now() - startTime < timeoutMs) {
    if (harness.child.exitCode !== null) {
      const logs = formatLogs(harness.getLogs());
      throw new Error(
        `Server exited before becoming ready (code ${harness.child.exitCode}).${logs ? `\n\n${logs}` : ""}`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/`, {
        headers: { accept: "text/html" },
      });

      if (response.ok) {
        await response.arrayBuffer();
        return;
      }

      lastError = new Error(`Unexpected readiness status: ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(50);
  }

  const logs = formatLogs(harness.getLogs());
  throw new Error(
    `Timed out waiting for server readiness.${lastError ? ` Last error: ${lastError.message}` : ""}${logs ? `\n\n${logs}` : ""}`,
  );
}

async function request(baseUrl, pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const text = await response.text();
  const headers = Object.fromEntries(response.headers.entries());
  let json = null;

  if ((headers["content-type"] ?? "").includes("application/json") && text) {
    json = JSON.parse(text);
  }

  return {
    headers,
    json,
    status: response.status,
    text,
  };
}

function assertStatus(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected status ${expected}, received ${actual}.`);
  }
}

function assertHeaderIncludes(headers, name, expectedValue, label) {
  const actualValue = headers[name];

  if (!actualValue || !actualValue.includes(expectedValue)) {
    throw new Error(
      `${label}: expected header ${name} to include "${expectedValue}", received "${actualValue ?? "<missing>"}".`,
    );
  }
}

function assertTextIncludes(text, expectedValue, label) {
  if (!text.includes(expectedValue)) {
    throw new Error(`${label}: response body did not include "${expectedValue}".`);
  }
}

function assertJsonMatch(actual, expected, label) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`${label}: expected JSON ${expectedJson}, received ${actualJson}.`);
  }
}

export async function runContractSmoke({ log = () => {}, timeoutMs = 5_000 } = {}) {
  const port = await getFreePort();
  const baseUrl = `http://${host}:${port}`;
  const harness = createServerHarness({ port });
  const checks = [];

  try {
    await waitForServerReady(baseUrl, harness, timeoutMs);

    const root = await request(baseUrl, "/");
    assertStatus(root.status, 200, "GET /");
    assertHeaderIncludes(root.headers, "content-type", "text/html", "GET /");
    assertTextIncludes(root.text, 'data-route="/"', "GET /");
    assertTextIncludes(root.text, "<title>Dynamic User Interface</title>", "GET /");
    checks.push("GET / -> 200 HTML shell");
    log(checks.at(-1));

    const dashboard = await request(baseUrl, "/dashboard");
    assertStatus(dashboard.status, 200, "GET /dashboard");
    assertHeaderIncludes(dashboard.headers, "content-type", "text/html", "GET /dashboard");
    assertTextIncludes(dashboard.text, 'data-route="/dashboard"', "GET /dashboard");
    assertTextIncludes(dashboard.text, "<title>Dynamic User Interface Dashboard</title>", "GET /dashboard");
    checks.push("GET /dashboard -> 200 HTML shell");
    log(checks.at(-1));

    const telegramTasks = await request(baseUrl, "/telegram-tasks");
    assertStatus(telegramTasks.status, 200, "GET /telegram-tasks");
    assertHeaderIncludes(telegramTasks.headers, "content-type", "text/html", "GET /telegram-tasks");
    assertTextIncludes(telegramTasks.text, 'data-route="/telegram-tasks"', "GET /telegram-tasks");
    assertTextIncludes(telegramTasks.text, "<title>Telegram Comment Tasks</title>", "GET /telegram-tasks");
    checks.push("GET /telegram-tasks -> 200 HTML shell");
    log(checks.at(-1));

    const mainScript = await request(baseUrl, "/main.js");
    assertStatus(mainScript.status, 200, "GET /main.js");
    assertHeaderIncludes(mainScript.headers, "content-type", "text/javascript", "GET /main.js");
    assertTextIncludes(mainScript.text, 'import { renderLandingPage }', "GET /main.js");
    checks.push("GET /main.js -> 200 static asset");
    log(checks.at(-1));

    const getIntent = await request(baseUrl, "/api/dui/intent");
    assertStatus(getIntent.status, 405, "GET /api/dui/intent");
    assertHeaderIncludes(getIntent.headers, "content-type", "application/json", "GET /api/dui/intent");
    assertJsonMatch(getIntent.json, { error: "method_not_allowed" }, "GET /api/dui/intent");
    checks.push("GET /api/dui/intent -> 405 JSON");
    log(checks.at(-1));

    const postIntent = await request(baseUrl, "/api/dui/intent", {
      body: JSON.stringify({ page: "dashboard", intent: "tighten-queue" }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    assertStatus(postIntent.status, 200, "POST /api/dui/intent");
    assertHeaderIncludes(postIntent.headers, "content-type", "application/json", "POST /api/dui/intent");
    if (!postIntent.json?.ok || postIntent.json?.ui?.intent !== "tighten-queue") {
      throw new Error("POST /api/dui/intent: expected a successful mock schema payload.");
    }
    checks.push("POST /api/dui/intent -> 200 schema payload");
    log(checks.at(-1));

    const commentTasks = await request(baseUrl, "/api/comment-tasks");
    assertStatus(commentTasks.status, 200, "GET /api/comment-tasks");
    assertHeaderIncludes(commentTasks.headers, "content-type", "application/json", "GET /api/comment-tasks");
    if (!commentTasks.json?.ok || !Array.isArray(commentTasks.json?.store?.tasks)) {
      throw new Error("GET /api/comment-tasks: expected a successful task store payload.");
    }
    checks.push("GET /api/comment-tasks -> 200 task store");
    log(checks.at(-1));

    const missing = await request(baseUrl, "/missing-route");
    assertStatus(missing.status, 404, "GET /missing-route");
    assertHeaderIncludes(missing.headers, "content-type", "application/json", "GET /missing-route");
    assertJsonMatch(
      missing.json,
      {
        error: "not_found",
        message: "No route registered for /missing-route",
      },
      "GET /missing-route",
    );
    checks.push("GET /missing-route -> 404 JSON");
    log(checks.at(-1));

    return { baseUrl, checks };
  } catch (error) {
    const logs = formatLogs(harness.getLogs());
    error.message = `${error.message}${logs ? `\n\n${logs}` : ""}`;
    throw error;
  } finally {
    await harness.stop();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    const result = await runContractSmoke({
      log(message) {
        console.log(message);
      },
    });

    console.log(`Contract smoke passed (${result.checks.length} checks).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
