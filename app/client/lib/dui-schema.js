import { DUI_SCHEMA_VERSION } from "./dui-demo.js";

const blockValidators = new Map();

const toneValues = new Set(["mint", "violet", "yellow", "rose", "slate", "white"]);
const noticeToneValues = new Set(["neutral", "success", "warning"]);
const pageValues = new Set(["landing", "dashboard"]);
const blockTypeValues = new Set([
  "masthead",
  "hero",
  "statStrip",
  "storyGrid",
  "timeline",
  "ctaBand",
  "dashboardHero",
  "kpiGrid",
  "actionDock",
  "workspaceGrid",
  "activityFeed",
  "notice",
]);

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pushError(errors, path, message) {
  errors.push(`${path}: ${message}`);
}

function validateExactKeys(value, allowedKeys, path, errors) {
  const actualKeys = Object.keys(value);
  for (const key of actualKeys) {
    if (!allowedKeys.includes(key)) {
      pushError(errors, `${path}.${key}`, "unexpected key");
    }
  }
}

function validateString(value, path, errors, { minLength = 1 } = {}) {
  if (typeof value !== "string" || value.trim().length < minLength) {
    pushError(errors, path, "expected non-empty string");
    return false;
  }
  return true;
}

function validateEnum(value, allowedValues, path, errors) {
  if (!allowedValues.has(value)) {
    pushError(errors, path, `expected one of ${Array.from(allowedValues).join(", ")}`);
    return false;
  }
  return true;
}

function validateHref(value, path, errors) {
  if (!validateString(value, path, errors)) {
    return false;
  }

  if (!value.startsWith("/") && !value.startsWith("#")) {
    pushError(errors, path, "href must start with / or #");
    return false;
  }

  return true;
}

function validateAction(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected action object");
    return false;
  }

  validateExactKeys(value, ["type", "label", "href", "intent", "payload"], path, errors);

  const typeValid = validateEnum(value.type, new Set(["link", "intent"]), `${path}.type`, errors);
  const labelValid = validateString(value.label, `${path}.label`, errors);

  if (!typeValid || !labelValid) {
    return false;
  }

  if (value.type === "link") {
    return validateHref(value.href, `${path}.href`, errors);
  }

  return validateString(value.intent, `${path}.intent`, errors);
}

function validateArray(value, path, errors, itemValidator, { minLength = 1 } = {}) {
  if (!Array.isArray(value) || value.length < minLength) {
    pushError(errors, path, "expected non-empty array");
    return false;
  }

  value.forEach((item, index) => {
    itemValidator(item, `${path}[${index}]`, errors);
  });

  return true;
}

function validateMeta(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected meta object");
    return false;
  }

  validateExactKeys(value, ["title", "description"], path, errors);
  validateString(value.title, `${path}.title`, errors);
  validateString(value.description, `${path}.description`, errors);
  return true;
}

function validateNoticeProps(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected notice object");
    return false;
  }

  validateExactKeys(value, ["tone", "title", "body"], path, errors);
  validateEnum(value.tone, noticeToneValues, `${path}.tone`, errors);
  validateString(value.title, `${path}.title`, errors);
  validateString(value.body, `${path}.body`, errors);
  return true;
}

function validateNavItem(value, path, errors) {
  return validateAction(value, path, errors);
}

function validateMetric(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected metric object");
    return false;
  }
  validateExactKeys(value, ["label", "value"], path, errors);
  validateString(value.label, `${path}.label`, errors);
  validateString(value.value, `${path}.value`, errors);
  return true;
}

function validateStatItem(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected stat item");
    return false;
  }
  validateExactKeys(value, ["label", "value", "detail"], path, errors);
  validateString(value.label, `${path}.label`, errors);
  validateString(value.value, `${path}.value`, errors);
  validateString(value.detail, `${path}.detail`, errors);
  return true;
}

function validateStoryCard(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected story card");
    return false;
  }
  validateExactKeys(value, ["eyebrow", "title", "body", "tone", "href"], path, errors);
  validateString(value.eyebrow, `${path}.eyebrow`, errors);
  validateString(value.title, `${path}.title`, errors);
  validateString(value.body, `${path}.body`, errors);
  validateEnum(value.tone, toneValues, `${path}.tone`, errors);
  validateHref(value.href, `${path}.href`, errors);
  return true;
}

function validateTimelineItem(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected timeline item");
    return false;
  }
  validateExactKeys(value, ["time", "kicker", "title", "body", "tone"], path, errors);
  validateString(value.time, `${path}.time`, errors);
  validateString(value.kicker, `${path}.kicker`, errors);
  validateString(value.title, `${path}.title`, errors);
  validateString(value.body, `${path}.body`, errors);
  validateEnum(value.tone, toneValues, `${path}.tone`, errors);
  return true;
}

function validateKpi(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected KPI item");
    return false;
  }
  validateExactKeys(value, ["label", "value", "delta", "emphasis"], path, errors);
  validateString(value.label, `${path}.label`, errors);
  validateString(value.value, `${path}.value`, errors);
  validateString(value.delta, `${path}.delta`, errors);
  validateEnum(value.emphasis, toneValues, `${path}.emphasis`, errors);
  return true;
}

function validateActionCard(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected action item");
    return false;
  }
  validateExactKeys(value, ["intent", "label", "description", "tone"], path, errors);
  validateString(value.intent, `${path}.intent`, errors);
  validateString(value.label, `${path}.label`, errors);
  validateString(value.description, `${path}.description`, errors);
  validateEnum(value.tone, toneValues, `${path}.tone`, errors);
  return true;
}

function validateWorkspaceCard(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected workspace card");
    return false;
  }

  validateExactKeys(value, ["title", "meta", "body", "state", "tags", "tone", "action"], path, errors);
  validateString(value.title, `${path}.title`, errors);
  validateString(value.meta, `${path}.meta`, errors);
  validateString(value.body, `${path}.body`, errors);
  validateString(value.state, `${path}.state`, errors);
  validateEnum(value.tone, toneValues, `${path}.tone`, errors);
  validateArray(value.tags, `${path}.tags`, errors, (item, itemPath, itemErrors) => {
    validateString(item, itemPath, itemErrors);
  });

  if (value.action !== undefined) {
    validateAction(value.action, `${path}.action`, errors);
  }
  return true;
}

function validateWorkspaceColumn(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected workspace column");
    return false;
  }
  validateExactKeys(value, ["eyebrow", "title", "cards"], path, errors);
  validateString(value.eyebrow, `${path}.eyebrow`, errors);
  validateString(value.title, `${path}.title`, errors);
  validateArray(value.cards, `${path}.cards`, errors, validateWorkspaceCard);
  return true;
}

function validateActivityItem(value, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected activity item");
    return false;
  }
  validateExactKeys(value, ["time", "title", "body", "tone"], path, errors);
  validateString(value.time, `${path}.time`, errors);
  validateString(value.title, `${path}.title`, errors);
  validateString(value.body, `${path}.body`, errors);
  validateEnum(value.tone, toneValues, `${path}.tone`, errors);
  return true;
}

function validatePropsShape(value, allowedKeys, path, errors) {
  if (!isPlainObject(value)) {
    pushError(errors, path, "expected props object");
    return false;
  }
  validateExactKeys(value, allowedKeys, path, errors);
  return true;
}

blockValidators.set("masthead", (props, path, errors) => {
  if (!validatePropsShape(props, ["label", "eyebrow", "nav", "action"], path, errors)) {
    return false;
  }
  validateString(props.label, `${path}.label`, errors);
  validateString(props.eyebrow, `${path}.eyebrow`, errors);
  validateArray(props.nav, `${path}.nav`, errors, validateNavItem);
  validateAction(props.action, `${path}.action`, errors);
  return true;
});

blockValidators.set("hero", (props, path, errors) => {
  if (
    !validatePropsShape(
      props,
      ["accent", "eyebrow", "title", "body", "metrics", "primaryAction", "secondaryAction"],
      path,
      errors,
    )
  ) {
    return false;
  }
  validateEnum(props.accent, toneValues, `${path}.accent`, errors);
  validateString(props.eyebrow, `${path}.eyebrow`, errors);
  validateString(props.title, `${path}.title`, errors);
  validateString(props.body, `${path}.body`, errors);
  validateArray(props.metrics, `${path}.metrics`, errors, validateMetric);
  validateAction(props.primaryAction, `${path}.primaryAction`, errors);
  if (props.secondaryAction !== undefined) {
    validateAction(props.secondaryAction, `${path}.secondaryAction`, errors);
  }
  return true;
});

blockValidators.set("statStrip", (props, path, errors) => {
  if (!validatePropsShape(props, ["items"], path, errors)) {
    return false;
  }
  validateArray(props.items, `${path}.items`, errors, validateStatItem);
  return true;
});

blockValidators.set("storyGrid", (props, path, errors) => {
  if (!validatePropsShape(props, ["eyebrow", "title", "cards"], path, errors)) {
    return false;
  }
  validateString(props.eyebrow, `${path}.eyebrow`, errors);
  validateString(props.title, `${path}.title`, errors);
  validateArray(props.cards, `${path}.cards`, errors, validateStoryCard);
  return true;
});

blockValidators.set("timeline", (props, path, errors) => {
  if (!validatePropsShape(props, ["eyebrow", "title", "items"], path, errors)) {
    return false;
  }
  validateString(props.eyebrow, `${path}.eyebrow`, errors);
  validateString(props.title, `${path}.title`, errors);
  validateArray(props.items, `${path}.items`, errors, validateTimelineItem);
  return true;
});

blockValidators.set("ctaBand", (props, path, errors) => {
  if (!validatePropsShape(props, ["title", "body", "primaryAction", "secondaryAction"], path, errors)) {
    return false;
  }
  validateString(props.title, `${path}.title`, errors);
  validateString(props.body, `${path}.body`, errors);
  validateAction(props.primaryAction, `${path}.primaryAction`, errors);
  if (props.secondaryAction !== undefined) {
    validateAction(props.secondaryAction, `${path}.secondaryAction`, errors);
  }
  return true;
});

blockValidators.set("dashboardHero", (props, path, errors) => {
  if (
    !validatePropsShape(
      props,
      ["eyebrow", "title", "body", "modeLabel", "modeValue", "activeIntent"],
      path,
      errors,
    )
  ) {
    return false;
  }
  validateString(props.eyebrow, `${path}.eyebrow`, errors);
  validateString(props.title, `${path}.title`, errors);
  validateString(props.body, `${path}.body`, errors);
  validateString(props.modeLabel, `${path}.modeLabel`, errors);
  validateString(props.modeValue, `${path}.modeValue`, errors);
  validateString(props.activeIntent, `${path}.activeIntent`, errors);
  return true;
});

blockValidators.set("kpiGrid", (props, path, errors) => {
  if (!validatePropsShape(props, ["items"], path, errors)) {
    return false;
  }
  validateArray(props.items, `${path}.items`, errors, validateKpi);
  return true;
});

blockValidators.set("actionDock", (props, path, errors) => {
  if (!validatePropsShape(props, ["eyebrow", "title", "body", "actions"], path, errors)) {
    return false;
  }
  validateString(props.eyebrow, `${path}.eyebrow`, errors);
  validateString(props.title, `${path}.title`, errors);
  validateString(props.body, `${path}.body`, errors);
  validateArray(props.actions, `${path}.actions`, errors, validateActionCard);
  return true;
});

blockValidators.set("workspaceGrid", (props, path, errors) => {
  if (!validatePropsShape(props, ["columns"], path, errors)) {
    return false;
  }
  validateArray(props.columns, `${path}.columns`, errors, validateWorkspaceColumn);
  return true;
});

blockValidators.set("activityFeed", (props, path, errors) => {
  if (!validatePropsShape(props, ["eyebrow", "title", "items"], path, errors)) {
    return false;
  }
  validateString(props.eyebrow, `${path}.eyebrow`, errors);
  validateString(props.title, `${path}.title`, errors);
  validateArray(props.items, `${path}.items`, errors, validateActivityItem);
  return true;
});

blockValidators.set("notice", validateNoticeProps);

function validateBlock(block, path, errors) {
  if (!isPlainObject(block)) {
    pushError(errors, path, "expected block object");
    return false;
  }

  validateExactKeys(block, ["id", "type", "props"], path, errors);
  validateString(block.id, `${path}.id`, errors);
  const typeValid = validateEnum(block.type, blockTypeValues, `${path}.type`, errors);

  if (!typeValid) {
    return false;
  }

  const validator = blockValidators.get(block.type);
  return validator ? validator(block.props, `${path}.props`, errors) : false;
}

export function validateDuiSchema(schema) {
  const errors = [];

  if (!isPlainObject(schema)) {
    return {
      errors: ["schema: expected object"],
      ok: false,
    };
  }

  validateExactKeys(schema, ["version", "page", "meta", "blocks", "status"], "schema", errors);
  validateString(schema.version, "schema.version", errors);

  if (schema.version !== DUI_SCHEMA_VERSION) {
    pushError(errors, "schema.version", `expected ${DUI_SCHEMA_VERSION}`);
  }

  validateEnum(schema.page, pageValues, "schema.page", errors);
  validateMeta(schema.meta, "schema.meta", errors);
  validateArray(schema.blocks, "schema.blocks", errors, validateBlock);

  if (schema.status !== undefined) {
    validateNoticeProps(schema.status, "schema.status", errors);
  }

  return {
    errors,
    ok: errors.length === 0,
  };
}

export function assertValidDuiSchema(schema) {
  const result = validateDuiSchema(schema);

  if (!result.ok) {
    throw new Error(`Invalid DUI schema:\n${result.errors.join("\n")}`);
  }

  return schema;
}

export function createFallbackStatus({
  tone = "warning",
  title = "Safe fallback active",
  body = "The requested UI update could not be applied, so the last valid layout remains on screen.",
} = {}) {
  return { body, title, tone };
}

export function withStatus(schema, status) {
  return {
    ...schema,
    status,
  };
}

export function getRegisteredBlockTypes() {
  return Array.from(blockTypeValues);
}
