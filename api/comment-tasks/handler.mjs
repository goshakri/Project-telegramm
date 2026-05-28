import {
  addPublishedPost,
  applyPostUrlToTasks,
  autoAssignTasksByRole,
  importCommentTaskStore,
  readCommentTaskStore,
  updateAssignee,
  updateAssigneeChatId,
  updateChannelConfig,
  updateTaskStatus,
} from "./store.mjs";

const MAX_BODY_BYTES = 1_000_000;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  let received = 0;

  for await (const chunk of request) {
    received += chunk.length;

    if (received > MAX_BODY_BYTES) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }

    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function createTaskMessage(task, assignee) {
  const name = assignee?.name ?? task.assignee;
  const postLine = task.postUrl
    ? `Пост: ${task.postUrl}`
    : task.postLabel
      ? `Пост: ${task.postLabel}`
      : "";

  return [
    `Задание для ${name}`,
    "",
    "Опубликуй этот комментарий вручную со своего Telegram-аккаунта:",
    "",
    task.comment,
    "",
    postLine,
    task.dueAt ? `Дедлайн: ${task.dueAt}` : "",
    task.notes ? `Заметка: ${task.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendTelegramMessage(chatId, text, options = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return {
      ok: false,
      skipped: true,
      reason: "TELEGRAM_BOT_TOKEN is not configured.",
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: false,
      ...options,
      text,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
  const payload = await response.json().catch(() => null);

  return {
    ok: response.ok && Boolean(payload?.ok),
    status: response.status,
    payload,
  };
}

async function callTelegramApi(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return {
      ok: false,
      skipped: true,
      reason: "TELEGRAM_BOT_TOKEN is not configured.",
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    body: payload ? JSON.stringify(payload) : undefined,
    headers: payload
      ? {
          "content-type": "application/json",
        }
      : undefined,
    method: payload ? "POST" : "GET",
  });
  const body = await response.json().catch(() => null);

  return {
    ok: response.ok && Boolean(body?.ok),
    status: response.status,
    payload: body,
  };
}

function summarizeUpdates(updates) {
  const chats = new Map();

  for (const update of updates) {
    const message =
      update.message ??
      update.channel_post ??
      update.edited_message ??
      update.edited_channel_post ??
      update.my_chat_member;
    const chat = message?.chat;

    if (!chat?.id) {
      continue;
    }

    chats.set(String(chat.id), {
      id: String(chat.id),
      title: chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(" ") ?? "",
      type: chat.type,
      username: chat.username ? `@${chat.username}` : "",
    });
  }

  return [...chats.values()];
}

function normalizeChannelTarget(channel) {
  const chatId = String(channel?.chatId ?? "").trim();
  const username = String(channel?.username ?? "").trim();

  if (chatId) {
    return chatId;
  }

  if (!username) {
    const error = new Error("Channel chatId or username is required.");
    error.statusCode = 400;
    throw error;
  }

  return username.startsWith("@") ? username : `@${username}`;
}

function createTelegramPostUrl(channel, messageId) {
  const username = String(channel?.username ?? "").trim().replace(/^@/, "");
  const chatId = String(channel?.chatId ?? "").trim();

  if (username) {
    return `https://t.me/${username}/${messageId}`;
  }

  if (chatId.startsWith("-100")) {
    return `https://t.me/c/${chatId.slice(4)}/${messageId}`;
  }

  return "";
}

async function notifyTask(taskId) {
  const store = await readCommentTaskStore();
  const task = store.tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    const error = new Error(`Task not found: ${taskId}`);
    error.statusCode = 404;
    throw error;
  }

  const assignee = store.assignees[task.assignee];
  const chatId = assignee?.telegramChatId;

  if (!chatId) {
    return {
      ok: false,
      taskId,
      skipped: true,
      reason: `Assignee ${task.assignee} has no telegramChatId.`,
    };
  }

  const result = await sendTelegramMessage(
    chatId,
    createTaskMessage(task, assignee),
    task.postUrl
      ? {
          reply_markup: {
            inline_keyboard: [[{ text: "Открыть пост", url: task.postUrl }]],
          },
        }
      : {},
  );

  if (result.ok) {
    await updateTaskStatus(taskId, "sent_to_user");
  }

  return {
    ...result,
    taskId,
  };
}

export async function handleCommentTasksRequest(request, response, pathname) {
  try {
    if (request.method === "GET" && pathname === "/api/comment-tasks") {
      sendJson(response, 200, {
        ok: true,
        store: await readCommentTaskStore(),
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/comment-tasks/import") {
      const body = await readJsonBody(request);
      const store = await importCommentTaskStore(body);

      sendJson(response, 200, {
        ok: true,
        store,
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/comment-tasks/auto-assign") {
      const result = await autoAssignTasksByRole();

      sendJson(response, 200, {
        ok: true,
        ...result,
      });
      return;
    }

    if (request.method === "PATCH" && pathname === "/api/comment-tasks/channel") {
      const body = await readJsonBody(request);
      const channel = await updateChannelConfig(body);

      sendJson(response, 200, {
        ok: true,
        channel,
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/comment-tasks/channel/publish") {
      const body = await readJsonBody(request);
      const store = await readCommentTaskStore();
      const channel = {
        ...store.channel,
        chatId: body.chatId ?? store.channel.chatId,
        username: body.username ?? store.channel.username,
      };
      const text = String(body.text ?? "").trim();

      if (!text) {
        const error = new Error("Post text is required.");
        error.statusCode = 400;
        throw error;
      }

      const result = await callTelegramApi("sendMessage", {
        chat_id: normalizeChannelTarget(channel),
        disable_web_page_preview: false,
        text,
      });

      if (!result.ok) {
        sendJson(response, 502, {
          ok: false,
          telegramStatus: result.status,
          telegramDescription: result.payload?.description ?? result.reason,
        });
        return;
      }

      const message = result.payload.result;
      const post = await addPublishedPost({
        chatId: String(message.chat.id),
        messageId: message.message_id,
        text,
        url: createTelegramPostUrl(channel, message.message_id),
      });

      sendJson(response, 200, {
        ok: true,
        post,
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/comment-tasks/channel/apply-post") {
      const body = await readJsonBody(request);
      const result = await applyPostUrlToTasks({
        postUrl: body.postUrl,
        postLabel: body.postLabel,
      });

      sendJson(response, 200, {
        ok: true,
        ...result,
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/comment-tasks/telegram/status") {
      const result = await callTelegramApi("getMe");

      sendJson(response, 200, {
        configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        ok: result.ok,
        skipped: result.skipped,
        reason: result.reason,
        bot: result.payload?.result
          ? {
              id: result.payload.result.id,
              firstName: result.payload.result.first_name,
              username: result.payload.result.username,
            }
          : null,
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/comment-tasks/telegram/updates") {
      const result = await callTelegramApi("getUpdates");

      sendJson(response, result.ok || result.skipped ? 200 : 502, {
        ok: result.ok,
        skipped: result.skipped,
        reason: result.reason,
        telegramStatus: result.status,
        telegramDescription: result.payload?.description,
        chats: summarizeUpdates(result.payload?.result ?? []),
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/comment-tasks/telegram/delete-webhook") {
      const result = await callTelegramApi("deleteWebhook", { drop_pending_updates: false });

      sendJson(response, result.ok || result.skipped ? 200 : 502, {
        ok: result.ok,
        skipped: result.skipped,
        reason: result.reason,
        telegramStatus: result.status,
        telegramDescription: result.payload?.description,
      });
      return;
    }

    const statusMatch = pathname.match(/^\/api\/comment-tasks\/([^/]+)\/status$/);
    if (request.method === "PATCH" && statusMatch) {
      const body = await readJsonBody(request);
      const task = await updateTaskStatus(decodeURIComponent(statusMatch[1]), body.status);

      sendJson(response, 200, {
        ok: true,
        task,
      });
      return;
    }

    const assigneeChatMatch = pathname.match(/^\/api\/comment-tasks\/assignees\/([^/]+)\/chat$/);
    if (request.method === "PATCH" && assigneeChatMatch) {
      const body = await readJsonBody(request);
      const assignee = await updateAssigneeChatId(
        decodeURIComponent(assigneeChatMatch[1]),
        body.telegramChatId,
      );

      sendJson(response, 200, {
        ok: true,
        assignee,
      });
      return;
    }

    const assigneeMatch = pathname.match(/^\/api\/comment-tasks\/assignees\/([^/]+)$/);
    if (request.method === "PATCH" && assigneeMatch) {
      const body = await readJsonBody(request);
      const assignee = await updateAssignee(decodeURIComponent(assigneeMatch[1]), body);

      sendJson(response, 200, {
        ok: true,
        assignee,
      });
      return;
    }

    const notifyMatch = pathname.match(/^\/api\/comment-tasks\/([^/]+)\/notify$/);
    if (request.method === "POST" && notifyMatch) {
      const result = await notifyTask(decodeURIComponent(notifyMatch[1]));

      sendJson(response, result.ok || result.skipped ? 200 : 502, result);
      return;
    }

    if (request.method === "POST" && pathname === "/api/comment-tasks/notify-all") {
      const store = await readCommentTaskStore();
      const results = [];

      for (const task of store.tasks.filter((candidate) => candidate.status === "pending")) {
        results.push(await notifyTask(task.id));
      }

      sendJson(response, 200, {
        ok: results.every((result) => result.ok || result.skipped),
        results,
      });
      return;
    }

    sendJson(response, 404, {
      error: "not_found",
      message: `No comment task route registered for ${pathname}`,
    });
  } catch (error) {
    sendJson(response, error.statusCode ?? 500, {
      error: error.statusCode ? "bad_request" : "internal_error",
      message: error.message,
    });
  }
}
