import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleCommentTasksRequest } from "./api/comment-tasks/handler.mjs";
import { handleIntentRequest } from "./api/dui/intent.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.join(__dirname, "app", "client");
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendHtml(response, pathname) {
  const title =
    pathname === "/telegram-tasks"
      ? "Telegram Comment Tasks"
      : pathname === "/dashboard"
        ? "Dynamic User Interface Dashboard"
        : "Dynamic User Interface";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body data-route="${pathname}">
    <div id="app"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`;

  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(html);
}

async function serveStaticFile(response, pathname) {
  const sanitizedPath = pathname === "/" ? "/main.js" : pathname;
  const filePath = path.join(clientRoot, sanitizedPath);

  if (!filePath.startsWith(clientRoot) || !existsSync(filePath)) {
    return false;
  }

  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    return false;
  }

  const ext = path.extname(filePath);
  response.writeHead(200, {
    "content-type": MIME_TYPES[ext] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(filePath).pipe(response);
  return true;
}

export function createAppServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`,
    );
    const { pathname } = url;

    if (pathname === "/api/dui/intent") {
      await handleIntentRequest(request, response);
      return;
    }

    if (pathname.startsWith("/api/comment-tasks")) {
      await handleCommentTasksRequest(request, response, pathname);
      return;
    }

    if (pathname === "/" || pathname === "/dashboard" || pathname === "/telegram-tasks") {
      sendHtml(response, pathname);
      return;
    }

    if (await serveStaticFile(response, pathname)) {
      return;
    }

    sendJson(response, 404, {
      error: "not_found",
      message: `No route registered for ${pathname}`,
    });
  });
}

export function startServer() {
  const server = createAppServer();
  server.listen(port, host, () => {
    console.log(`DUI MVP running at http://${host}:${port}`);
  });
  return server;
}

if (process.argv[1] === __filename) {
  startServer();
}
