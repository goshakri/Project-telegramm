import { createLandingSchema } from "../lib/dui-demo.js";
import { createDuiController } from "../lib/dui-runtime.js";
import { assertValidDuiSchema } from "../lib/dui-schema.js";

export function renderLandingPage(root) {
  const schema = assertValidDuiSchema(createLandingSchema());
  const controller = createDuiController({ root, initialSchema: schema });
  controller.render();
}
