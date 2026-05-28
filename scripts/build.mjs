import { access } from "node:fs/promises";

const requiredFiles = [
  "server.mjs",
  "app/client/main.js",
  "app/client/styles.css",
  "app/client/pages/landing-page.js",
  "app/client/pages/dashboard-page.js",
  "app/client/pages/telegram-tasks-page.js",
  "app/client/lib/dui-demo.js",
  "app/client/lib/dui-schema.js",
  "app/client/lib/dui-runtime.js",
  "app/client/lib/dui-registry.js",
  "api/dui/intent.mjs",
  "api/comment-tasks/handler.mjs",
  "api/comment-tasks/store.mjs",
  "data/comment-tasks.json",
];

for (const file of requiredFiles) {
  await access(new URL(`../${file}`, import.meta.url));
}

console.log("Build checks passed.");
