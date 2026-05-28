import { createDashboardSchema } from "../lib/dui-demo.js";
import { createDuiController } from "../lib/dui-runtime.js";
import { assertValidDuiSchema } from "../lib/dui-schema.js";

export function renderDashboardPage(root) {
  const schema = assertValidDuiSchema(createDashboardSchema());
  const controller = createDuiController({ root, initialSchema: schema });
  controller.render();

  const requestedIntent = new URLSearchParams(window.location.search).get("intent");
  if (requestedIntent) {
    controller.dispatchIntent(requestedIntent);
  }
}
