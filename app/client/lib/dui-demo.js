export const DUI_SCHEMA_VERSION = "1.0";

const dashboardActionCatalog = [
  {
    description: "Collapse the work queue into the smallest set of launch-critical moves.",
    intent: "tighten-queue",
    label: "Tighten Queue",
    tone: "mint",
  },
  {
    description: "Move capacity toward the signals that are accelerating this week.",
    intent: "rebalance-capacity",
    label: "Rebalance Capacity",
    tone: "violet",
  },
  {
    description: "Package the current state into a clean leadership-ready brief.",
    intent: "ship-brief",
    label: "Ship Brief",
    tone: "yellow",
  },
  {
    description: "Surface blockers, edge risk, and confidence drift before review.",
    intent: "surface-risk",
    label: "Surface Risk",
    tone: "rose",
  },
];

function linkAction(label, href) {
  return {
    href,
    label,
    type: "link",
  };
}

function intentAction(label, intent, payload = undefined) {
  return {
    intent,
    label,
    payload,
    type: "intent",
  };
}

export function createLandingSchema() {
  return {
    version: DUI_SCHEMA_VERSION,
    page: "landing",
    meta: {
      description:
        "Dynamic User Interface turns intent into interface changes instead of conversations.",
      title: "Dynamic User Interface",
    },
    blocks: [
      {
        id: "landing-masthead",
        type: "masthead",
        props: {
          action: linkAction("Open Dashboard", "/dashboard"),
          eyebrow: "Schema-first product demo",
          label: "DUI",
          nav: [
            linkAction("Why now", "#landing-story-grid"),
            linkAction("Hidden AI", "#landing-timeline"),
            linkAction("Pipeline", "#landing-cta"),
          ],
        },
      },
      {
        id: "landing-hero",
        type: "hero",
        props: {
          accent: "mint",
          body:
            "Dynamic User Interface treats AI like a production system inside the product surface. No blank prompt box. No waiting for prose. Buttons, cards, states, and priorities recompose themselves around the next best action.",
          eyebrow: "Dynamic User Interface",
          metrics: [
            { label: "Render policy", value: "Whitelist only" },
            { label: "Update path", value: "JSON schema" },
            { label: "UX model", value: "Actions over chat" },
          ],
          primaryAction: linkAction("See the dashboard", "/dashboard"),
          secondaryAction: linkAction("Read the pipeline", "#pipeline"),
          title:
            "The interface should move with the user, not wait for the user to write a prompt.",
        },
      },
      {
        id: "landing-stats",
        type: "statStrip",
        props: {
          items: [
            {
              detail: "Every UI change is described as a finite schema, not arbitrary markup.",
              label: "Schema authority",
              value: "1 source",
            },
            {
              detail: "The assistant is embedded in actions, suggestions, and transformed work states.",
              label: "Visible chat panels",
              value: "0",
            },
            {
              detail: "Unknown blocks are rejected before they ever touch the DOM.",
              label: "Unsafe renders",
              value: "Blocked",
            },
          ],
        },
      },
      {
        id: "landing-story-grid",
        type: "storyGrid",
        props: {
          cards: [
            {
              body:
                "Product teams can model UI as versioned schema and let the runtime recompose priority, density, and tone in response to intent.",
              eyebrow: "For builders",
              href: "/dashboard",
              title: "Ship new interface states without shipping a new navigation paradigm.",
              tone: "violet",
            },
            {
              body:
                "The AI is still there. It just behaves like leverage inside the workflow: condense backlog, rewrite next step, surface risk, package a brief.",
              eyebrow: "For operators",
              href: "/dashboard",
              title: "Replace the chat tab with direct, local, high-confidence actions.",
              tone: "yellow",
            },
            {
              body:
                "Safety is part of the interaction model: strict contracts, finite component registry, graceful fallback when a response is off-contract.",
              eyebrow: "For engineers",
              href: "#pipeline",
              title: "Keep adaptive UI auditable, constrained, and easy to test.",
              tone: "slate",
            },
          ],
          eyebrow: "Why DUI is different",
          title: "A UI system that can adapt without becoming a chat product.",
        },
      },
      {
        id: "landing-timeline",
        type: "timeline",
        props: {
          eyebrow: "Pipeline",
          items: [
            {
              body:
                "A user chooses a task-level action like rebalance, condense, or package. The signal comes from a button, chip, or card state, not a text box.",
              kicker: "Intent capture",
              time: "01",
              title: "Actions are the prompt surface.",
              tone: "mint",
            },
            {
              body:
                "The backend returns a typed schema. The client validates version, page, block types, and every prop shape before render.",
              kicker: "Contract boundary",
              time: "02",
              title: "JSON is the only language crossing the line.",
              tone: "violet",
            },
            {
              body:
                "The runtime swaps blocks, cards, and status rails in-place. The interface changes form, not just text content.",
              kicker: "Render pass",
              time: "03",
              title: "The product state visibly reorients around the chosen goal.",
              tone: "yellow",
            },
            {
              body:
                "If the schema is invalid or unsupported, the last good layout stays live and the UI shows an explicit fallback notice.",
              kicker: "Safety rail",
              time: "04",
              title: "Failure downgrades gracefully instead of crashing the surface.",
              tone: "rose",
            },
          ],
          title: "Schema-first runtime, not free-form agent output.",
        },
      },
      {
        id: "landing-cta",
        type: "ctaBand",
        props: {
          body:
            "Open the mock operating surface and trigger a few one-click transformations. The system will reorganize blocks through a validated JSON pipeline.",
          primaryAction: linkAction("Launch dashboard", "/dashboard"),
          secondaryAction: linkAction("Jump to timeline", "#landing-timeline"),
          title: "See hidden-AI UX in a working surface.",
        },
      },
    ],
  };
}

function createWorkspaceColumns(mode) {
  const baseColumns = {
    focus: {
      eyebrow: "Focus lane",
      title: "Launch work",
      cards: [],
    },
    signals: {
      eyebrow: "Signals",
      title: "Market shifts",
      cards: [],
    },
    output: {
      eyebrow: "Output",
      title: "Ready to ship",
      cards: [],
    },
  };

  if (mode === "tighten-queue") {
    baseColumns.focus.cards = [
      {
        title: "Homepage framing locked",
        meta: "Critical path",
        body: "Fold three parallel experiments into one launch story and remove side quests from this week.",
        state: "Condensed",
        tags: ["Scope", "Messaging"],
        tone: "mint",
        action: intentAction("Package the brief", "ship-brief"),
      },
      {
        title: "Dashboard actions reduced",
        meta: "Operator surface",
        body: "Keep only the moves that materially change shipping posture and confidence visibility.",
        state: "Streamlined",
        tags: ["Workflow", "Priority"],
        tone: "slate",
      },
    ];
    baseColumns.signals.cards = [
      {
        title: "Reviewer latency trending up",
        meta: "Needs mitigation",
        body: "Review cycles are slipping two days behind the decision cadence. Compress review asks into one pass.",
        state: "Watch",
        tags: ["Ops", "Latency"],
        tone: "rose",
        action: intentAction("Surface risk", "surface-risk"),
      },
    ];
    baseColumns.output.cards = [
      {
        title: "Leadership brief stubbed",
        meta: "Ready next",
        body: "Key message, blockers, and confidence deltas are prepared for one-click packaging.",
        state: "Primed",
        tags: ["Briefing", "Exec"],
        tone: "yellow",
        action: intentAction("Generate brief", "ship-brief"),
      },
    ];
    return Object.values(baseColumns);
  }

  if (mode === "rebalance-capacity") {
    baseColumns.focus.cards = [
      {
        title: "Reassign reviewer bandwidth",
        meta: "Capacity shift",
        body: "Move one reviewer from backlog clean-up into launch validation to unblock the top funnel.",
        state: "Reallocated",
        tags: ["Capacity", "Launch"],
        tone: "violet",
      },
      {
        title: "Cut one non-critical experiment",
        meta: "Tradeoff made",
        body: "Free execution room for the two moves that directly affect conversion narrative and review throughput.",
        state: "Dropped",
        tags: ["Tradeoff", "Execution"],
        tone: "slate",
      },
    ];
    baseColumns.signals.cards = [
      {
        title: "Demand cluster moved to onboarding",
        meta: "New insight",
        body: "Users are asking for clearer first-run outcomes. Shift design cycles toward onboarding proof.",
        state: "Rising",
        tags: ["Demand", "Onboarding"],
        tone: "mint",
      },
      {
        title: "Activation copy underperforming",
        meta: "Requires copy pass",
        body: "The top CTA is drawing attention but not communicating what changes after the click.",
        state: "Action needed",
        tags: ["Conversion", "Copy"],
        tone: "yellow",
      },
    ];
    baseColumns.output.cards = [
      {
        title: "Reprioritized sprint board",
        meta: "Shared state",
        body: "Current team shape, owners, and impact tradeoffs are condensed into a new operating plan.",
        state: "Updated",
        tags: ["Planning", "Ops"],
        tone: "violet",
        action: intentAction("Package the brief", "ship-brief"),
      },
    ];
    return Object.values(baseColumns);
  }

  if (mode === "ship-brief") {
    baseColumns.focus.cards = [
      {
        title: "Narrative summary generated",
        meta: "Leadership ready",
        body: "The product story now compresses UI rationale, risks, and immediate asks into one concise artifact.",
        state: "Packaged",
        tags: ["Narrative", "Launch"],
        tone: "yellow",
      },
    ];
    baseColumns.signals.cards = [
      {
        title: "Confidence drift called out",
        meta: "Included",
        body: "Review latency and scope compression are carried forward as explicit watchouts in the brief.",
        state: "Included",
        tags: ["Risk", "Comms"],
        tone: "rose",
      },
    ];
    baseColumns.output.cards = [
      {
        title: "Executive brief",
        meta: "One-click export",
        body: "What changed, what matters, and what decision is needed are now grouped into a delivery-ready card.",
        state: "Ready",
        tags: ["Exec", "Summary"],
        tone: "mint",
        action: intentAction("Rebalance capacity", "rebalance-capacity"),
      },
      {
        title: "Slack-ready update",
        meta: "Team sync",
        body: "A tighter summary is prepared for the team channel so execution aligns with the new operating shape.",
        state: "Ready",
        tags: ["Team", "Sync"],
        tone: "slate",
      },
    ];
    return Object.values(baseColumns);
  }

  if (mode === "surface-risk") {
    baseColumns.focus.cards = [
      {
        title: "Scope creep above tolerance",
        meta: "Highest risk",
        body: "New asks are entering the sprint without displacing old work. Freeze additions until launch scope is explicit.",
        state: "Escalate",
        tags: ["Scope", "Governance"],
        tone: "rose",
      },
      {
        title: "Fallback path verified",
        meta: "Mitigation",
        body: "Invalid schema responses keep the last good render live, preventing the UI from collapsing during demos.",
        state: "Protected",
        tags: ["Runtime", "Safety"],
        tone: "mint",
      },
    ];
    baseColumns.signals.cards = [
      {
        title: "Review confidence fell 12%",
        meta: "Trend alert",
        body: "Confidence slipped as reviewers lost a single source of truth. Package one brief and one queue, not five views.",
        state: "Trending down",
        tags: ["Confidence", "Review"],
        tone: "yellow",
      },
    ];
    baseColumns.output.cards = [
      {
        title: "Risk memo drafted",
        meta: "Leadership escalation",
        body: "The system pulled the blockers, mitigations, and required decisions into one visible lane.",
        state: "Drafted",
        tags: ["Risk", "Escalation"],
        tone: "violet",
        action: intentAction("Package the brief", "ship-brief"),
      },
    ];
    return Object.values(baseColumns);
  }

  baseColumns.focus.cards = [
    {
      title: "Shape the launch story",
      meta: "Default mode",
      body: "The surface starts in a broad editorial layout, then tightens around whichever action the operator chooses.",
      state: "Open",
      tags: ["Narrative", "Launch"],
      tone: "mint",
      action: intentAction("Tighten queue", "tighten-queue"),
    },
    {
      title: "Triage operator actions",
      meta: "Ready for automation",
      body: "Suggestion chips represent likely next moves. Choosing one transforms the rest of the interface.",
      state: "Suggested",
      tags: ["Workflow", "AI"],
      tone: "slate",
    },
  ];
  baseColumns.signals.cards = [
    {
      title: "Review pace is stable",
      meta: "Healthy",
      body: "Decision throughput is acceptable, but the system can still tighten the queue before a stakeholder pass.",
      state: "Stable",
      tags: ["Review", "Pace"],
      tone: "violet",
    },
    {
      title: "Copy clarity is improving",
      meta: "Signal",
      body: "Users respond to concrete outcome language. The hidden-AI actions should keep reinforcing that framing.",
      state: "Up",
      tags: ["Copy", "Signal"],
      tone: "yellow",
    },
  ];
  baseColumns.output.cards = [
    {
      title: "No brief generated yet",
      meta: "Awaiting action",
      body: "Package the current state into an exec-facing summary when you're ready to compress the room.",
      state: "Idle",
      tags: ["Summary", "Exec"],
      tone: "rose",
      action: intentAction("Ship brief", "ship-brief"),
    },
  ];
  return Object.values(baseColumns);
}

const dashboardModeMap = {
  baseline: {
    activeIntent: "Awaiting operator move",
    feedTone: "slate",
    heroBody:
      "This dashboard hides the AI in the controls. Buttons mutate density, sequencing, and delivery posture without opening a chat pane.",
    kpis: [
      { delta: "+18%", emphasis: "mint", label: "Decision velocity", value: "6.2h" },
      { delta: "Stable", emphasis: "violet", label: "Launch confidence", value: "74%" },
      { delta: "3 queued", emphasis: "yellow", label: "Review bundles", value: "12" },
    ],
    modeLabel: "Current operating mode",
    modeValue: "Wide-angle orchestration",
    notice: {
      body: "Choose a move and the surface will recompose around it. The AI stays in the action layer.",
      title: "Hidden-AI UX is live",
      tone: "neutral",
    },
    timeline: [
      {
        body: "The dashboard is carrying a broad view: launch work, signals, and output readiness are all visible at once.",
        time: "Now",
        title: "Default composition loaded",
        tone: "slate",
      },
      {
        body: "Next actions are rendered as direct controls, not as suggestions in a side chat.",
        time: "-",
        title: "Four likely moves available",
        tone: "mint",
      },
    ],
  },
  "tighten-queue": {
    activeIntent: "Queue condensed around the launch path",
    feedTone: "mint",
    heroBody:
      "The surface dropped peripheral work, pulled forward the critical cards, and left only launch-shaping actions on the rail.",
    kpis: [
      { delta: "-41%", emphasis: "mint", label: "Open work surface", value: "7 cards" },
      { delta: "+9 pts", emphasis: "yellow", label: "Priority clarity", value: "88%" },
      { delta: "1 pass", emphasis: "violet", label: "Review bundle size", value: "Compact" },
    ],
    modeLabel: "Current operating mode",
    modeValue: "Launch-path compression",
    notice: {
      body: "Non-critical work was collapsed into one watch lane. The dashboard is now optimized for the next shipping conversation.",
      title: "Queue tightened",
      tone: "success",
    },
    timeline: [
      {
        body: "Critical-path cards moved to the top of the workspace and duplicate review surfaces were removed.",
        time: "00:14",
        title: "Queue condensed",
        tone: "mint",
      },
      {
        body: "One follow-up action remains: package the brief once the launch story is locked.",
        time: "00:15",
        title: "Next move sharpened",
        tone: "yellow",
      },
    ],
  },
  "rebalance-capacity": {
    activeIntent: "Capacity reallocated toward demand signals",
    feedTone: "violet",
    heroBody:
      "The dashboard shifted execution weight away from maintenance work and toward the signals that most affect onboarding and launch clarity.",
    kpis: [
      { delta: "+2 owners", emphasis: "violet", label: "Capacity on launch", value: "5" },
      { delta: "-1 experiment", emphasis: "rose", label: "Deferred side work", value: "1" },
      { delta: "+11%", emphasis: "mint", label: "Signal response", value: "Faster" },
    ],
    modeLabel: "Current operating mode",
    modeValue: "Demand-weighted planning",
    notice: {
      body: "The system moved people and attention to the work with the clearest product signal.",
      title: "Capacity rebalanced",
      tone: "success",
    },
    timeline: [
      {
        body: "The launch lane gained reviewer support while one non-critical experiment was removed from this cycle.",
        time: "00:27",
        title: "Execution weight shifted",
        tone: "violet",
      },
      {
        body: "Onboarding and conversion messaging are now the leading surface priorities.",
        time: "00:28",
        title: "Signals took control",
        tone: "mint",
      },
    ],
  },
  "ship-brief": {
    activeIntent: "State packaged for leadership and team sync",
    feedTone: "yellow",
    heroBody:
      "The UI reorganized around communication output. Decisions, blockers, and confidence notes are grouped into delivery-ready artifacts.",
    kpis: [
      { delta: "Ready", emphasis: "yellow", label: "Leadership brief", value: "1" },
      { delta: "Ready", emphasis: "mint", label: "Team updates", value: "2" },
      { delta: "-58%", emphasis: "violet", label: "Context overhead", value: "Lower" },
    ],
    modeLabel: "Current operating mode",
    modeValue: "Briefing and rollout",
    notice: {
      body: "A concise operating summary is ready. The surface is now organized for distribution rather than exploration.",
      title: "Brief packaged",
      tone: "success",
    },
    timeline: [
      {
        body: "The dashboard converted live operating detail into a brief for decision-makers and a shorter sync for the team.",
        time: "00:41",
        title: "Communication bundle created",
        tone: "yellow",
      },
      {
        body: "Risks and mitigations remain attached so the brief carries context, not just optimism.",
        time: "00:42",
        title: "Risk context retained",
        tone: "rose",
      },
    ],
  },
  "surface-risk": {
    activeIntent: "Risk lane expanded",
    feedTone: "rose",
    heroBody:
      "The surface prioritizes scope drift, review confidence, and runtime safety. Everything unrelated to risk visibility falls back.",
    kpis: [
      { delta: "High", emphasis: "rose", label: "Scope pressure", value: "3 alerts" },
      { delta: "-12%", emphasis: "yellow", label: "Review confidence", value: "Down" },
      { delta: "Protected", emphasis: "mint", label: "Runtime fallback", value: "Live" },
    ],
    modeLabel: "Current operating mode",
    modeValue: "Risk exposure",
    notice: {
      body: "The layout is now optimized for review and escalation, not for exploration. Mitigations are pinned next to the blockers.",
      title: "Risk surfaced",
      tone: "warning",
    },
    timeline: [
      {
        body: "Scope pressure and review confidence drift were pulled into the first screen and cross-linked to mitigations.",
        time: "00:33",
        title: "Risk lane expanded",
        tone: "rose",
      },
      {
        body: "Fallback protection remains visible to reinforce that adaptive UI must degrade safely.",
        time: "00:34",
        title: "Safety rail confirmed",
        tone: "mint",
      },
    ],
  },
};

export function createDashboardSchema(mode = "baseline") {
  const modeConfig = dashboardModeMap[mode] ?? dashboardModeMap.baseline;

  return {
    version: DUI_SCHEMA_VERSION,
    page: "dashboard",
    meta: {
      description: "Hidden-AI operating surface driven by validated DUI schemas.",
      title: "Dynamic User Interface Dashboard",
    },
    status: modeConfig.notice,
    blocks: [
      {
        id: "dashboard-masthead",
        type: "masthead",
        props: {
          action: linkAction("Back to landing", "/"),
          eyebrow: "Hidden-AI operating surface",
          label: "DUI / Dashboard",
          nav: [
            linkAction("Actions", "#actions"),
            linkAction("Workspace", "#workspace"),
            linkAction("Activity", "#activity"),
          ],
        },
      },
      {
        id: "dashboard-hero",
        type: "dashboardHero",
        props: {
          activeIntent: modeConfig.activeIntent,
          body: modeConfig.heroBody,
          eyebrow: "Mock command surface",
          modeLabel: modeConfig.modeLabel,
          modeValue: modeConfig.modeValue,
          title: "AI is hidden in the controls, not exposed as a conversation.",
        },
      },
      {
        id: "dashboard-kpis",
        type: "kpiGrid",
        props: {
          items: modeConfig.kpis,
        },
      },
      {
        id: "dashboard-actions",
        type: "actionDock",
        props: {
          actions: dashboardActionCatalog,
          body:
            "Each move requests a new validated schema from the mock intent API. The UI visibly changes shape around the chosen objective.",
          eyebrow: "One-click transformations",
          title: "Choose the next operating posture.",
        },
      },
      {
        id: "dashboard-workspace",
        type: "workspaceGrid",
        props: {
          columns: createWorkspaceColumns(mode),
        },
      },
      {
        id: "dashboard-activity",
        type: "activityFeed",
        props: {
          eyebrow: "Activity rail",
          items: modeConfig.timeline,
          title: "Latest recomposition events",
        },
      },
    ],
  };
}

export function resolveIntentRequest(intentRequest) {
  const intent = intentRequest?.intent;

  if (intentRequest?.page !== "dashboard") {
    return {
      code: 422,
      payload: {
        fallbackMessage: "This MVP only supports dashboard intent transforms.",
        ok: false,
        error: "unsupported_page",
      },
    };
  }

  if (!dashboardModeMap[intent]) {
    return {
      code: 422,
      payload: {
        fallbackMessage: "The requested UI transformation is not registered.",
        ok: false,
        error: "unknown_intent",
      },
    };
  }

  return {
    code: 200,
    payload: {
      ok: true,
      schema: createDashboardSchema(intent),
      ui: {
        intent,
        label: dashboardActionCatalog.find((action) => action.intent === intent)?.label ?? intent,
      },
    },
  };
}
