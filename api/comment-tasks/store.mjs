import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const defaultStorePath = path.join(projectRoot, "data", "comment-tasks.json");

const VALID_STATUSES = new Set([
  "pending",
  "sent_to_user",
  "opened",
  "posted",
  "skipped",
]);

export function getCommentTaskStorePath() {
  return process.env.COMMENT_TASKS_FILE
    ? path.resolve(process.env.COMMENT_TASKS_FILE)
    : defaultStorePath;
}

function normalizeAssignees(assignees) {
  if (!assignees || typeof assignees !== "object" || Array.isArray(assignees)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(assignees).map(([id, assignee]) => [
      id,
      {
        name: String(assignee?.name ?? id),
        telegramChatId: String(assignee?.telegramChatId ?? ""),
        role: assignee?.role ? String(assignee.role) : undefined,
        kind: assignee?.kind ? String(assignee.kind) : undefined,
      },
    ]),
  );
}

function mergeAssignees(nextAssignees, currentAssignees = {}) {
  const normalizedNext = normalizeAssignees(nextAssignees);
  const normalizedCurrent = normalizeAssignees(currentAssignees);
  const merged = { ...normalizedCurrent };

  for (const [id, assignee] of Object.entries(normalizedNext)) {
    merged[id] = {
      ...assignee,
      telegramChatId: assignee.telegramChatId || normalizedCurrent[id]?.telegramChatId || "",
      role: assignee.role || normalizedCurrent[id]?.role || "",
      kind: assignee.kind || normalizedCurrent[id]?.kind || "",
    };
  }

  return merged;
}

function normalizeChannel(channel) {
  return {
    chatId: String(channel?.chatId ?? ""),
    username: String(channel?.username ?? ""),
  };
}

function normalizePublishedPost(post, index) {
  return {
    id: String(post?.id ?? `post-${String(index + 1).padStart(3, "0")}`),
    chatId: String(post?.chatId ?? ""),
    messageId: post?.messageId ? Number(post.messageId) : null,
    url: String(post?.url ?? ""),
    text: String(post?.text ?? ""),
    publishedAt: String(post?.publishedAt ?? ""),
  };
}

function normalizeTask(task, index) {
  const id = String(task?.id ?? `task-${String(index + 1).padStart(3, "0")}`);
  const status = VALID_STATUSES.has(task?.status) ? task.status : "pending";

  return {
    id,
    assignee: String(task?.assignee ?? ""),
    postUrl: String(task?.postUrl ?? ""),
    postLabel: String(task?.postLabel ?? ""),
    comment: String(task?.comment ?? ""),
    role: String(task?.role ?? ""),
    status,
    dueAt: String(task?.dueAt ?? ""),
    notes: String(task?.notes ?? ""),
    notifiedAt: task?.notifiedAt ? String(task.notifiedAt) : undefined,
    postedAt: task?.postedAt ? String(task.postedAt) : undefined,
    skippedAt: task?.skippedAt ? String(task.skippedAt) : undefined,
  };
}

export function normalizeTaskStore(input) {
  const tasks = Array.isArray(input?.tasks) ? input.tasks : [];
  const publishedPosts = Array.isArray(input?.publishedPosts) ? input.publishedPosts : [];

  return {
    assignees: normalizeAssignees(input?.assignees),
    channel: normalizeChannel(input?.channel),
    publishedPosts: publishedPosts.map(normalizePublishedPost),
    tasks: tasks.map(normalizeTask),
  };
}

export async function readCommentTaskStore() {
  const raw = await readFile(getCommentTaskStorePath(), "utf8");
  return normalizeTaskStore(JSON.parse(raw));
}

export async function writeCommentTaskStore(nextStore) {
  const storePath = getCommentTaskStorePath();
  const normalized = normalizeTaskStore(nextStore);

  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(`${storePath}.tmp`, `${JSON.stringify(normalized, null, 2)}\n`);
  await rename(`${storePath}.tmp`, storePath);

  return normalized;
}

export async function importCommentTaskStore(nextStore) {
  const currentStore = await readCommentTaskStore();

  return await writeCommentTaskStore({
    ...nextStore,
    assignees: mergeAssignees(nextStore.assignees, currentStore.assignees),
    channel: nextStore.channel ?? currentStore.channel,
    publishedPosts: nextStore.publishedPosts ?? currentStore.publishedPosts,
  });
}

export async function updateTaskStatus(taskId, status) {
  if (!VALID_STATUSES.has(status)) {
    const error = new Error(`Unsupported task status: ${status}`);
    error.statusCode = 400;
    throw error;
  }

  const store = await readCommentTaskStore();
  const task = store.tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    const error = new Error(`Task not found: ${taskId}`);
    error.statusCode = 404;
    throw error;
  }

  task.status = status;
  const now = new Date().toISOString();

  if (status === "sent_to_user") {
    task.notifiedAt = now;
  }

  if (status === "posted") {
    task.postedAt = now;
  }

  if (status === "skipped") {
    task.skippedAt = now;
  }

  await writeCommentTaskStore(store);
  return task;
}

export async function updateAssigneeChatId(assigneeId, telegramChatId) {
  const store = await readCommentTaskStore();
  const assignee = store.assignees[assigneeId];

  if (!assignee) {
    const error = new Error(`Assignee not found: ${assigneeId}`);
    error.statusCode = 404;
    throw error;
  }

  assignee.telegramChatId = String(telegramChatId ?? "").trim();
  await writeCommentTaskStore(store);

  return assignee;
}

export async function updateAssignee(assigneeId, patch) {
  const store = await readCommentTaskStore();
  const assignee = store.assignees[assigneeId];

  if (!assignee) {
    const error = new Error(`Assignee not found: ${assigneeId}`);
    error.statusCode = 404;
    throw error;
  }

  store.assignees[assigneeId] = {
    ...assignee,
    name: patch.name === undefined ? assignee.name : String(patch.name),
    telegramChatId:
      patch.telegramChatId === undefined
        ? assignee.telegramChatId
        : String(patch.telegramChatId ?? "").trim(),
    role: patch.role === undefined ? assignee.role : String(patch.role ?? "").trim(),
    kind: patch.kind === undefined ? assignee.kind : String(patch.kind ?? "").trim(),
  };

  await writeCommentTaskStore(store);
  return store.assignees[assigneeId];
}

export async function autoAssignTasksByRole() {
  const store = await readCommentTaskStore();
  const counters = new Map();
  let updated = 0;

  for (const task of store.tasks) {
    if (task.assignee || !task.role) {
      continue;
    }

    const candidates = Object.entries(store.assignees).filter(([, assignee]) => assignee.role === task.role);

    if (candidates.length === 0) {
      continue;
    }

    const nextIndex = counters.get(task.role) ?? 0;
    const [assigneeId] = candidates[nextIndex % candidates.length];
    counters.set(task.role, nextIndex + 1);
    task.assignee = assigneeId;
    updated += 1;
  }

  await writeCommentTaskStore(store);
  return { updated };
}

export async function updateChannelConfig(channel) {
  const store = await readCommentTaskStore();

  store.channel = normalizeChannel({
    ...store.channel,
    ...channel,
  });

  await writeCommentTaskStore(store);
  return store.channel;
}

export async function addPublishedPost(post) {
  const store = await readCommentTaskStore();
  const publishedPost = normalizePublishedPost(
    {
      id: `post-${Date.now()}`,
      publishedAt: new Date().toISOString(),
      ...post,
    },
    store.publishedPosts.length,
  );

  store.publishedPosts = [publishedPost, ...store.publishedPosts].slice(0, 50);
  await writeCommentTaskStore(store);

  return publishedPost;
}

export async function applyPostUrlToTasks({ postUrl, postLabel = "" }) {
  const store = await readCommentTaskStore();
  let updated = 0;

  for (const task of store.tasks) {
    const labelMatches = postLabel ? task.postLabel === postLabel : true;

    if (labelMatches && !task.postUrl) {
      task.postUrl = String(postUrl ?? "");
      updated += 1;
    }
  }

  await writeCommentTaskStore(store);
  return { updated };
}
