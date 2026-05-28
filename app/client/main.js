import { renderLandingPage } from "./pages/landing-page.js";
import { renderDashboardPage } from "./pages/dashboard-page.js";
import { renderTelegramTasksPage } from "./pages/telegram-tasks-page.js";

const route = document.body.dataset.route ?? "/";
const appRoot = document.querySelector("#app");

if (!appRoot) {
  throw new Error("Missing #app root.");
}

if (route === "/telegram-tasks") {
  renderTelegramTasksPage(appRoot);
} else if (route === "/dashboard") {
  renderDashboardPage(appRoot);
} else {
  renderLandingPage(appRoot);
}
