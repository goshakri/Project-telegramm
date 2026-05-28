function createElement(tagName, className, textContent = "") {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}

function appendChildren(parent, children) {
  children.forEach((child) => parent.append(child));
  return parent;
}

function createActionElement(action, className = "dui-button") {
  if (action.type === "link") {
    const link = createElement("a", className, action.label);
    link.href = action.href;
    return link;
  }

  const button = createElement("button", className, action.label);
  button.type = "button";
  button.dataset.intent = action.intent;
  if (action.payload !== undefined) {
    button.dataset.payload = JSON.stringify(action.payload);
  }
  return button;
}

function createSectionBase(block, ...classNames) {
  const section = createElement("section", ["dui-block", ...classNames].join(" ").trim());
  section.id = block.id;
  return section;
}

function renderMasthead(block) {
  const section = createSectionBase(block, "masthead");
  const bar = createElement("div", "masthead__bar");
  const brand = createElement("div", "masthead__brand");
  brand.append(
    createElement("span", "masthead__eyebrow", block.props.eyebrow),
    createElement("h1", "masthead__label", block.props.label),
  );

  const nav = createElement("nav", "masthead__nav");
  block.props.nav.forEach((item) => {
    nav.append(createActionElement(item, "masthead__link"));
  });

  bar.append(brand, nav, createActionElement(block.props.action, "dui-button dui-button--ghost"));
  section.append(bar);
  return section;
}

function renderHero(block) {
  const section = createSectionBase(block, `hero hero--${block.props.accent}`);
  const copy = createElement("div", "hero__copy");
  copy.append(
    createElement("span", "dui-eyebrow", block.props.eyebrow),
    createElement("h2", "hero__title", block.props.title),
    createElement("p", "hero__body", block.props.body),
  );

  const actions = createElement("div", "hero__actions");
  actions.append(
    createActionElement(block.props.primaryAction, "dui-button"),
    block.props.secondaryAction
      ? createActionElement(block.props.secondaryAction, "dui-button dui-button--secondary")
      : createElement("span", "dui-spacer"),
  );

  const metrics = createElement("div", "hero__metrics");
  block.props.metrics.forEach((metric) => {
    const card = createElement("article", "hero__metric");
    card.append(
      createElement("span", "hero__metric-label", metric.label),
      createElement("strong", "hero__metric-value", metric.value),
    );
    metrics.append(card);
  });

  copy.append(actions);
  section.append(copy, metrics);
  return section;
}

function renderStatStrip(block) {
  const section = createSectionBase(block, "stat-strip");
  block.props.items.forEach((item) => {
    const card = createElement("article", "stat-strip__card");
    card.append(
      createElement("span", "stat-strip__label", item.label),
      createElement("strong", "stat-strip__value", item.value),
      createElement("p", "stat-strip__detail", item.detail),
    );
    section.append(card);
  });
  return section;
}

function renderStoryGrid(block) {
  const section = createSectionBase(block, "story-grid");
  const header = createElement("div", "section-header");
  header.append(
    createElement("span", "dui-eyebrow", block.props.eyebrow),
    createElement("h2", "section-title", block.props.title),
  );
  const grid = createElement("div", "story-grid__cards");
  block.props.cards.forEach((cardItem) => {
    const card = createElement("article", `story-card story-card--${cardItem.tone}`);
    const link = createElement("a", "story-card__link");
    link.href = cardItem.href;
    link.append(
      createElement("span", "story-card__eyebrow", cardItem.eyebrow),
      createElement("h3", "story-card__title", cardItem.title),
      createElement("p", "story-card__body", cardItem.body),
    );
    card.append(link);
    grid.append(card);
  });
  section.append(header, grid);
  return section;
}

function renderTimeline(block) {
  const section = createSectionBase(block, "timeline");
  const header = createElement("div", "section-header");
  header.id = "pipeline";
  header.append(
    createElement("span", "dui-eyebrow", block.props.eyebrow),
    createElement("h2", "section-title", block.props.title),
  );
  const list = createElement("div", "timeline__list");
  block.props.items.forEach((item) => {
    const article = createElement("article", `timeline__item timeline__item--${item.tone}`);
    const rail = createElement("div", "timeline__rail");
    rail.append(createElement("span", "timeline__time", item.time));
    const card = createElement("div", "timeline__card");
    card.append(
      createElement("span", "timeline__kicker", item.kicker),
      createElement("h3", "timeline__title", item.title),
      createElement("p", "timeline__body", item.body),
    );
    article.append(rail, card);
    list.append(article);
  });
  section.append(header, list);
  return section;
}

function renderCtaBand(block) {
  const section = createSectionBase(block, "cta-band");
  const body = createElement("div", "cta-band__copy");
  body.append(
    createElement("h2", "cta-band__title", block.props.title),
    createElement("p", "cta-band__body", block.props.body),
  );
  const actions = createElement("div", "cta-band__actions");
  actions.append(
    createActionElement(block.props.primaryAction, "dui-button"),
    block.props.secondaryAction
      ? createActionElement(block.props.secondaryAction, "dui-button dui-button--secondary")
      : createElement("span", "dui-spacer"),
  );
  section.append(body, actions);
  return section;
}

function renderNotice(block) {
  const section = createSectionBase(block, `notice notice--${block.props.tone}`);
  section.append(
    createElement("strong", "notice__title", block.props.title),
    createElement("p", "notice__body", block.props.body),
  );
  return section;
}

function renderDashboardHero(block) {
  const section = createSectionBase(block, "dashboard-hero");
  const copy = createElement("div", "dashboard-hero__copy");
  copy.append(
    createElement("span", "dui-eyebrow", block.props.eyebrow),
    createElement("h2", "dashboard-hero__title", block.props.title),
    createElement("p", "dashboard-hero__body", block.props.body),
  );

  const rail = createElement("aside", "dashboard-hero__rail");
  const modeCard = createElement("div", "dashboard-hero__mode");
  modeCard.append(
    createElement("span", "dashboard-hero__mode-label", block.props.modeLabel),
    createElement("strong", "dashboard-hero__mode-value", block.props.modeValue),
    createElement("p", "dashboard-hero__mode-intent", block.props.activeIntent),
  );
  rail.append(modeCard);
  section.append(copy, rail);
  return section;
}

function renderKpiGrid(block) {
  const section = createSectionBase(block, "kpi-grid");
  block.props.items.forEach((item) => {
    const article = createElement("article", `kpi-card kpi-card--${item.emphasis}`);
    article.append(
      createElement("span", "kpi-card__label", item.label),
      createElement("strong", "kpi-card__value", item.value),
      createElement("p", "kpi-card__delta", item.delta),
    );
    section.append(article);
  });
  return section;
}

function renderActionDock(block) {
  const section = createSectionBase(block, "action-dock");
  section.id = "actions";
  const header = createElement("div", "section-header");
  header.append(
    createElement("span", "dui-eyebrow", block.props.eyebrow),
    createElement("h2", "section-title", block.props.title),
    createElement("p", "section-body", block.props.body),
  );
  const actions = createElement("div", "action-dock__grid");
  block.props.actions.forEach((action) => {
    const article = createElement("article", `action-card action-card--${action.tone}`);
    article.append(
      createElement("strong", "action-card__title", action.label),
      createElement("p", "action-card__body", action.description),
      appendChildren(createElement("div", "action-card__footer"), [
        createActionElement(
          { intent: action.intent, label: action.label, type: "intent" },
          "dui-chip",
        ),
      ]),
    );
    actions.append(article);
  });
  section.append(header, actions);
  return section;
}

function renderWorkspaceGrid(block) {
  const section = createSectionBase(block, "workspace-grid");
  section.id = "workspace";
  block.props.columns.forEach((column) => {
    const article = createElement("section", "workspace-column");
    article.append(
      createElement("span", "workspace-column__eyebrow", column.eyebrow),
      createElement("h3", "workspace-column__title", column.title),
    );
    const cards = createElement("div", "workspace-column__cards");
    column.cards.forEach((cardItem) => {
      const card = createElement("article", `workspace-card workspace-card--${cardItem.tone}`);
      const tagList = createElement("div", "workspace-card__tags");
      cardItem.tags.forEach((tag) => {
        tagList.append(createElement("span", "workspace-card__tag", tag));
      });
      card.append(
        createElement("span", "workspace-card__meta", cardItem.meta),
        createElement("h4", "workspace-card__title", cardItem.title),
        createElement("p", "workspace-card__body", cardItem.body),
        createElement("strong", "workspace-card__state", cardItem.state),
        tagList,
      );
      if (cardItem.action) {
        card.append(createActionElement(cardItem.action, "dui-button dui-button--small"));
      }
      cards.append(card);
    });
    article.append(cards);
    section.append(article);
  });
  return section;
}

function renderActivityFeed(block) {
  const section = createSectionBase(block, "activity-feed");
  section.id = "activity";
  const header = createElement("div", "section-header");
  header.append(
    createElement("span", "dui-eyebrow", block.props.eyebrow),
    createElement("h2", "section-title", block.props.title),
  );
  const list = createElement("div", "activity-feed__list");
  block.props.items.forEach((item) => {
    const article = createElement("article", `activity-item activity-item--${item.tone}`);
    article.append(
      createElement("span", "activity-item__time", item.time),
      createElement("h3", "activity-item__title", item.title),
      createElement("p", "activity-item__body", item.body),
    );
    list.append(article);
  });
  section.append(header, list);
  return section;
}

export const duiRegistry = Object.freeze({
  actionDock: renderActionDock,
  activityFeed: renderActivityFeed,
  ctaBand: renderCtaBand,
  dashboardHero: renderDashboardHero,
  hero: renderHero,
  kpiGrid: renderKpiGrid,
  masthead: renderMasthead,
  notice: renderNotice,
  statStrip: renderStatStrip,
  storyGrid: renderStoryGrid,
  timeline: renderTimeline,
  workspaceGrid: renderWorkspaceGrid,
});

export function renderBlock(block) {
  const renderer = duiRegistry[block.type];
  if (!renderer) {
    throw new Error(`Renderer not found for block type "${block.type}"`);
  }
  return renderer(block);
}
