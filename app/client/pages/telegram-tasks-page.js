const STATUSES = [
  ["pending", "Ожидает"],
  ["sent_to_user", "Отправлено"],
  ["opened", "Открыто"],
  ["posted", "Опубликовано"],
  ["skipped", "Пропущено"],
];

function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text) {
    element.textContent = options.text;
  }

  if (options.html) {
    element.innerHTML = options.html;
  }

  return element;
}

async function apiRequest(pathname, init = {}) {
  const response = await fetch(pathname, {
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.");
  }

  return payload;
}

function formatDateTime(value) {
  if (!value) {
    return "Без дедлайна";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function renderStatusSelect(task, onChange) {
  const select = createElement("select", { className: "task-select" });
  select.setAttribute("aria-label", `Статус задания ${task.id}`);

  for (const [value, label] of STATUSES) {
    const option = createElement("option", { text: label });
    option.value = value;
    option.selected = task.status === value;
    select.append(option);
  }

  select.addEventListener("change", () => onChange(select.value));
  return select;
}

function renderTaskCard(task, assignee, actions) {
  const card = createElement("article", { className: `task-card task-card--${task.status}` });
  const header = createElement("div", { className: "task-card__header" });
  const titleGroup = createElement("div");
  const title = createElement("h3", {
    className: "task-card__title",
    text: assignee?.name ?? task.assignee,
  });
  const meta = createElement("p", {
    className: "task-card__meta",
    text: `${task.id} · ${formatDateTime(task.dueAt)}${task.role ? ` · role: ${task.role}` : ""}${task.postLabel ? ` · ${task.postLabel}` : ""}`,
  });

  titleGroup.append(title, meta);
  header.append(titleGroup, renderStatusSelect(task, (status) => actions.updateStatus(task.id, status)));

  const comment = createElement("p", {
    className: "task-card__comment",
    text: task.comment,
  });

  const footer = createElement("div", { className: "task-card__footer" });
  const notifyButton = createElement("button", {
    className: "dui-button dui-button--small",
    text: "Отправить",
  });
  notifyButton.type = "button";
  notifyButton.addEventListener("click", () => actions.notify(task.id));

  const postedButton = createElement("button", {
    className: "dui-button dui-button--secondary dui-button--small",
    text: "Готово",
  });
  postedButton.type = "button";
  postedButton.addEventListener("click", () => actions.updateStatus(task.id, "posted"));

  if (task.postUrl) {
    const link = createElement("a", {
      className: "task-link",
      text: "Открыть пост",
    });
    link.href = task.postUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    footer.append(link);
  } else {
    footer.append(createElement("span", { className: "task-link task-link--disabled", text: "Ссылка не задана" }));
  }

  footer.append(notifyButton, postedButton);
  card.append(header, comment);

  if (task.notes) {
    card.append(createElement("p", { className: "task-card__notes", text: task.notes }));
  }

  card.append(footer);
  return card;
}

function createEmptyState() {
  return createElement("div", {
    className: "notice notice--neutral",
    html: `
      <span class="notice__title">Заданий нет</span>
      <p class="notice__body">Импортируй JSON-файл с исполнителями и заданиями, чтобы начать рабочую очередь.</p>
    `,
  });
}

export function renderTelegramTasksPage(root) {
  let store = { assignees: {}, tasks: [] };
  let activeFilter = "all";

  root.innerHTML = `
    <main class="page-shell page-shell--tasks">
      <section class="task-hero">
        <div>
          <span class="dui-eyebrow">Manual Telegram workflow</span>
          <h1 class="task-hero__title">Очередь комментариев</h1>
          <p class="task-hero__body">
            Загрузи файл задач, отправь каждому человеку готовый текст и ссылку на пост, затем веди статус ручной публикации.
          </p>
        </div>
        <div class="task-hero__panel">
          <span class="task-hero__panel-label">Режим</span>
          <strong>1 клик от человека</strong>
          <p>Софт не подключает реальные аккаунты и не публикует от имени людей.</p>
        </div>
      </section>

      <section class="task-toolbar">
        <label class="file-button">
          <input id="task-file" type="file" accept="application/json,.json" />
          Импорт JSON
        </label>
        <button class="dui-button dui-button--secondary" id="refresh-tasks" type="button">Обновить</button>
        <button class="dui-button dui-button--secondary" id="auto-assign" type="button">Автоназначить по ролям</button>
        <button class="dui-button" id="notify-all" type="button">Отправить ожидающие</button>
      </section>

      <section class="telegram-panel">
        <div class="telegram-panel__header">
          <div>
            <span class="dui-eyebrow">Telegram API</span>
            <h2>Тест подключения</h2>
          </div>
          <div class="telegram-panel__actions">
            <button class="dui-button dui-button--secondary dui-button--small" id="check-telegram" type="button">Проверить бота</button>
            <button class="dui-button dui-button--secondary dui-button--small" id="load-telegram-updates" type="button">Найти chat_id</button>
            <button class="dui-button dui-button--secondary dui-button--small" id="delete-telegram-webhook" type="button">Сбросить webhook</button>
          </div>
        </div>
        <p class="telegram-panel__body">
          Создай служебного бота через BotFather, запусти сервер с TELEGRAM_BOT_TOKEN, затем напиши этому боту /start из Telegram. После этого здесь появится chat_id для тестовой отправки задания.
        </p>
        <div class="telegram-status"></div>
        <div class="telegram-chats"></div>
      </section>

      <section class="accounts-panel">
        <div class="telegram-panel__header">
          <div>
            <span class="dui-eyebrow">Workspace</span>
            <h2>Аккаунты и роли</h2>
          </div>
        </div>
        <p class="telegram-panel__body">
          Привязки сохраняются в data/comment-tasks.json и не пропадают после обновления страницы. Роль используется для автоназначения задач, если в workflow у задачи указан role.
        </p>
        <div class="accounts-list"></div>
      </section>

      <section class="channel-panel">
        <div class="telegram-panel__header">
          <div>
            <span class="dui-eyebrow">Channel Admin</span>
            <h2>Публикация поста в канал</h2>
          </div>
        </div>
        <p class="telegram-panel__body">
          Добавь служебного бота админом канала с правом публикации. Укажи @username публичного канала или numeric chat_id приватного канала.
        </p>
        <div class="channel-form">
          <label>
            <span>Channel username</span>
            <input id="channel-username" class="task-input" type="text" placeholder="@test_channel" />
          </label>
          <label>
            <span>Channel chat_id</span>
            <input id="channel-chat-id" class="task-input" type="text" placeholder="-1001234567890" />
          </label>
          <button class="dui-button dui-button--secondary" id="save-channel" type="button">Сохранить канал</button>
        </div>
        <label class="channel-compose">
          <span>Текст тестового поста</span>
          <textarea id="channel-post-text" class="task-textarea" rows="4" placeholder="Тестовый пост для проверки workflow"></textarea>
        </label>
        <div class="telegram-panel__actions">
          <button class="dui-button" id="publish-channel-post" type="button">Опубликовать пост</button>
          <button class="dui-button dui-button--secondary" id="apply-last-post" type="button">Вставить последнюю ссылку в задания без ссылки</button>
        </div>
        <div class="published-posts"></div>
      </section>

      <section class="task-stats" aria-label="Статистика задач"></section>
      <section class="task-filters" aria-label="Фильтр статусов"></section>
      <section class="task-list" aria-live="polite"></section>
      <section class="task-import-help">
        <h2>Формат файла</h2>
        <pre><code>{
  "assignees": {
    "alex": { "name": "Alex", "role": "macro", "telegramChatId": "123456789" }
  },
  "tasks": [
    {
      "id": "task-001",
      "assignee": "alex",
      "role": "",
      "postUrl": "https://t.me/channel/123",
      "postLabel": "25 мая, утро — рамка недели",
      "comment": "Текст, который человек публикует вручную.",
      "status": "pending",
      "dueAt": "2026-05-28T18:00:00+02:00",
      "notes": ""
    }
    {
      "id": "task-002",
      "assignee": "",
      "role": "macro",
      "comment": "Эта задача автоматически назначится одному из macro-исполнителей."
    }
  ]
}</code></pre>
      </section>
      <div class="task-toast" role="status" aria-live="polite"></div>
    </main>
  `;

  const statsRoot = root.querySelector(".task-stats");
  const filtersRoot = root.querySelector(".task-filters");
  const listRoot = root.querySelector(".task-list");
  const telegramStatusRoot = root.querySelector(".telegram-status");
  const telegramChatsRoot = root.querySelector(".telegram-chats");
  const channelUsernameInput = root.querySelector("#channel-username");
  const channelChatIdInput = root.querySelector("#channel-chat-id");
  const channelPostTextInput = root.querySelector("#channel-post-text");
  const publishedPostsRoot = root.querySelector(".published-posts");
  const toast = root.querySelector(".task-toast");

  function setToast(message, kind = "neutral") {
    toast.textContent = message;
    toast.dataset.kind = kind;
  }

  function visibleTasks() {
    if (activeFilter === "all") {
      return store.tasks;
    }

    return store.tasks.filter((task) => task.status === activeFilter);
  }

  function renderStats() {
    const counts = Object.fromEntries(STATUSES.map(([status]) => [status, 0]));

    for (const task of store.tasks) {
      counts[task.status] = (counts[task.status] ?? 0) + 1;
    }

    statsRoot.replaceChildren(
      ...[
        ["Всего", store.tasks.length],
        ["Ожидает", counts.pending],
        ["Отправлено", counts.sent_to_user],
        ["Опубликовано", counts.posted],
      ].map(([label, value]) => {
        const card = createElement("div", { className: "task-stat" });
        card.append(
          createElement("span", { className: "task-stat__label", text: label }),
          createElement("strong", { className: "task-stat__value", text: String(value) }),
        );
        return card;
      }),
    );
  }

  function renderFilters() {
    const filters = [["all", "Все"], ...STATUSES];

    filtersRoot.replaceChildren(
      ...filters.map(([value, label]) => {
        const button = createElement("button", {
          className: `task-filter ${activeFilter === value ? "task-filter--active" : ""}`,
          text: label,
        });
        button.type = "button";
        button.addEventListener("click", () => {
          activeFilter = value;
          render();
        });
        return button;
      }),
    );
  }

  function renderList() {
    const tasks = visibleTasks();

    if (tasks.length === 0) {
      listRoot.replaceChildren(createEmptyState());
      return;
    }

    listRoot.replaceChildren(
      ...tasks.map((task) =>
        renderTaskCard(task, store.assignees[task.assignee], {
          notify,
          updateStatus,
        }),
      ),
    );
  }

  function renderTelegramStatus(payload) {
    telegramStatusRoot.replaceChildren(
      createElement("div", {
        className: `notice ${payload.ok ? "notice--success" : "notice--warning"}`,
        html: payload.ok
          ? `<span class="notice__title">Бот подключен</span><p class="notice__body">@${payload.bot.username} · ${payload.bot.firstName}</p>`
          : `<span class="notice__title">Бот не подключен</span><p class="notice__body">${payload.reason ?? "Проверь TELEGRAM_BOT_TOKEN и перезапусти сервер."}</p>`,
      }),
    );
  }

  function renderTelegramChats(chats) {
    if (chats.length === 0) {
      telegramChatsRoot.replaceChildren(
        createElement("div", {
          className: "notice notice--neutral",
          html: '<span class="notice__title">chat_id не найдены</span><p class="notice__body">Напиши /start служебному боту из Telegram, потом нажми “Найти chat_id”. Для группы добавь бота в группу и отправь сообщение.</p>',
        }),
      );
      return;
    }

    telegramChatsRoot.replaceChildren(
      ...chats.map((chat) => {
        const row = createElement("div", { className: "telegram-chat" });
        const info = createElement("div");
        info.append(
          createElement("strong", {
            className: "telegram-chat__title",
            text: chat.title || chat.username || chat.id,
          }),
          createElement("p", {
            className: "telegram-chat__meta",
            text: `${chat.type} · ${chat.id}${chat.username ? ` · ${chat.username}` : ""}`,
          }),
        );

        const select = createElement("select", { className: "task-select" });
        select.setAttribute("aria-label", `Исполнитель для chat_id ${chat.id}`);

        for (const [id, assignee] of Object.entries(store.assignees)) {
          const option = createElement("option", { text: assignee.name });
          option.value = id;
          select.append(option);
        }

        const saveButton = createElement("button", {
          className: "dui-button dui-button--small",
          text: "Привязать",
        });
        saveButton.type = "button";
        saveButton.addEventListener("click", () => saveAssigneeChat(select.value, chat.id));

        row.append(info, select, saveButton);
        return row;
      }),
    );
  }

  function renderAccountsPanel() {
    const accountsRoot = root.querySelector(".accounts-list");
    const assignees = Object.entries(store.assignees);

    if (assignees.length === 0) {
      accountsRoot.replaceChildren(
        createElement("div", {
          className: "notice notice--neutral",
          html: '<span class="notice__title">Исполнителей нет</span><p class="notice__body">Импортируй workflow-файл с assignees или добавь исполнителей в JSON.</p>',
        }),
      );
      return;
    }

    accountsRoot.replaceChildren(
      ...assignees.map(([id, assignee]) => {
        const row = createElement("div", { className: "account-row" });
        const title = createElement("div", { className: "account-row__title" });
        title.append(
          createElement("strong", { text: assignee.name ?? id }),
          createElement("span", {
            text: assignee.telegramChatId ? `chat_id ${assignee.telegramChatId}` : "не привязан",
          }),
        );

        const roleInput = createElement("input", {
          className: "task-input",
        });
        roleInput.value = assignee.role ?? "";
        roleInput.placeholder = "role: macro, legal, regular";
        roleInput.setAttribute("aria-label", `Роль ${assignee.name ?? id}`);

        const kindInput = createElement("input", {
          className: "task-input",
        });
        kindInput.value = assignee.kind ?? "";
        kindInput.placeholder = "kind: specialist / regular";
        kindInput.setAttribute("aria-label", `Тип ${assignee.name ?? id}`);

        const saveButton = createElement("button", {
          className: "dui-button dui-button--small",
          text: "Сохранить",
        });
        saveButton.type = "button";
        saveButton.addEventListener("click", () =>
          updateAssignee(id, {
            kind: kindInput.value,
            role: roleInput.value,
          }),
        );

        const unlinkButton = createElement("button", {
          className: "dui-button dui-button--secondary dui-button--small",
          text: "Отвязать",
        });
        unlinkButton.type = "button";
        unlinkButton.disabled = !assignee.telegramChatId;
        unlinkButton.addEventListener("click", () => updateAssignee(id, { telegramChatId: "" }));

        row.append(title, roleInput, kindInput, saveButton, unlinkButton);
        return row;
      }),
    );
  }

  function renderChannelPanel() {
    channelUsernameInput.value = store.channel?.username ?? "";
    channelChatIdInput.value = store.channel?.chatId ?? "";

    const posts = store.publishedPosts ?? [];

    if (posts.length === 0) {
      publishedPostsRoot.replaceChildren(
        createElement("div", {
          className: "notice notice--neutral",
          html: '<span class="notice__title">Постов пока нет</span><p class="notice__body">Опубликуй тестовый пост, затем используй его ссылку в заданиях для двух исполнителей.</p>',
        }),
      );
      return;
    }

    publishedPostsRoot.replaceChildren(
      ...posts.slice(0, 5).map((post) => {
        const row = createElement("div", { className: "published-post" });
        const info = createElement("div");
        info.append(
          createElement("strong", {
            className: "telegram-chat__title",
            text: post.url || `message_id ${post.messageId}`,
          }),
          createElement("p", {
            className: "telegram-chat__meta",
            text: `${post.publishedAt || "no date"} · ${post.chatId}`,
          }),
        );

        const actions = createElement("div", { className: "telegram-panel__actions" });

        if (post.url) {
          const openLink = createElement("a", { className: "task-link", text: "Открыть" });
          openLink.href = post.url;
          openLink.target = "_blank";
          openLink.rel = "noreferrer";
          actions.append(openLink);
        }

        const applyButton = createElement("button", {
          className: "dui-button dui-button--secondary dui-button--small",
          text: "В задания",
        });
        applyButton.type = "button";
        applyButton.disabled = !post.url;
        applyButton.addEventListener("click", () => applyPostToEmptyTasks(post.url));
        actions.append(applyButton);

        row.append(info, actions);
        return row;
      }),
    );
  }

  function render() {
    renderChannelPanel();
    renderAccountsPanel();
    renderStats();
    renderFilters();
    renderList();
  }

  async function loadTasks() {
    const payload = await apiRequest("/api/comment-tasks");
    store = payload.store;
    render();
  }

  async function updateStatus(taskId, status) {
    await apiRequest(`/api/comment-tasks/${encodeURIComponent(taskId)}/status`, {
      body: JSON.stringify({ status }),
      method: "PATCH",
    });
    await loadTasks();
    setToast(`Статус ${taskId} обновлен.`, "success");
  }

  async function notify(taskId) {
    const result = await apiRequest(`/api/comment-tasks/${encodeURIComponent(taskId)}/notify`, {
      method: "POST",
    });
    await loadTasks();
    setToast(
      result.ok
        ? `Задание ${taskId} отправлено.`
        : `Задание ${taskId} не отправлено: ${result.reason ?? "ошибка Telegram API"}.`,
      result.ok ? "success" : "warning",
    );
  }

  async function saveAssigneeChat(assigneeId, telegramChatId) {
    await apiRequest(`/api/comment-tasks/assignees/${encodeURIComponent(assigneeId)}/chat`, {
      body: JSON.stringify({ telegramChatId }),
      method: "PATCH",
    });
    await loadTasks();
    setToast(`chat_id ${telegramChatId} привязан к ${store.assignees[assigneeId]?.name ?? assigneeId}.`, "success");
  }

  async function updateAssignee(assigneeId, patch) {
    await apiRequest(`/api/comment-tasks/assignees/${encodeURIComponent(assigneeId)}`, {
      body: JSON.stringify(patch),
      method: "PATCH",
    });
    await loadTasks();
    setToast(`Исполнитель ${store.assignees[assigneeId]?.name ?? assigneeId} обновлен.`, "success");
  }

  async function autoAssignByRole() {
    const payload = await apiRequest("/api/comment-tasks/auto-assign", { method: "POST" });
    await loadTasks();
    setToast(`Автоназначено заданий по ролям: ${payload.updated}.`, "success");
  }

  async function saveChannel() {
    await apiRequest("/api/comment-tasks/channel", {
      body: JSON.stringify({
        chatId: channelChatIdInput.value,
        username: channelUsernameInput.value,
      }),
      method: "PATCH",
    });
    await loadTasks();
    setToast("Канал сохранен.", "success");
  }

  async function publishChannelPost() {
    const payload = await apiRequest("/api/comment-tasks/channel/publish", {
      body: JSON.stringify({
        chatId: channelChatIdInput.value,
        text: channelPostTextInput.value,
        username: channelUsernameInput.value,
      }),
      method: "POST",
    });

    await loadTasks();
    setToast(
      payload.post.url
        ? `Пост опубликован: ${payload.post.url}`
        : `Пост опубликован, message_id: ${payload.post.messageId}. Для ссылки укажи @username канала.`,
      "success",
    );
  }

  async function applyPostToEmptyTasks(postUrl) {
    const payload = await apiRequest("/api/comment-tasks/channel/apply-post", {
      body: JSON.stringify({ postUrl }),
      method: "POST",
    });

    await loadTasks();
    setToast(`Ссылка добавлена в заданий: ${payload.updated}.`, "success");
  }

  async function importFile(file) {
    const text = await file.text();
    const payload = JSON.parse(text);

    store = (await apiRequest("/api/comment-tasks/import", {
      body: JSON.stringify(payload),
      method: "POST",
    })).store;
    activeFilter = "all";
    render();
    setToast(`Импортировано заданий: ${store.tasks.length}.`, "success");
  }

  root.querySelector("#refresh-tasks").addEventListener("click", () => {
    loadTasks().then(
      () => setToast("Очередь обновлена.", "success"),
      (error) => setToast(error.message, "warning"),
    );
  });

  root.querySelector("#notify-all").addEventListener("click", async () => {
    try {
      const result = await apiRequest("/api/comment-tasks/notify-all", { method: "POST" });
      await loadTasks();
      setToast(`Обработано ожидающих заданий: ${result.results.length}.`, "success");
    } catch (error) {
      setToast(error.message, "warning");
    }
  });

  root.querySelector("#auto-assign").addEventListener("click", () => {
    autoAssignByRole().catch((error) => setToast(error.message, "warning"));
  });

  root.querySelector("#check-telegram").addEventListener("click", async () => {
    try {
      renderTelegramStatus(await apiRequest("/api/comment-tasks/telegram/status"));
    } catch (error) {
      setToast(error.message, "warning");
    }
  });

  root.querySelector("#load-telegram-updates").addEventListener("click", async () => {
    try {
      const payload = await apiRequest("/api/comment-tasks/telegram/updates");
      renderTelegramChats(payload.chats ?? []);
      setToast(
        payload.ok
          ? `Найдено chat_id: ${(payload.chats ?? []).length}.`
          : `Не удалось получить updates: ${payload.telegramDescription ?? payload.reason ?? "ошибка Telegram API"}.`,
        payload.ok ? "success" : "warning",
      );
    } catch (error) {
      setToast(error.message, "warning");
    }
  });

  root.querySelector("#delete-telegram-webhook").addEventListener("click", async () => {
    try {
      const payload = await apiRequest("/api/comment-tasks/telegram/delete-webhook", { method: "POST" });
      setToast(
        payload.ok
          ? "Webhook сброшен. Напиши боту /start и снова нажми “Найти chat_id”."
          : `Webhook не сброшен: ${payload.telegramDescription ?? payload.reason ?? "ошибка Telegram API"}.`,
        payload.ok ? "success" : "warning",
      );
    } catch (error) {
      setToast(error.message, "warning");
    }
  });

  root.querySelector("#save-channel").addEventListener("click", () => {
    saveChannel().catch((error) => setToast(error.message, "warning"));
  });

  root.querySelector("#publish-channel-post").addEventListener("click", () => {
    publishChannelPost().catch((error) => setToast(error.message, "warning"));
  });

  root.querySelector("#apply-last-post").addEventListener("click", () => {
    const [lastPost] = store.publishedPosts ?? [];

    if (!lastPost?.url) {
      setToast("Нет опубликованного поста со ссылкой.", "warning");
      return;
    }

    applyPostToEmptyTasks(lastPost.url).catch((error) => setToast(error.message, "warning"));
  });

  root.querySelector("#task-file").addEventListener("change", (event) => {
    const [file] = event.currentTarget.files;

    if (!file) {
      return;
    }

    importFile(file).catch((error) => setToast(error.message, "warning"));
  });

  loadTasks().catch((error) => setToast(error.message, "warning"));
}
