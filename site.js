// ────────────────────────────────────────────────
// 1. КОНСТАНТЫ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ────────────────────────────────────────────────
const API_BASE_URL = "http://localhost:8000";

const sendBtn = document.getElementById("send-btn");
const menuBtn = document.getElementById("menu-btn");
const messageInput = document.getElementById("message-input");
const chatMessages = document.getElementById("chat-messages");
const chatToggle = document.getElementById("chat-toggle");
const chatContainer = document.getElementById("chat-container");
const expandBtn = document.getElementById("expand-btn");
const attachBtn = document.getElementById("attach-btn");
const fileInput = document.getElementById("file-input");
const themeToggle = document.getElementById("theme-toggle");
const settingsBtn = document.querySelector(".chat-header .settings");
const settingsMenu = document.getElementById("settings-menu");
const settingsTrigger = document.getElementById("settings-trigger");

let selectedLanguage = null;
let selectedTopic = null;
let selectedSubTopic = null;
let inactivityTimer = null;
let isSoundEnabled = localStorage.getItem("soundEnabled") !== "false";
let popupAlreadyShown = false;

// ────────────────────────────────────────────────
// 2. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ (DOMContentLoaded)
// ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Восстановление сообщений
  // const saved = JSON.parse(localStorage.getItem("chatMessages") || "[]");
  // Восстанавливаем сообщения (внутри DOMContentLoaded)
  saved.forEach((msg) => {
    const c = document.createElement("div");
    c.classList.add("message-container");
    const m = document.createElement("div");
    m.classList.add("message", msg.type === "received" ? "received" : "");

    if (msg.isImage) {
      const img = document.createElement("img");
      img.src = msg.text;
      m.appendChild(img);
    } else {
      m.innerHTML = msg.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    }

    c.appendChild(m);
    chatMessages.appendChild(c);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Тема
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-theme");
    chatContainer.classList.add("dark-theme");
    themeToggle.checked = true;
  }

  // Проверка языка
  selectedLanguage = localStorage.getItem("language");
  if (!selectedLanguage || !["kz", "ru", "en"].includes(selectedLanguage)) {
    localStorage.removeItem("language");
    showLanguageSelection();
  } else {
    updatePlaceholder();
    showGreeting();
    showTopicSelection();
  }

  updateInputButtons();
});

// ────────────────────────────────────────────────
// 3. БАЗОВЫЕ ФУНКЦИИ ИНТЕРФЕЙСА (UI)
// ────────────────────────────────────────────────
function updateInputButtons() {
  const hasText = messageInput.value.trim().length > 0;
  if (hasText) {
    sendBtn.style.display = "block";
    menuBtn.style.display = "none";
  } else {
    sendBtn.style.display = "none";
    menuBtn.style.display = "block";
  }
}


function updatePlaceholder() {
  const ph = {
    kz: "Сұрақ жазыңыз немесе Excel жүктеңіз...",
    ru: "Напишите вопрос или загрузите Excel...",
    en: "Type your question or upload Excel...",
  };
  messageInput.placeholder = ph[selectedLanguage] || ph.ru;
}



function hideTyping() {
  document.getElementById("typing")?.remove();
}

function startInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    chatContainer.style.display = "none";
  }, 300000); // 5 минут
}

// ────────────────────────────────────────────────
// 4. УПРАВЛЕНИЕ СООБЩЕНИЯМИ И КНОПКАМИ ДЕЙСТВИЙ
// ────────────────────────────────────────────────


// ────────────────────────────────────────────────
// 1. СИСТЕМНЫЕ ФУНКЦИИ (Сохранение в локальную память)
function saveMessage(text, type, isImage = false) {

return;
}

// ────────────────────────────────────────────────
// 2. ФУНКЦИИ ОТРИСОВКИ СООБЩЕНИЙ (БЕЗ КНОПОК)
// ────────────────────────────────────────────────

function addSentMessage(text) {
  if (!text) return;
  const c = document.createElement("div");
  c.classList.add("message-container");
  const m = document.createElement("div");
  m.classList.add("message");
  m.textContent = text;
  c.appendChild(m);
  chatMessages.appendChild(c);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  saveMessage(text, "sent");
}

function addReceivedMessage(text, imageSrc = null) {
  if (!text) return;

  const container = document.createElement("div");
  container.classList.add("message-container");

  // ПРОВЕРКА: Если в тексте есть наш градиент (карточка студента), 
  // выводим без стандартного фона сообщения
  if (text.includes("linear-gradient")) {
    container.innerHTML = text; 
  } else {
    // Для обычного текста создаем стандартное облачко
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", "received");

    // Рендерим жирный текст и переносы строк
    messageDiv.innerHTML = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");

    if (imageSrc) {
      const img = document.createElement("img");
      img.src = imageSrc;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "12px";
      img.style.marginTop = "10px";
      messageDiv.appendChild(img);
    }
    container.appendChild(messageDiv);
  }

  chatMessages.appendChild(container);
  
  // Используем плавный скролл
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });

  // Если ты отключил сохранение, эту строку можно удалить
  saveMessage(text, "received", !!imageSrc); 
}

// ────────────────────────────────────────────────
// 5. ВЫБОР ЯЗЫКА И ПРИВЕТСТВИЕ
// ────────────────────────────────────────────────
function showLanguageSelection() {
  const text = "Тілді таңдаңыз / Выберите язык / Select language";
  addReceivedMessage(text);
  const container = document.createElement("div");
  container.classList.add("message-container");
  const div = document.createElement("div");
  div.classList.add("language-selection");
  const languages = [
    { code: "kz", label: "Қазақша" },
    { code: "ru", label: "Русский" },
    { code: "en", label: "English" },
  ];
  languages.forEach((lang) => {
    const btn = document.createElement("button");
    btn.classList.add("language-btn");
    btn.textContent = lang.label;
    btn.onclick = () => selectLanguage(lang.code);
    div.appendChild(btn);
  });
  container.appendChild(div);
  chatMessages.appendChild(container);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function selectLanguage(lang) {
  selectedLanguage = lang;
  localStorage.setItem("language", lang);
  addSentMessage(
    lang === "kz" ? "Қазақша" : lang === "ru" ? "Русский" : "English",
  );
  updatePlaceholder();
  showGreeting();
  showTopicSelection();
}

function showGreeting() {
  const greetings = {
    kz: "Сәлем! Мен StudentPerf Bot-пын. Студенттердің үлгерімін талдауға көмектесемін!",
    ru: "Привет! Я StudentPerf Bot. Помогу анализировать успеваемость студентов!",
    en: "Hello! I am StudentPerf Bot. Ready to help analyze student performance!",
  };
  addReceivedMessage(greetings[selectedLanguage] || greetings.ru);
}

// ────────────────────────────────────────────────
// 6. ГЛАВНОЕ МЕНЮ И ТЕМЫ (API)
// ────────────────────────────────────────────────
async function showTopicSelection() {
  const prompts = {
    kz: "Тақырыпты таңдаңыз:",
    ru: "Выберите тему запроса:",
    en: "Select request topic:",
  };
  addReceivedMessage(prompts[selectedLanguage] || prompts.ru);
  showTyping();
  try {
    const res = await axios.get(`${API_BASE_URL}/api/chat_topics`);
    const topics = res.data;
    const container = document.createElement("div");
    container.classList.add("message-container");
    const div = document.createElement("div");
    div.classList.add("topic-selection");
    topics.forEach((t) => {
      const btn = document.createElement("button");
      btn.classList.add("topic-btn");
      btn.textContent = t[`title_${selectedLanguage}`] || t.title_ru;
      btn.onclick = () =>
        selectTopic(
          t[`title_${selectedLanguage}`] || t.title_ru,
          t.action,
          t.has_subtopics,
        );
      div.appendChild(btn);
    });
    container.appendChild(div);
    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (err) {
    addReceivedMessage("Не удалось загрузить темы. Попробуйте позже.");
  }
  hideTyping();
}

async function selectTopic(title, action, hasSubtopics) {
  selectedTopic = title;
  localStorage.setItem("selectedTopic", title);
  addSentMessage(title);
  showTyping();

  switch (action) {
    case "last_report":
      try {
        const res = await axios.get(`${API_BASE_URL}/last_report`);
        const data = res.data;
        if (data.status === "no_reports_yet") {
          addReceivedMessage("Пока нет загруженных отчётов.");
        } else {
          const replyReport = `**Последний отчёт** (${new Date(data.uploaded_at).toLocaleString()})\nФайл: ${data.file_name}\nНовых студентов: ${data.new_students || 0}\nОбновлено записей: ${data.updated_records || 0}\nКомментарий: ${data.insight}`;
          if (data.chart_base64) {
            addReceivedMessage(
              replyReport,
              `data:image/png;base64,${data.chart_base64}`,
            );
          } else {
            addReceivedMessage(replyReport);
          }
        }
      } catch (err) {
        addReceivedMessage("Ошибка при получении последнего отчёта.");
      }
      break;

    case "search_student":
      addReceivedMessage(
        selectedLanguage === "kz"
          ? "Студенттің Аты-жөні немесе ИИН енгізіңіз"
          : "Введите ФИО или ИИН студента",
      );
      break;

   case "analysis_by_course":
      const replyCourse =
        selectedLanguage === "kz"
          ? "Қай курс бойынша талдау жасау керек?"
          : "По какому курсу сделать анализ?";

      addReceivedMessage(replyCourse);

      const courses =
        selectedLanguage === "kz"
          ? ["1 курс", "2 курс", "3 курс", "4 курс", "Магистратура"]
          : ["1 курс", "2 курс", "3 курс", "4 курс", "Магистратура"];

      const containerCourse = document.createElement("div");
      containerCourse.classList.add("message-container");

      const divCourse = document.createElement("div");
      divCourse.classList.add("topic-selection");

      courses.forEach((course) => {
        const btnCourse = document.createElement("button");
        btnCourse.classList.add("topic-btn");
        btnCourse.textContent = course;
        btnCourse.onclick = () => {
          addSentMessage(course);
          fetchCourseAnalysis(course);
        };
        divCourse.appendChild(btnCourse);
      });

      containerCourse.appendChild(divCourse);
      chatMessages.appendChild(containerCourse);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      break;

    case "at_risk":
      addReceivedMessage(
        selectedLanguage === "kz"
          ? "Қандай деңгейдегі қауіпті студенттерді көрсету керек?"
          : "Какой уровень риска показать?",
      );
      const riskLevels =
        selectedLanguage === "kz"
          ? [
              "GPA < 1.0 (критично)",
              "GPA < 1.5",
              "2+ пән < 50",
              "Барлық қауіпті студенттер",
            ]
          : [
              "GPA < 1.0 (критично)",
              "GPA < 1.5",
              "2+ дисциплин < 50",
              "Все под риском",
            ];
      const containerRisk = document.createElement("div");
      containerRisk.classList.add("message-container");
      const divRisk = document.createElement("div");
      divRisk.classList.add("topic-selection");
      riskLevels.forEach((level) => {
        const btnRisk = document.createElement("button");
        btnRisk.classList.add("topic-btn");
        btnRisk.textContent = level;
        btnRisk.onclick = () => {
          addSentMessage(level);
          fetchAtRiskStudents(level);
        };
        divRisk.appendChild(btnRisk);
      });
      containerRisk.appendChild(divRisk);
      chatMessages.appendChild(containerRisk);
      break;

    case "top_students":
      addReceivedMessage(
        selectedLanguage === "kz"
          ? "Топ студенттерді қалай көрсету керек?"
          : "Как показать топ студентов?",
      );
      const topOptions = [
        "Топ-10 по всем",
        "Топ по 1 курсу",
        "Топ по 2 курсу",
        "Топ по 3 курсу",
        "Топ по 4 курсу",
      ];
      const containerTop = document.createElement("div");
      containerTop.classList.add("message-container");
      const divTop = document.createElement("div");
      divTop.classList.add("topic-selection");
      topOptions.forEach((option) => {
        const btnTop = document.createElement("button");
        btnTop.classList.add("topic-btn");
        btnTop.textContent = option;
        btnTop.onclick = () => {
          addSentMessage(option);
          fetchTopStudents(option);
        };
        divTop.appendChild(btnTop);
      });
      containerTop.appendChild(divTop);
      chatMessages.appendChild(containerTop);
      break;

    case "comparison":
      addReceivedMessage(
        selectedLanguage === "kz"
          ? "Не салыстырғыңыз келеді?"
          : "Что хотите сравнить?",
      );
      const compareOptions =
        selectedLanguage === "kz"
          ? ["Курстар арасында", "Топтар арасында"]
          : ["Между курсами", "Между группами"];
      const containerComp = document.createElement("div");
      containerComp.classList.add("message-container");
      const divComp = document.createElement("div");
      divComp.classList.add("topic-selection");
      compareOptions.forEach((option) => {
        const btnComp = document.createElement("button");
        btnComp.classList.add("topic-btn");
        btnComp.textContent = option;
        btnComp.onclick = () => {
          addSentMessage(option);
          startComparison(option);
        };
        divComp.appendChild(btnComp);
      });
      containerComp.appendChild(divComp);
      chatMessages.appendChild(containerComp);
      break;

    case "analysis_by_subject":
      addReceivedMessage(
        selectedLanguage === "kz"
          ? "Пән атауын енгізіңіз (мысалы: Программалау)"
          : "Введите название дисциплины (например: Программирование)",
      );
      selectedTopic = "analysis_by_subject_waiting";
      break;

    case "performance_forecast":
      addReceivedMessage(
        selectedLanguage === "kz"
          ? "Кімнің үлгерімін болжағыңыз келеді?"
          : "Для кого сделать прогноз успеваемости?",
      );
      const forecastOptions =
        selectedLanguage === "kz"
          ? ["Белгілі студент үшін", "Топ үшін", "Курс үшін", "Барлығы үшін"]
          : [
              "Для конкретного студента",
              "Для группы",
              "Для курса",
              "Общий прогноз",
            ];
      const containerForecast = document.createElement("div");
      containerForecast.classList.add("message-container");
      const divForecast = document.createElement("div");
      divForecast.classList.add("topic-selection");
      forecastOptions.forEach((option) => {
        const btnForecast = document.createElement("button");
        btnForecast.classList.add("topic-btn");
        btnForecast.textContent = option;
        btnForecast.onclick = () => {
          addSentMessage(option);
          startForecast(option);
        };
        divForecast.appendChild(btnForecast);
      });
      containerForecast.appendChild(divForecast);
      chatMessages.appendChild(containerForecast);
      break;

    case "guide":
  const guideReply = selectedLanguage === "kz"
    ? "Қай бөлім бойынша ақпарат керек?"
    : "По какому разделу нужен путеводитель?";

  addReceivedMessage(guideReply);
  showTyping();

  try {
    const res = await axios.get(`${API_BASE_URL}/api/guide_sections`);
    const sections = res.data;

    if (!sections || sections.length === 0) {
      addReceivedMessage(`
<div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); 
            color: white; padding: 24px; border-radius: 16px; 
            margin: 16px 0; text-align: center; box-shadow: 0 10px 40px rgba(107,114,128,0.3);">
  <span style="font-size: 48px; display: block; margin-bottom: 16px;">📚</span>
  <h3 style="margin: 0; font-size: 24px;">Путеводитель</h3>
  <p style="margin: 12px 0 0;">
    Пока разделы пусты 😔<br>
    Добавьте информацию в базу!
  </p>
</div>`);
      hideTyping();
      return;
    }

    

    const container = document.createElement("div");
    container.classList.add("message-container");

    const grid = document.createElement("div");
    grid.classList.add("guide-grid");

    // Определяем количество колонок
    const isExpanded = chatContainer.classList.contains("expanded");
    const screenWidth = window.innerWidth;

    let columns;
    if (!isExpanded) {
      // Обычный чат → всегда стараемся 2 колонки
      columns = "repeat(auto-fit, minmax(260px, 1fr))";
    } else {
      // Развёрнутый чат
      if (screenWidth > 1400) {
        columns = "repeat(4, 1fr)";          // 4 колонки на большом экране
      } else if (screenWidth >= 768) {
        columns = "repeat(3, 1fr)";          // 3 колонки на среднем
      } else {
        columns = "repeat(2, 1fr)";          // 2 колонки на мобильном даже в expanded
      }
    }
    

    grid.style.display = "grid";
    grid.style.gridTemplateColumns = columns;
    grid.style.gap = isExpanded ? "20px" : "16px";
    grid.style.padding = "16px 0";

    sections.forEach(sec => {
      const card = document.createElement("div");

      // Адаптивные размеры карточки
      card.style.background = "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)";
      card.style.color = "white";
      card.style.padding = isExpanded ? "16px" : "20px";
      card.style.borderRadius = "16px";
      card.style.cursor = "pointer";
      card.style.transition = "all 0.3s ease";
      card.style.boxShadow = "0 6px 20px rgba(99,102,241,0.3)";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.alignItems = "center";
      card.style.textAlign = "center";
      card.style.minHeight = "140px"; // чтобы карточки не "прыгали" по высоте

      card.onmouseover = () => {
        card.style.transform = "translateY(-8px)";
        card.style.boxShadow = "0 16px 40px rgba(99,102,241,0.5)";
      };
      card.onmouseout = () => {
        card.style.transform = "translateY(0)";
        card.style.boxShadow = "0 6px 20px rgba(99,102,241,0.3)";
      };

      const title = sec[`title_${selectedLanguage}`] || sec.title_ru || sec.key || "Без названия";

      card.innerHTML = `
        <span style="font-size: ${isExpanded ? '38px' : '48px'}; margin-bottom: 12px;">${sec.icon || "📖"}</span>
        <h4 style="margin: 0; font-size: ${isExpanded ? '16px' : '18px'}; font-weight: 600; line-height: 1.3;">
          ${title}
        </h4>
      `;

      card.onclick = () => {
        addSentMessage(title);
        fetchGuideContent(sec.key, title);
      };

      grid.appendChild(card);
    });

    container.appendChild(grid);
    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
      if (!popupAlreadyShown) {
        const popup = document.getElementById("expand-chat-popup");
        if (popup) {
          popup.style.display = "flex";
          popupAlreadyShown = true;
        }
      }
    }, 800);

  } catch (err) {
    console.error("Ошибка путеводителя:", err);
    addReceivedMessage(`
<div style="background: #1E1E2E; color: #A78BFA; padding: 20px; border-radius: 16px; text-align: center;">
  <span style="font-size: 36px; display: block; margin-bottom: 12px;">⚠️</span>
  Не удалось загрузить путеводитель<br>
  Проверьте сервер и попробуйте позже.
</div>`);
  }
// Флаг, чтобы попап не появлялся повторно в сессии
let popupAlreadyShown = false;

// Функция показа попапа (с анимацией)
function showExpandPopup() {
  if (popupAlreadyShown) return;

  const popup = document.getElementById("expand-chat-popup");
  if (popup) {
    popup.style.display = "block";
    setTimeout(() => {
      popup.classList.add("visible");
    }, 100); // небольшая задержка для анимации
    popupAlreadyShown = true;
  }
}

// Закрыть попап
document.getElementById("popup-close-btn")?.addEventListener("click", () => {
  const popup = document.getElementById("expand-chat-popup");
  popup.classList.remove("visible");
  setTimeout(() => {
    popup.style.display = "none";
  }, 400); // ждём окончания анимации
  popupAlreadyShown = true;
});

// Развернуть чат
document.getElementById("popup-expand-btn")?.addEventListener("click", () => {
  chatContainer.classList.add("expanded");
  expandBtn.textContent = "⤢";
  const popup = document.getElementById("expand-chat-popup");
  popup.classList.remove("visible");
  setTimeout(() => {
    popup.style.display = "none";
  }, 400);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
  hideTyping();
  startInactivityTimer();
  break;
    
    case "ai_recommendations":
      addReceivedMessage(
        selectedLanguage === "kz"
          ? "AI ассистентке қош келдіңіз! Қандай сұрақ қойғыңыз келеді? 😊\n\n(выход в меню — /menu)"
          : "Добро пожаловать в AI ассистент! Задавайте любые вопросы 😊\n\n(выход в меню — /menu)",
      );
      selectedTopic = "ai_assistant";
      break;

    default:
      addReceivedMessage(`Вы выбрали: **${title}**\nФункция в разработке...`);
  }
  hideTyping();
  startInactivityTimer();
}

// ────────────────────────────────────────────────
// 7. ОБРАБОТКА ВВОДА (handleSend)
// ────────────────────────────────────────────────
async function handleSend() {
  const text = messageInput.value.trim();
  if (!text) return;
  // КРИТИЧЕСКИЙ МОМЕНТ: Удаляем кнопки-подсказки, как только пользователь что-то отправил
  removeQuickReplies();
  addSentMessage(text);
  messageInput.value = "";
  updateInputButtons();

    const exitPhrases = ["Вернуться в меню", "Меню", "/menu", "Бас менюге оралу"];
  if (exitPhrases.includes(text)) {
    selectedTopic = null; // Сбрасываем текущую тему (выходим из AI ассистента)
    addReceivedMessage("Возвращаюсь в главное меню...");
    showTopicSelection(); // Вызываем показ тем
    return; // Прерываем выполнение, чтобы не отправлять запрос в AI
  }
  showTyping();


  // Режим AI
  if (selectedTopic === "ai_assistant") {
    if (text.toLowerCase() === "/menu") {
      selectedTopic = null;
      addReceivedMessage("Вернулись в главное меню! Выберите тему ↓");
      // Пример: если ответил AI, предложи варианты
      showTopicSelection();
    } else {
      await queryAiAssistant(text);
    }
    hideTyping();
    return;
  }

  // Ожидание ввода для сравнения
  if (selectedTopic === "comparison_waiting_input") {
    await finishComparison(text);
    hideTyping();
    return;
  }

  // Ожидание ввода для прогноза
  if (selectedTopic === "forecast_waiting_input") {
    await finishForecast(text);
    hideTyping();
    return;
  }

  // Ожидание ввода для анализа предмета
  if (selectedTopic === "analysis_by_subject_waiting") {
    await fetchSubjectAnalysis(text);
    selectedTopic = null;
    hideTyping();
    return;
  }

  // Поиск студента
  if (
    ["Поиск студента", "Студентті іздеу", "Search Student"].includes(
      selectedTopic,
    )
  ) {
    await performStudentSearch(text);
    hideTyping();
    return;
  }



  // Авто-поиск по ИИН/ФИО
  const isIIN = /^\d{12}$/.test(text);
  const isFullNameLike =
    text.split(/\s+/).length >= 2 &&
    text.length >= 8 &&
    !text.match(/[\d@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/);
  if (isIIN || isFullNameLike) {
    showYesNoButtons(text);
    hideTyping();
    return;
  }

  addReceivedMessage("Обрабатываю ваш запрос... (функция в разработке)");
  hideTyping();
  startInactivityTimer();
}

function showYesNoButtons(queryText) {
  const container = document.createElement("div");
  container.classList.add("message-container");
  const msg = document.createElement("div");
  msg.classList.add("message", "received");
  msg.innerHTML = `Похоже, вы ищете студента по <strong>"${queryText}"</strong>. Начать поиск?`;
  container.appendChild(msg);

  const btnDiv = document.createElement("div");
  btnDiv.classList.add("language-selection");
  const yesBtn = document.createElement("button");
  yesBtn.classList.add("language-btn");
  yesBtn.style.backgroundColor = "#4CAF50";
  yesBtn.style.color = "white";
  yesBtn.textContent = selectedLanguage === "kz" ? "Иә, іздеу" : "Да, поискать";
  yesBtn.onclick = () => {
    addSentMessage(yesBtn.textContent);
    performStudentSearch(queryText);
  };

  const noBtn = document.createElement("button");
  noBtn.classList.add("language-btn");
  noBtn.style.backgroundColor = "#9E9E9E";
  noBtn.style.color = "white";
  noBtn.textContent = selectedLanguage === "kz" ? "Жоқ" : "Нет";
  noBtn.onclick = () => {
    addSentMessage(noBtn.textContent);
    showTopicSelection();
  };

  btnDiv.appendChild(yesBtn);
  btnDiv.appendChild(noBtn);
  container.appendChild(btnDiv);
  chatMessages.appendChild(container);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ────────────────────────────────────────────────
// 8. ПОИСК СТУДЕНТА
// ────────────────────────────────────────────────
async function performStudentSearch(query) {
  showTyping();

  try {
    const res = await axios.post(`${API_BASE_URL}/search_student`, { query });
    const data = res.data;

    if (!data.found || !data.results || data.results.length === 0) {
      addReceivedMessage(`
<div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); 
            color: white; 
            padding: 28px; 
            border-radius: 20px; 
            margin: 16px 0; 
            text-align: center;
            box-shadow: 0 12px 48px rgba(107,114,128,0.3);">
  <span style="font-size: 56px; display: block; margin-bottom: 16px;">🔍</span>
  <h3 style="margin: 0; font-size: 26px;">Поиск студента</h3>
  <p style="margin: 16px 0 0; font-size: 17px; opacity: 0.95;">
    Никто не найден по запросу "${query}" 😔<br>
    Попробуйте ИИН или полное ФИО.
  </p>
</div>`);
      hideTyping();
      return;
    }

    // Один студент — полная карточка + кнопка подробнее
    if (data.results.length === 1) {
      const s = data.results[0];

      const gpa = Number(s.gpa || 0).toFixed(2);
      const riskColor = (gpa < 2.0 || s.academic_status !== "Полный") 
        ? "#FF6B6B" 
        : (gpa >= 3.0) 
          ? "#34D399" 
          : "#FBBF24";

      let reply = `
<div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); 
            color: white; 
            padding: 28px; 
            border-radius: 20px; 
            margin: 16px 0; 
            box-shadow: 0 12px 48px rgba(59,130,246,0.35);">

  <div style="display: flex; align-items: center; margin-bottom: 24px;">
    <span style="font-size: 56px; margin-right: 20px;">👤</span>
    <div>
      <h3 style="margin: 0; font-size: 28px;">${s.full_name}</h3>
      <small style="opacity: 0.9; font-size: 16px;">ИИН: ${s.iin || '—'}</small>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 24px;">
    <div>
      <div style="font-size: 14px; opacity: 0.9;">Специальность</div>
      <div style="font-size: 18px; font-weight: bold;">${s.specialty_name || s.specialty_code || '—'}</div>
    </div>
    
    <div>
      <div style="font-size: 14px; opacity: 0.9;">Курс</div>
      <div style="font-size: 22px; font-weight: bold;">${s.course || '—'}</div>
    </div>

    <div>
      <div style="font-size: 14px; opacity: 0.9;">Форма оплаты</div>
      <div style="font-size: 18px; font-weight: bold; color: #34D399;">
        ${s.payment_form || '—'}
      </div>
      <small>${s.study_language || '—'}</small>
    </div>

    <div>
      <div style="font-size: 14px; opacity: 0.9;">Статус</div>
      <div style="font-size: 18px; font-weight: bold; color: ${s.academic_status === 'Полный' ? '#34D399' : '#FF6B6B'}">
        ${s.academic_status || '—'}
      </div>
    </div>
  </div>

  <!-- GPA -->
  <div style="background: rgba(255,255,255,0.12); backdrop-filter: blur(8px); 
              padding: 20px; border-radius: 16px; margin-top: 20px;">
    <div style="text-align: center;">
      <div style="font-size: 14px; opacity: 0.9;">GPA</div>
      <div style="font-size: 40px; font-weight: bold; color: ${riskColor}">
        ${gpa}
      </div>
    </div>
  </div>

  <!-- Кнопка подробнее -->
  <div style="margin-top: 24px; text-align: center;">
    <button id="detail-${s.iin}" 
            style="padding: 14px 32px; background: #7C3AED; color: white; 
                   border: none; border-radius: 12px; cursor: pointer; 
                   font-weight: bold; font-size: 16px; transition: all 0.2s;">
      Подробнее (все данные и предметы)
    </button>
  </div>

</div>`;

      addReceivedMessage(reply);

      // Обработчик "Подробнее"
      setTimeout(() => {
        const btn = document.getElementById(`detail-${s.iin}`);
        if (btn) {
          btn.addEventListener("click", () => {
            addSentMessage("Подробнее по " + s.full_name);

            let detailReply = `
<div style="background: linear-gradient(135deg, #1E293B 0%, #111827 100%); 
            color: #E2E8F0; 
            padding: 24px; 
            border-radius: 20px; 
            margin: 16px 0; 
            box-shadow: 0 12px 48px rgba(30,41,59,0.6);">

  <h3 style="margin: 0 0 20px; font-size: 24px; color: #C084FC; text-align: center;">
    ${s.full_name} — полная информация
  </h3>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px; font-size: 15px;">
    <div><strong>Фамилия:</strong> ${s.last_name || '—'}</div>
    <div><strong>Имя:</strong> ${s.first_name || '—'}</div>
    <div><strong>Отчество:</strong> ${s.middle_name || '—'}</div>
    <div><strong>ИИН:</strong> ${s.iin || '—'}</div>
    <div><strong>Код специальности:</strong> ${s.specialty_code || '—'}</div>
    <div><strong>Специальность РУП:</strong> ${s.specialty_name || '—'}</div>
    <div><strong>Год РУП:</strong> ${s.curriculum_year || '—'}</div>
    <div><strong>Год поступления:</strong> ${s.admission_year || '—'}</div>
    <div><strong>Курс:</strong> ${s.course || '—'}</div>
    <div><strong>Форма оплаты:</strong> ${s.payment_form || '—'}</div>
    <div><strong>Язык обучения:</strong> ${s.study_language || '—'}</div>
    <div><strong>Форма обучения:</strong> ${s.study_form || '—'}</div>
    <div><strong>Уровень обучения:</strong> ${s.study_level || '—'}</div>
    <div><strong>Академ. статус:</strong> ${s.academic_status || '—'}</div>
    <div><strong>Статус:</strong> ${s.status || s.academic_status || '—'}</div>
  </div>

  <h4 style="margin: 32px 0 16px; font-size: 22px; color: #A78BFA; text-align: center;">
    Оценки по предметам (${s.subjects_count || 0})
  </h4>

  <div style="max-height: 500px; overflow-y: auto; padding-right: 8px;">
    ${s.all_subjects && s.all_subjects.length > 0 ? `
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: rgba(255,255,255,0.1);">
            <th style="padding: 10px; border-bottom: 1px solid #334155;">Код</th>
            <th style="padding: 10px; border-bottom: 1px solid #334155;">Название</th>
            <th style="padding: 10px; border-bottom: 1px solid #334155;">Атт.1</th>
            <th style="padding: 10px; border-bottom: 1px solid #334155;">Атт.2</th>
            <th style="padding: 10px; border-bottom: 1px solid #334155;">Экзамен</th>
            <th style="padding: 10px; border-bottom: 1px solid #334155;">Итог</th>
            <th style="padding: 10px; border-bottom: 1px solid #334155;">Буква</th>
          </tr>
        </thead>
        <tbody>
          ${s.all_subjects.map(sub => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <td style="padding: 10px;">${sub.subject_code || '—'}</td>
              <td style="padding: 10px;">${sub.subject_name || '—'}</td>
              <td style="padding: 10px;">${sub.attestation1_score || '—'}</td>
              <td style="padding: 10px;">${sub.attestation2_score || '—'}</td>
              <td style="padding: 10px;">${sub.exam_score || '—'}</td>
              <td style="padding: 10px; font-weight: bold; color: ${sub.final_score >= 50 ? '#34D399' : '#FF6B6B'}">
                ${sub.final_score || '—'}
              </td>
              <td style="padding: 10px; color: ${sub.final_score >= 50 ? '#34D399' : '#FF6B6B'}">
                ${sub.letter_grade || '—'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : `
      <div style="text-align: center; padding: 30px; opacity: 0.8; font-size: 16px;">
        Нет оценок по предметам в этой выборке
      </div>`}
  </div>

</div>`;

            addReceivedMessage(detailReply);
          });
        }
      }, 100);
    } else {
      // Несколько студентов — список
      let listReply = `
<div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); 
            color: white; 
            padding: 20px; 
            border-radius: 16px; 
            margin: 12px 0; 
            box-shadow: 0 8px 32px rgba(59,130,246,0.3);">

  <div style="display: flex; align-items: center; margin-bottom: 16px;">
    <span style="font-size: 32px; margin-right: 16px;">👥</span>
    <h3 style="margin: 0; font-size: 22px;">Найдено: ${data.results.length} студентов</h3>
  </div>

  <div style="max-height: 420px; overflow-y: auto; padding-right: 8px;">
    ${data.results.map((s, i) => `
      <div style="background: rgba(255,255,255,0.12); 
                  backdrop-filter: blur(8px); 
                  padding: 16px; 
                  border-radius: 12px; 
                  margin-bottom: 12px; 
                  display: flex; 
                  justify-content: space-between; 
                  align-items: center;">

        <div style="flex: 1;">
          <strong style="font-size: 17px; display: block;">${i+1}. ${s.full_name}</strong>
          <small style="opacity: 0.85; display: block; margin-top: 4px;">
            ИИН: ${s.iin || '—'}<br>
            Курс: ${s.course || '—'} • ${s.specialty_name || '—'}
          </small>
        </div>

        <div style="text-align: right; min-width: 120px;">
          <div style="font-size: 20px; font-weight: bold; color: #60A5FA;">
            GPA: ${Number(s.gpa || 0).toFixed(2)}
          </div>
          <small style="color: ${s.academic_status === 'Полный' ? '#34D399' : '#FF6B6B'}">
            ${s.academic_status || '—'}
          </small>
        </div>
      </div>
    `).join('')}
  </div>

  <div style="margin-top: 16px; text-align: center; font-size: 14px; opacity: 0.9;">
    Для детальной информации введите полный ИИН или точное ФИО
  </div>

</div>`;

      addReceivedMessage(listReply);
    }

  } catch (err) {
    console.error("Ошибка поиска:", err);
    addReceivedMessage(`
<div style="background: #1E1E2E; color: #60A5FA; padding: 20px; border-radius: 16px; text-align: center;">
  <span style="font-size: 36px; display: block; margin-bottom: 12px;">⚠️</span>
  Ошибка при поиске студента<br>
  Попробуйте позже.
</div>`);
  }

  hideTyping();
  startInactivityTimer();
}

// ────────────────────────────────────────────────
// 9. АНАЛИЗ И СТАТИСТИКА
// ────────────────────────────────────────────────
async function fetchCourseAnalysis(courseText) {
  showTyping();

  try {
    // Определяем значение курса для запроса
    let courseValue;
    if (courseText.toLowerCase().includes("магистратура") || courseText.includes("magistratura")) {
      courseValue = "магистратура";
    } else {
      courseValue = parseInt(courseText.replace(/\D/g, "")) || 1;
    }

    // 1. Получаем общую статистику по курсу
    const statsRes = await axios.get(`${API_BASE_URL}/analysis/by_course/${courseValue}`);
    const stats = statsRes.data;

    // Если нет студентов — красивое сообщение
    if (stats.total_students === 0) {
      addReceivedMessage(`
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
                    color: white; padding: 28px; border-radius: 20px; 
                    margin: 16px 0; text-align: center; box-shadow: 0 12px 48px rgba(107,114,128,0.3);">
          <span style="font-size: 56px; display: block; margin-bottom: 16px;">📊</span>
          <h3 style="margin: 0; font-size: 26px;">Курс ${courseText}</h3>
          <p style="margin: 16px 0 0; font-size: 17px; opacity: 0.95;">
            На этом курсе пока нет студентов 😔<br>
            Загрузите новые данные или выберите другой курс.
          </p>
        </div>
      `);
      hideTyping();
      return;
    }

    // Цвета и форматирование GPA (шкала 0.0–4.0)
    const avgGpa = Number(stats.avg_gpa || 0);
    const gpaColor = 
      avgGpa >= 3.0 ? "#34D399" : 
      avgGpa >= 2.0 ? "#FBBF24" : 
      "#FF6B6B";

    const riskColor = stats.at_risk > 0 ? "#FF6B6B" : "#34D399";

    // Красивая карточка статистики
    let statsReply = `
<div style="background: linear-gradient(135deg, #6C63FF 0%, #4834D4 100%); 
            color: white; padding: 24px; border-radius: 20px; 
            margin: 16px 0; box-shadow: 0 12px 48px rgba(108,99,255,0.35);">

  <div style="display: flex; align-items: center; margin-bottom: 24px;">
    <span style="font-size: 40px; margin-right: 20px;">📈</span>
    <h3 style="margin: 0; font-size: 26px;">Анализ курса ${courseText}</h3>
  </div>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 24px; margin-bottom: 28px;">
    <div style="text-align: center; padding: 16px; background: rgba(255,255,255,0.12); border-radius: 16px;">
      <div style="font-size: 15px; opacity: 0.9; margin-bottom: 8px;">Студентов</div>
      <div style="font-size: 42px; font-weight: bold;">${stats.total_students}</div>
    </div>

    <div style="text-align: center; padding: 16px; background: rgba(255,255,255,0.12); border-radius: 16px;">
      <div style="font-size: 15px; opacity: 0.9; margin-bottom: 8px;">Средний GPA</div>
      <div style="font-size: 42px; font-weight: bold; color: ${gpaColor}">
        ${avgGpa.toFixed(2)}
      </div>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
    <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.08); border-radius: 16px;">
      <div style="font-size: 15px; opacity: 0.9; margin-bottom: 8px;">Успеваемость (GPA ≥ 2.0)</div>
      <div style="font-size: 36px; font-weight: bold; color: #34D399;">
        ${stats.success_rate?.toFixed(1) || 0}%
      </div>
    </div>

    <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.08); border-radius: 16px;">
      <div style="font-size: 15px; opacity: 0.9; margin-bottom: 8px;">Студентов под риском</div>
      <div style="font-size: 36px; font-weight: bold; color: ${riskColor}">
        ${stats.at_risk} (${stats.at_risk_percent?.toFixed(1) || 0}%)
      </div>
    </div>
  </div>

  ${stats.at_risk > 0 ? `
  <div style="margin-top: 24px; padding: 16px; background: rgba(255,107,107,0.2); 
              border-radius: 12px; text-align: center; font-size: 15px;">
    ⚠️ Внимание: ${stats.at_risk} студент(ов) в зоне риска (GPA < 1.7 или статус не "Полный")
  </div>` : `
  <div style="margin-top: 24px; padding: 16px; background: rgba(52,211,153,0.2); 
              border-radius: 12px; text-align: center; font-size: 15px;">
    🎉 Отличные показатели! Курс в хорошей форме
  </div>`}

  <!-- Кнопка подробного списка -->
  <div style="margin-top: 32px; text-align: center;">
    <button id="show-course-students-${courseValue}"
            style="padding: 16px 40px; background: #7C3AED; color: white; 
                   border: none; border-radius: 12px; cursor: pointer; 
                   font-weight: bold; font-size: 17px; transition: all 0.2s; 
                   box-shadow: 0 4px 12px rgba(124,58,237,0.4);">
      📋 Показать список студентов
    </button>
  </div>
</div>`;

    addReceivedMessage(statsReply);

    // ────────────────────────────────────────────────
    // Обработчик кнопки «Подробный список»
    // ────────────────────────────────────────────────
    setTimeout(() => {
      const btn = document.getElementById(`show-course-students-${courseValue}`);
      if (btn) {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          btn.textContent = "Загружаю...";
          btn.style.opacity = "0.7";

          try {
            const studentsRes = await axios.get(
              `${API_BASE_URL}/analysis/course_students/${courseValue}?limit=50`
            );
            const data = studentsRes.data;

            if (!data.students?.length) {
              addReceivedMessage(`
                <div style="background: #1E293B; color: #94A3B8; padding: 24px; 
                            border-radius: 16px; text-align: center;">
                  На курсе пока нет студентов для отображения.
                </div>
              `);
              return;
            }

            let listReply = `
<div style="background: linear-gradient(135deg, #1E293B 0%, #111827 100%);
            color: #E2E8F0; padding: 24px; border-radius: 20px; 
            margin: 16px 0; box-shadow: 0 12px 48px rgba(30,41,59,0.6);">

  <h3 style="margin: 0 0 24px; font-size: 24px; text-align: center; color: #C084FC;">
    Студенты курса ${courseText} (${data.shown} из ${data.total})
  </h3>

  <div style="max-height: 520px; overflow-y: auto; padding-right: 12px;">
    ${data.students.map((s, i) => {
      const gpa = Number(s.cumulative_gpa || s.gpa || 0).toFixed(2);
      const color = s.is_at_risk ? "#FF6B6B" : "#34D399";

      return `
      <div style="background: ${s.is_at_risk ? "rgba(255,107,107,0.18)" : "rgba(52,211,153,0.18)"}; 
                  padding: 16px; border-radius: 12px; margin-bottom: 12px; 
                  display: flex; justify-content: space-between; align-items: center; 
                  border-left: 4px solid ${color};">
        <div style="flex: 1;">
          <strong style="font-size: 18px; display: block;">${i + 1}. ${s.full_name}</strong>
          <small style="opacity: 0.85; display: block; margin-top: 4px;">
            ИИН: ${s.iin} • ${s.specialty_name || s.specialty_code || "—"}<br>
            ${s.academic_status || s.status || "—"}
          </small>
        </div>
        <div style="text-align: right; min-width: 110px;">
          <div style="font-size: 24px; font-weight: bold; color: ${color}">
            ${gpa}
          </div>
          <small style="color: ${color};">GPA</small>
        </div>
      </div>`;
    }).join("")}
  </div>

  <div style="margin-top: 20px; text-align: center; font-size: 14px; opacity: 0.8;">
    Показано ${data.shown} студентов • Сортировка от худших к лучшим
  </div>
</div>`;

            addReceivedMessage(listReply);
          } catch (err) {
            console.error("Ошибка загрузки списка:", err);
            addReceivedMessage(`
              <div style="background: #991b1b33; color: #fee2e2; padding: 20px; 
                          border-radius: 16px; text-align: center;">
                Не удалось загрузить список студентов 😔
              </div>
            `);
          }

          btn.disabled = false;
          btn.textContent = "📋 Показать список студентов";
          btn.style.opacity = "1";
        });
      }
    }, 100);

  } catch (err) {
    console.error("Ошибка анализа курса:", err);
    addReceivedMessage(`
      <div style="background: #1E1E2E; color: #FCA5A5; padding: 24px; 
                  border-radius: 16px; text-align: center; margin: 16px 0;">
        <span style="font-size: 36px; display: block; margin-bottom: 12px;">⚠️</span>
        Не удалось загрузить анализ курса<br>
        Попробуйте позже или проверьте данные.
      </div>
    `);
  }

  hideTyping();
  startInactivityTimer();
}
async function fetchAtRiskStudents(levelText) {
  showTyping();
  try {
    let threshold = levelText.includes("1.0")
      ? "critical"
      : levelText.includes("1.5")
        ? "low"
        : "all";
    const res = await axios.get(`${API_BASE_URL}/analysis/at_risk`, {
      params: { threshold },
    });
    const data = res.data;
    if (!data.found) {
      addReceivedMessage("Студентов под риском не найдено.");
    } else {
      addReceivedMessage(`⚠️ Студентов под риском: ${data.total_at_risk}`);
    }
  } catch (err) {
    addReceivedMessage("Ошибка загрузки списка риска");
  }
  hideTyping();
}

async function fetchSubjectAnalysis(subjectName) {
  showTyping();
  try {
    const res = await axios.get(`${API_BASE_URL}/analysis/by_subject`, {
      params: { subject: subjectName.trim() },
    });
    const data = res.data;
    if (!data.found) {
      addReceivedMessage("Данных по дисциплине нет.");
    } else {
      addReceivedMessage(
        `📚 ${subjectName}: Средний балл ${data.avg_score?.toFixed(1)}`,
      );
    }
  } catch (err) {
    addReceivedMessage("Ошибка анализа дисциплины");
  }
  hideTyping();
}

// ────────────────────────────────────────────────
// 10. СРАВНЕНИЕ И ПРОГНОЗ
// ────────────────────────────────────────────────
function startComparison(type) {
  addReceivedMessage(
    type.includes("курс")
      ? "Введите два номера курса (через пробел)"
      : "Введите названия двух групп",
  );
  selectedTopic = "comparison_waiting_input";
  selectedSubTopic = type;
}

async function finishComparison(inputText) {
  showTyping();
  try {
    const parts = inputText.trim().split(/\s+/);
    if (parts.length < 2) {
      addReceivedMessage("Введите два значения через пробел");
      return;
    }
    const res = await axios.get(`${API_BASE_URL}/analysis/compare`, {
      params: {
        type: selectedSubTopic.includes("курс") ? "course" : "group",
        value1: parts[0],
        value2: parts[1],
      },
    });
    addReceivedMessage(`Результат сравнения: ${parts[0]} vs ${parts[1]}`);
  } catch (err) {
    addReceivedMessage("Ошибка сравнения");
  }
  selectedTopic = null;
  hideTyping();
}

function startForecast(type) {
  addReceivedMessage("Введите данные для прогноза (ИИН или Название)");
  selectedTopic = "forecast_waiting_input";
  selectedSubTopic = type;
  if (type.includes("Общий")) finishForecast("all");
}

async function finishForecast(input) {
  showTyping();
  try {
    const res = await axios.get(`${API_BASE_URL}/analysis/forecast`, {
      params: { scope: selectedSubTopic, student: input },
    });
    addReceivedMessage(`🔮 Прогноз: ${res.data.forecast}`);
  } catch (err) {
    addReceivedMessage("Ошибка прогноза");
  }
  selectedTopic = null;
  hideTyping();
}

// ────────────────────────────────────────────────
// 11. AI АССИСТЕНТ (OpenRouter)
// ────────────────────────────────────────────────
async function queryAiAssistant(question) {
  showTyping();
  try {
    const OPENROUTER_API_KEY =
      "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";
    const lang =
      { kz: "казахский", ru: "русский", en: "английский" }[selectedLanguage] ||
      "русский";
    const systemPrompt = `Ты — SHAM AI, ассистент университета. Язык: ${lang}... (и другие правила)`;

    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "arcee-ai/trinity-large-preview:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    let aiText = res.data.choices[0].message.content.trim();
    addReceivedMessage(aiText);
    // Пример: если ответил AI, предложи варианты
    addQuickReplies(["Вернуться в меню", "Показать мой GPA", "Помощь"]);
  } catch (err) {
    addReceivedMessage("Ошибка AI 😔");
  }
  hideTyping();
}

// ────────────────────────────────────────────────
// 12. ПУТЕВОДИТЕЛЬ (Guide)
// ────────────────────────────────────────────────
async function fetchGuideSections() {
  showTyping();
  try {
    const res = await axios.get(`${API_BASE_URL}/api/guide_sections`);
    const sections = res.data;
    const container = document.createElement("div");
    container.classList.add("message-container");
    const grid = document.createElement("div");
    grid.classList.add("guide-grid");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(2, 1fr)";
    grid.style.gap = "10px";

    sections.forEach((sec) => {
      const card = document.createElement("div");
      card.style.background = "#6366F1";
      card.style.color = "white";
      card.style.padding = "10px";
      card.style.borderRadius = "10px";
      card.style.cursor = "pointer";
      card.innerHTML = `<span>${sec.icon || "📖"}</span><h4>${sec[`title_${selectedLanguage}`] || sec.title_ru}</h4>`;
      card.onclick = () => {
        addSentMessage(sec.title_ru);
        fetchGuideContent(sec.key, sec.title_ru);
      };
      grid.appendChild(card);
    });
    container.appendChild(grid);
    chatMessages.appendChild(container);
  } catch (err) {
    addReceivedMessage("Ошибка загрузки путеводителя");
  }
  hideTyping();
}

async function fetchGuideContent(key, title) {
  showTyping();

  try {
    const res = await axios.get(`${API_BASE_URL}/api/guide/${key}`);
    const data = res.data;

    console.log("📄 Данные раздела:", data);

    // Контент с fallback
    const content =
      data[`content_${selectedLanguage}`] ||
      data.content_ru ||
      data.content_kz ||
      data.content_en ||
      "Описание раздела пока отсутствует...";

    const shortDesc =
      data[`short_${selectedLanguage}`] ||
      data.short_ru ||
      data.short_kz ||
      data.short_en ||
      "";

    // ДВА разных URL
    const viewUrl = `${API_BASE_URL}/api/guide/${key}/pdf/view`;      // inline — открытие
    const downloadUrl = `${API_BASE_URL}/api/guide/${key}/pdf/download`; // attachment — скачивание

    // Создаём сообщение через DOM
    const container = document.createElement("div");
    container.classList.add("message-container");

    const msg = document.createElement("div");
    msg.classList.add("message", "received");
    msg.style.cssText = `
      background: linear-gradient(135deg, #1E293B 0%, #111827 100%);
      color: #E2E8F0;
      padding: 28px;
      border-radius: 20px;
      box-shadow: 0 12px 48px rgba(30,41,59,0.6);
      border: 1px solid #334155;
    `;

    // Заголовок + иконка
    const header = document.createElement("div");
    header.style.cssText = "display: flex; align-items: center; margin-bottom: 24px; gap: 20px;";

    const icon = document.createElement("span");
    icon.style.cssText = "font-size: 52px; flex-shrink: 0;";
    icon.textContent = data.icon || "📖";

    const titleBlock = document.createElement("div");
    const h3 = document.createElement("h3");
    h3.style.cssText = "margin: 0; font-size: 28px; color: #C084FC;";
    h3.textContent = title;

    titleBlock.appendChild(h3);

    if (shortDesc) {
      const p = document.createElement("p");
      p.style.cssText = "margin: 8px 0 0; font-size: 16px; opacity: 0.85;";
      p.textContent = shortDesc;
      titleBlock.appendChild(p);
    }

    header.appendChild(icon);
    header.appendChild(titleBlock);
    msg.appendChild(header);

    // Текст
    const textDiv = document.createElement("div");
    textDiv.style.cssText = "font-size: 16px; line-height: 1.7; margin-bottom: 28px;";
    textDiv.innerHTML = content.replace(/\n/g, "<br>");
    msg.appendChild(textDiv);

    // PDF блок
    const pdfBlock = document.createElement("div");
    pdfBlock.style.cssText = `
      background: rgba(124,58,237,0.15);
      border: 1px solid rgba(124,58,237,0.3);
      border-radius: 16px;
      padding: 20px;
      margin-top: 24px;
    `;

    const pdfTitle = document.createElement("h4");
    pdfTitle.style.cssText = "margin: 0 0 16px; font-size: 20px; color: #A78BFA; text-align: center;";
    pdfTitle.textContent = "Прикреплённый документ";
    pdfBlock.appendChild(pdfTitle);

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;";

    // Кнопка ОТКРЫТЬ (inline)
    const openBtn = document.createElement("button");
    openBtn.textContent = "👁️ Открыть PDF в браузере";
    openBtn.style.cssText = `
      flex: 1;
      min-width: 180px;
      padding: 14px 24px;
      background: linear-gradient(90deg, #7C3AED, #A78BFA);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(124,58,237,0.4);
    `;
    openBtn.addEventListener("click", () => {
      console.log("Открываем (view):", viewUrl);
      window.open(viewUrl, "_blank", "noopener,noreferrer,width=1000,height=800");
    });
    btnRow.appendChild(openBtn);

    // Кнопка СКАЧАТЬ (attachment)
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "⬇️ Скачать PDF";
    downloadBtn.style.cssText = openBtn.style.cssText.replace("#7C3AED, #A78BFA", "#6D28D9, #9333EA");
    downloadBtn.addEventListener("click", () => {
      console.log("Скачиваем (download):", downloadUrl);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = data.pdf_filename || `Путеводитель_${key}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    btnRow.appendChild(downloadBtn);

    pdfBlock.appendChild(btnRow);

    const infoP = document.createElement("p");
    infoP.style.cssText = "margin: 16px 0 0; text-align: center; font-size: 14px; opacity: 0.8;";
    infoP.innerHTML = data.pdf_filename 
      ? `Файл: <strong>${data.pdf_filename}</strong> • Доступен`
      : "PDF доступен";
    pdfBlock.appendChild(infoP);

    msg.appendChild(pdfBlock);

    // Полезные ссылки (если есть)
    if (data.links && data.links.length > 0) {
      const linksDiv = document.createElement("div");
      linksDiv.style.marginTop = "28px";

      const h5 = document.createElement("h5");
      h5.style.cssText = "margin: 0 0 12px; font-size: 18px; color: #A78BFA; text-align: center;";
      h5.textContent = "Полезные ссылки";
      linksDiv.appendChild(h5);

      const ul = document.createElement("ul");
      ul.style.cssText = "list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;";

      data.links.forEach(link => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = link;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = link;
        a.style.cssText = `
          display: block;
          padding: 12px 16px;
          background: rgba(124,58,237,0.15);
          border-radius: 12px;
          color: #C084FC;
          text-decoration: none;
        `;
        li.appendChild(a);
        ul.appendChild(li);
      });

      linksDiv.appendChild(ul);
      msg.appendChild(linksDiv);
    }

    container.appendChild(msg);
    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;

  } catch (err) {
    console.error("Ошибка:", err);
    addReceivedMessage(`
      <div style="background: #1E1E2E; color: #FCA5A5; padding: 24px; border-radius: 16px; text-align: center;">
        <span style="font-size: 48px;">😔</span><br>
        Не удалось открыть раздел.<br>
        Ошибка: ${err.message || "проверь консоль (F12)"}
      </div>
    `);
  }

  hideTyping();
  startInactivityTimer();
}

// ────────────────────────────────────────────────
// 13. ОБРАБОТЧИКИ СОБЫТИЙ (Events)
// ────────────────────────────────────────────────
sendBtn.addEventListener("click", handleSend);

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

messageInput.addEventListener("input", () => {
  updateInputButtons();
  startInactivityTimer();
});

menuBtn.addEventListener("click", () => {
  showTopicSelection();
  addReceivedMessage("Главное меню открыто ↓");
});

expandBtn.addEventListener("click", (e) => {
    // Останавливаем распространение события, чтобы не срабатывали другие меню
    e.stopPropagation();
    
    chatContainer.classList.toggle("expanded");

    // Меняем иконку
    expandBtn.textContent = chatContainer.classList.contains("expanded")
        ? "⤢" 
        : "⤡";

    chatMessages.scrollTop = chatMessages.scrollHeight;
});

chatToggle.addEventListener("click", () => {
  const hidden = chatContainer.style.display === "none";
  chatContainer.style.display = hidden ? "flex" : "none";
  if (hidden) {
    if (!selectedLanguage) showLanguageSelection();
    startInactivityTimer();
  }
});

themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark-theme");
  chatContainer.classList.toggle("dark-theme");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark-theme") ? "dark" : "light",
  );
});


// Открытие меню
settingsTrigger.addEventListener("click", (e) => {
    e.stopPropagation(); // Изолируем клик
    const isVisible = settingsMenu.style.display === "flex";
    settingsMenu.style.display = isVisible ? "none" : "flex";
});

// Закрытие меню при клике в любом месте экрана
document.addEventListener("click", (e) => {
    // Если клик был вне меню и вне кнопки три точки — закрываем
    if (!settingsMenu.contains(e.target) && e.target !== settingsTrigger) {
        settingsMenu.style.display = "none";
    }
})

settingsBtn.addEventListener("click", () => {
  settingsMenu.style.display =
    settingsMenu.style.display === "none" || !settingsMenu.style.display
      ? "flex"
      : "none";
});



// -──────────────────────────────────────────────
// 14. УМНЫЙ СКРОЛЛ (Smart Scroll)
// -──────────────────────────────────────────────
function scrollToBottom() {
  const threshold = 150; // Расстояние от низа, при котором скролл сработает
  const isNearBottom =
    chatMessages.scrollHeight -
      chatMessages.scrollTop -
      chatMessages.clientHeight <
    threshold;

  if (isNearBottom) {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: "smooth",
    });
  }
}

// Также можно добавить кнопку "Вниз", если пользователь проскроллил наверх
chatMessages.addEventListener("scroll", () => {
  // Тут можно реализовать появление кнопки "Новые сообщения ↓", если нужно
});

// ────────────────────────────────────────────────
// 15. Быстрые ответы (кнопки под сообщением)
// ────────────────────────────────────────────────
function addQuickReplies(replies) {
  // Перед добавлением новых, удаляем старые, если они были
  removeQuickReplies();

  const container = document.createElement("div");
  container.id = "quick-replies-wrapper"; // Добавляем ID для легкого поиска
  container.classList.add("quick-replies-container");
  container.style.cssText =
    "display: flex; gap: 8px; flex-wrap: wrap; ";
  replies.forEach((text) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    // Твой стиль
    btn.style.cssText =
      "padding: 8px 16px; border-radius: 20px; border: 1px solid #6366f1; background: transparent; color: #6366f1; cursor: pointer; font-size: 13px; transition: 0.3s;";

    btn.onmouseover = () => {
      btn.style.background = "#6366f1";
      btn.style.color = "white";
    };
    btn.onmouseout = () => {
      btn.style.background = "transparent";
      btn.style.color = "#6366f1";
    };

    btn.onclick = () => {
      removeQuickReplies(); // Удаляем весь контейнер
      messageInput.value = text;
      handleSend();
    };
    container.appendChild(btn);
  });

  chatMessages.appendChild(container);
  scrollToBottom();
}

// Новая вспомогательная функция для удаления
function removeQuickReplies() {
  const wrapper = document.getElementById("quick-replies-wrapper");
  if (wrapper) wrapper.remove();
}

// ────────────────────────────────────────────────
// 16. Индикатор печати (Typing Indicator)
// ────────────────────────────────────────────────
function showTyping() {
  // Если индикатор уже есть, не добавляем второй
  if (document.getElementById("typing")) return;

  const wrapper = document.createElement("div");
  wrapper.classList.add("message-wrapper");
  wrapper.id = "typing";

  // Создаем аватарку для индикатора
  const avatar = document.createElement("div");
  avatar.classList.add("bot-avatar");
  avatar.innerHTML = `<img src="https://img.icons8.com/fluency/48/robot-2.png" alt="bot">`;

  // Создаем сами точки
  const typing = document.createElement("div");
  typing.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;

  wrapper.appendChild(avatar);
  wrapper.appendChild(typing);

  chatMessages.appendChild(wrapper);
  scrollToBottom();
}



