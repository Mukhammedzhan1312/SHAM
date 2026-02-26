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
// document.addEventListener("DOMContentLoaded", () => {
//   // Восстановление сообщений
//   // const saved = JSON.parse(localStorage.getItem("chatMessages") || "[]");
//   // Восстанавливаем сообщения (внутри DOMContentLoaded)
//   saved.forEach((msg) => {
//     const c = document.createElement("div");
//     c.classList.add("message-container");
//     const m = document.createElement("div");
//     m.classList.add("message", msg.type === "received" ? "received" : "");

//     if (msg.isImage) {
//       const img = document.createElement("img");
//       img.src = msg.text;
//       m.appendChild(img);
//     } else {
//       m.innerHTML = msg.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
//     }

//     c.appendChild(m);
//     chatMessages.appendChild(c);
//   });
//   chatMessages.scrollTop = chatMessages.scrollHeight;

//   // Тема
//   if (localStorage.getItem("theme") === "dark") {
//     document.body.classList.add("dark-theme");
//     chatContainer.classList.add("dark-theme");
//     themeToggle.checked = true;
//   }

//   // Проверка языка
//   selectedLanguage = localStorage.getItem("language");
//   if (!selectedLanguage || !["kz", "ru", "en"].includes(selectedLanguage)) {
//     localStorage.removeItem("language");
//     showLanguageSelection();
//   } else {
//     updatePlaceholder();
//     showGreeting();
//     showTopicSelection();
//   }

//   updateInputButtons();
// });

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

  // Если в тексте есть градиент (карточка анализа или студента)
  if (text.includes("linear-gradient")) {
    // 1. Создаем обертку, чтобы аватар и карточка стояли в ряд
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display: flex; align-items: flex-end; gap: 8px; width: 100%; justify-content: flex-start; margin-bottom: 10px;";

    // 2. Добавляем аватарку бота
    const avatar = document.createElement("div");
    avatar.classList.add("bot-avatar");
    avatar.innerHTML = `<img src="https://img.icons8.com/fluency/48/robot-2.png" alt="bot">`;

    // 3. Создаем контейнер для самой карточки
    const cardContent = document.createElement("div");
    cardContent.style.flex = "0 1 auto"; 
    cardContent.style.maxWidth = "85%"; // Ограничиваем, чтобы не прилипало к правому краю
    cardContent.innerHTML = text;

    wrapper.appendChild(avatar);
    wrapper.appendChild(cardContent);
    container.appendChild(wrapper);
  } else {
    // Стандартный код для обычных текстовых сообщений
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", "received");

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
  
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });

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

const gpaState =
  avgGpa >= 3.0 ? "good" :
  avgGpa >= 2.0 ? "warn" :
  "bad";

const riskState = stats.at_risk > 0 ? "bad" : "good";

let statsReply = `
<div class="ai-analytics-wrapper">

<style>
.ai-analytics-wrapper * {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.ai-analytics-card {
  background: linear-gradient(135deg, #1f1f3a 0%, #2c2f70 100%);
  border-radius: 24px;
  padding: 28px;
  color: #ffffff;
  box-shadow: 0 20px 60px rgba(0,0,0,0.35);
  backdrop-filter: blur(14px);
  transition: all 0.25s ease;
  margin: 20px 0;
}

.ai-analytics-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 30px 80px rgba(0,0,0,0.45);
}

.ai-analytics-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 28px;
}

.ai-analytics-icon {
  font-size: 42px;
}

.ai-analytics-title {
  font-size: 24px;
  font-weight: 700;
}

.ai-analytics-subtitle {
  font-size: 14px;
  opacity: 0.7;
}

.ai-analytics-grid {
  display: grid;
  gap: 20px;
  margin-bottom: 24px;
}

.ai-analytics-grid-primary {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.ai-analytics-grid-secondary {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.ai-analytics-metric {
  padding: 20px;
  border-radius: 18px;
  background: rgba(255,255,255,0.08);
  text-align: center;
  transition: all 0.2s ease;
}

.ai-analytics-metric:hover {
  background: rgba(255,255,255,0.14);
}

.ai-analytics-label {
  font-size: 14px;
  opacity: 0.85;
  margin-bottom: 8px;
}

.ai-analytics-value {
  font-size: 38px;
  font-weight: 700;
}

.ai-analytics-value-good {
  color: #34D399;
}

.ai-analytics-value-warn {
  color: #FBBF24;
}

.ai-analytics-value-bad {
  color: #FF6B6B;
}

.ai-analytics-alert {
  margin-top: 12px;
  padding: 16px;
  border-radius: 14px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
}

.ai-analytics-alert-good {
  background: rgba(52,211,153,0.18);
  color: #34D399;
}

.ai-analytics-alert-bad {
  background: rgba(255,107,107,0.18);
  color: #FF6B6B;
}

.ai-analytics-footer {
  margin-top: 30px;
  text-align: center;
}

.ai-analytics-btn {
  padding: 14px 38px;
  background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
  color: white;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 6px 20px rgba(124,58,237,0.4);
}

.ai-analytics-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(124,58,237,0.6);
}

.ai-analytics-btn:active {
  transform: translateY(0);
}
</style>

<div class="ai-analytics-card">

  <div class="ai-analytics-header">
    <div class="ai-analytics-icon">📊</div>
    <div>
      <div class="ai-analytics-title">
        Анализ курса ${courseText}
      </div>
      <div class="ai-analytics-subtitle">
        Академическая статистика
      </div>
    </div>
  </div>

  <div class="ai-analytics-grid ai-analytics-grid-primary">
    
    <div class="ai-analytics-metric">
      <div class="ai-analytics-label">Студентов</div>
      <div class="ai-analytics-value">
        ${stats.total_students}
      </div>
    </div>

    <div class="ai-analytics-metric">
      <div class="ai-analytics-label">Средний GPA</div>
      <div class="ai-analytics-value ai-analytics-value-${gpaState}">
        ${avgGpa.toFixed(2)}
      </div>
    </div>

  </div>

  <div class="ai-analytics-grid ai-analytics-grid-secondary">

    <div class="ai-analytics-metric">
      <div class="ai-analytics-label">Успеваемость (GPA ≥ 2.0)</div>
      <div class="ai-analytics-value ai-analytics-value-good">
        ${stats.success_rate?.toFixed(1) || 0}%
      </div>
    </div>

    <div class="ai-analytics-metric">
      <div class="ai-analytics-label">Студентов под риском</div>
      <div class="ai-analytics-value ai-analytics-value-${riskState}">
        ${stats.at_risk} (${stats.at_risk_percent?.toFixed(1) || 0}%)
      </div>
    </div>

  </div>

  ${
    stats.at_risk > 0
      ? `<div class="ai-analytics-alert ai-analytics-alert-bad">
           ⚠ ${stats.at_risk} студент(ов) в зоне риска (GPA &lt; 1.7 или статус не "Полный")
         </div>`
      : `<div class="ai-analytics-alert ai-analytics-alert-good">
           🎉 Отличные показатели! Курс в хорошей форме
         </div>`
  }

  <div class="ai-analytics-footer">
    <button id="show-course-students-${courseValue}" class="ai-analytics-btn">
      📋 Показать список студентов
    </button>
  </div>

</div>
</div>
`;

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
    let params = {};
    if (levelText.includes("1.0") || levelText.includes("критично")) {
      params.threshold = "critical";
    } else if (levelText.includes("1.5")) {
      params.threshold = "low";
    } else if (levelText.includes("2+") || levelText.includes("2+ пән")) {
      params.threshold = "multiple_low";
    } else {
      params.threshold = "all";
    }

    const res = await axios.get(`${API_BASE_URL}/analysis/at_risk`, { params });
    const data = res.data;

    if (!data.found || data.students.length === 0) {
      addReceivedMessage(`
<div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
            color: white; 
            padding: 24px; 
            border-radius: 16px; 
            margin: 16px 0; 
            box-shadow: 0 10px 40px rgba(16,185,129,0.3); 
            text-align: center;">

  <span style="font-size: 48px; display: block; margin-bottom: 16px;">🎉</span>
  <h3 style="margin: 0; font-size: 24px;">Отличные новости!</h3>
  <p style="margin: 12px 0 0; font-size: 16px; opacity: 0.95;">
    На данный момент студентов под риском нет<br>
    Курс/группа в отличной форме!
  </p>
</div>`);
      hideTyping();
      return;
    }

    // Красивая карточка с общим обзором
    let overview = `
<div style="background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%); 
            color: white; 
            padding: 20px; 
            border-radius: 16px; 
            margin: 12px 0 20px; 
            box-shadow: 0 8px 32px rgba(239,68,68,0.3);">

  <div style="display: flex; align-items: center; margin-bottom: 16px;">
    <span style="font-size: 32px; margin-right: 16px;">⚠️</span>
    <h3 style="margin: 0; font-size: 22px;">Студенты под риском</h3>
  </div>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; text-align: center;">
    <div>
      <div style="font-size: 14px; opacity: 0.9;">Всего под риском</div>
      <div style="font-size: 36px; font-weight: bold;">${data.total_at_risk}</div>
    </div>
    
    <div>
      <div style="font-size: 14px; opacity: 0.9;">Показано</div>
      <div style="font-size: 36px; font-weight: bold;">${data.students.length}</div>
    </div>
  </div>

  <div style="margin-top: 20px; font-size: 15px; opacity: 0.9; text-align: center;">
    Уровень: <strong>${levelText}</strong>
  </div>
</div>`;

    // Список студентов — карточки с цветовой индикацией
    let studentsList = data.students
      .map(
        (s, i) => `
<div style="background: rgba(255,255,255,0.08); 
            backdrop-filter: blur(10px); 
            border: 1px solid rgba(255,255,255,0.12); 
            padding: 16px; 
            border-radius: 12px; 
            margin-bottom: 12px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;">

  <div style="flex: 1;">
    <strong style="font-size: 16px; display: block;">${i + 1}. ${s.full_name}</strong>
    <small style="opacity: 0.8; display: block; margin-top: 4px;">
      ИИН: ${s.iin} • Курс: ${s.course || "—"} • Группа: ${s.group || "—"}
    </small>
  </div>

  <div style="text-align: right; min-width: 100px;">
    <div style="font-size: 20px; font-weight: bold; color: #FF6B6B;">
      GPA: ${s.gpa?.toFixed(2) || "—"}
    </div>
    <small style="color: #FFCCC8;">
      ${s.low_scores || 0} низких оценок
    </small>
  </div>
</div>
`,
      )
      .join("");

    let fullReply =
      overview +
      `
<div style="background: #111827; 
            color: #E0E0FF; 
            padding: 20px; 
            border-radius: 16px; 
            max-height: 400px; 
            overflow-y: auto; 
            border: 1px solid #EF444433;">
  ${studentsList}
</div>`;

    if (data.total_at_risk > data.students.length) {
      fullReply += `
<div style="text-align: center; margin-top: 16px; font-size: 14px; opacity: 0.8;">
  Показано ${data.students.length} из ${data.total_at_risk}. 
  Остальные студенты — по дополнительному запросу.
</div>`;
    }

    addReceivedMessage(fullReply);
  } catch (err) {
    console.error(err);
    addReceivedMessage(`
<div style="background: #1E1E2E; color: #FFCCC8; padding: 20px; border-radius: 16px; text-align: center;">
  <span style="font-size: 32px; display: block; margin-bottom: 12px;">😔</span>
  <strong>Не удалось загрузить список студентов под риском</strong><br>
  Попробуйте позже или проверьте подключение.
</div>`);
  }

  hideTyping();
  startInactivityTimer();
}


async function fetchSubjectAnalysis(subjectName) {
  showTyping();

  try {
    const res = await axios.get(`${API_BASE_URL}/analysis/by_subject`, {
      params: { subject: subjectName.trim() },
    });

    const data = res.data;

    if (!data.found || data.total_students === 0) {
      addReceivedMessage(`
<div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); 
            color: white; 
            padding: 24px; 
            border-radius: 16px; 
            margin: 16px 0; 
            text-align: center;
            box-shadow: 0 10px 40px rgba(107,114,128,0.3);">
  <span style="font-size: 48px; display: block; margin-bottom: 16px;">📉</span>
  <h3 style="margin: 0; font-size: 24px;">По дисциплине "${subjectName}"</h3>
  <p style="margin: 12px 0 0; font-size: 16px; opacity: 0.95;">
    Данных пока нет 😔<br>
    Загрузите оценки по этой дисциплине!
  </p>
</div>`);
      hideTyping();
      return;
    }

 let reply = `
<div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: #e2e8f0;
            padding: clamp(16px, 5vw, 28px);
            border-radius: 24px;
            margin: 16px 0;
            box-shadow: 0 12px 48px rgba(0,0,0,0.5);
            border: 1px solid #334155;
            max-width: 100%;
            overflow-x: auto;">

  <!-- Заголовок -->
  <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 16px;">
    <div style="display: flex; align-items: center; gap: 16px;">
      <span style="font-size: clamp(32px, 8vw, 40px);">📚</span>
      <h3 style="margin: 0; font-size: clamp(20px, 5vw, 26px); font-weight: 700; color: #c084fc;">
        ${subjectName}
      </h3>
    </div>
    <div style="font-size: clamp(12px, 3vw, 14px); opacity: 0.8; background: rgba(139,92,246,0.15); padding: 8px 16px; border-radius: 20px; white-space: nowrap;">
      Анализ дисциплины
    </div>
  </div>

  <!-- Основные метрики (адаптивная сетка) -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 28px;">
    <div style="background: rgba(30,41,59,0.6); backdrop-filter: blur(8px); padding: 16px; border-radius: 16px; text-align: center; border: 1px solid #475569; min-height: 120px;">
      <div style="font-size: clamp(12px, 3vw, 14px); opacity: 0.8; margin-bottom: 8px;">Студентов</div>
      <div style="font-size: clamp(32px, 8vw, 42px); font-weight: 800; color: #c084fc;">
        ${data.total_students}
      </div>
    </div>
    
    <div style="background: rgba(30,41,59,0.6); backdrop-filter: blur(8px); padding: 16px; border-radius: 16px; text-align: center; border: 1px solid #475569; min-height: 120px;">
      <div style="font-size: clamp(12px, 3vw, 14px); opacity: 0.8; margin-bottom: 8px;">Средний балл</div>
      <div style="font-size: clamp(32px, 8vw, 42px); font-weight: 800; color: ${data.avg_score >= 70 ? '#34d399' : data.avg_score >= 50 ? '#fbbf24' : '#ff6b6b'}">
        ${data.avg_score?.toFixed(1) || "—"}
      </div>
    </div>
  </div>

  <!-- Успеваемость + Не сдали -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 28px;">
    <div style="background: rgba(52,211,153,0.12); padding: 16px; border-radius: 16px; text-align: center; border: 1px solid rgba(52,211,153,0.3); min-height: 120px;">
      <div style="font-size: clamp(12px, 3vw, 14px); opacity: 0.8; margin-bottom: 8px;">Успеваемость (≥50)</div>
      <div style="font-size: clamp(28px, 7vw, 38px); font-weight: 800; color: #34d399;">
        ${data.success_rate?.toFixed(1) || "—"}%
      </div>
      <div style="font-size: clamp(12px, 3vw, 14px); opacity: 0.8; margin-top: 8px;">
        Сдали: ${data.passed || 0}
      </div>
    </div>
    
    <div style="background: rgba(239,68,68,0.12); padding: 16px; border-radius: 16px; text-align: center; border: 1px solid rgba(239,68,68,0.3); min-height: 120px;">
      <div style="font-size: clamp(12px, 3vw, 14px); opacity: 0.8; margin-bottom: 8px;">Не сдали</div>
      <div style="font-size: clamp(28px, 7vw, 38px); font-weight: 800; color: #ff6b6b;">
        ${data.failed || 0}
      </div>
      <div style="font-size: clamp(12px, 3vw, 14px); opacity: 0.8; margin-top: 8px;">
        (${(100 - (data.success_rate || 0)).toFixed(1)}%)
      </div>
    </div>
  </div>

  <!-- Максимальный балл -->
  <div style="margin-bottom: 28px; padding: 20px; background: rgba(52,211,153,0.12); border-radius: 16px; text-align: center; border: 1px solid rgba(52,211,153,0.3);">
    <div style="font-size: clamp(14px, 3.5vw, 16px); opacity: 0.8; margin-bottom: 8px;">Максимальный балл</div>
    <div style="font-size: clamp(36px, 9vw, 48px); font-weight: 900; color: #34d399;">
      ${data.max_score || "—"}
    </div>
  </div>

  <!-- Специальности (РУП) -->
  <div style="background: rgba(30,41,59,0.6); backdrop-filter: blur(8px); padding: 24px; border-radius: 16px; border: 1px solid #475569;">
    <h4 style="margin: 0 0 20px; font-size: clamp(16px, 4vw, 20px); text-align: center; color: #c084fc;">
      Сравнение по специальностям (РУП)
    </h4>

    <div style="display: grid; gap: 16px;">
      ${data.best_specialty ? `
      <div style="padding: 16px; background: rgba(52,211,153,0.2); border-radius: 12px; border: 1px solid #34d39933;">
        <div style="font-size: clamp(14px, 3.5vw, 16px); font-weight: bold; color: #34d399;">Лучшая РУП</div>
        <div style="margin: 8px 0 4px; font-size: clamp(16px, 4vw, 18px);">
          ${data.best_specialty.code} (${data.best_specialty.name})
        </div>
        <div style="font-size: clamp(13px, 3vw, 14px); opacity: 0.9;">
          Средний балл: <strong>${data.best_specialty.avg_score}</strong> • ${data.best_specialty.total_students} студентов
        </div>
      </div>` : ""}

      ${data.worst_specialty ? `
      <div style="padding: 16px; background: rgba(239,68,68,0.2); border-radius: 12px; border: 1px solid #ff6b6b33;">
        <div style="font-size: clamp(14px, 3.5vw, 16px); font-weight: bold; color: #ff6b6b;">Худшая РУП</div>
        <div style="margin: 8px 0 4px; font-size: clamp(16px, 4vw, 18px);">
          ${data.worst_specialty.code} (${data.worst_specialty.name})
        </div>
        <div style="font-size: clamp(13px, 3vw, 14px); opacity: 0.9;">
          Средний балл: <strong>${data.worst_specialty.avg_score}</strong> • ${data.worst_specialty.total_students} студентов
        </div>
      </div>` : ""}

      ${data.top3_specialties?.length > 0 ? `
      <div style="margin-top: 16px;">
        <div style="font-size: clamp(13px, 3vw, 15px); opacity: 0.9; text-align: center; margin-bottom: 12px;">Топ-3 специальности</div>
        <div style="display: grid; gap: 12px;">
          ${data.top3_specialties.map((s, i) => `
            <div style="padding: clamp(10px, 2vw, 14px); background: rgba(51,65,85,0.4); border-radius: 12px; display: flex; flex-direction: column; gap: 4px; border: 1px solid #475569;">
              <div style="font-weight: 600; font-size: clamp(14px, 3.5vw, 16px);">
                #${i+1}: ${s.code} (${s.name})
              </div>
              <div style="display: flex; justify-content: space-between; font-size: clamp(13px, 3vw, 14px);">
                <span>Балл: <strong style="color: #34d399;">${s.avg_score}</strong></span>
                <span>${s.total_students} ст.</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>` : ""}
    </div>
  </div>

  <!-- Футер -->
  <div style="margin-top: 28px; text-align: center; font-size: clamp(12px, 3vw, 14px); opacity: 0.8;">
    Данные на основе final_score • ${new Date().toLocaleDateString()}
  </div>

</div>`;

    addReceivedMessage(reply);
  } catch (err) {
    console.error(err);
    addReceivedMessage(`
<div style="background: #1E1E2E; color: #FBBF24; padding: 20px; border-radius: 16px; text-align: center;">
  <span style="font-size: 36px; display: block; margin-bottom: 12px;">⚠️</span>
  Не удалось загрузить анализ по дисциплине<br>
  Попробуйте позже.
</div>`);
  }

  hideTyping();
  startInactivityTimer();
}

// ────────────────────────────────────────────────
// 10. СРАВНЕНИЕ И ПРОГНОЗ
// ────────────────────────────────────────────────
function startComparison(type) {
  // Определяем тексты
  const isKz = selectedLanguage === "kz";
  const title = isKz ? "Салыстыруды бастау" : "Начать сравнение";
  
  const promptText = isKz
      ? type.includes("Курстар")
        ? "Екі курс нөмірін енгізіңіз (мысалы: 1 3)"
        : "Екі топ атауын енгізіңіз (мысалы: ИТ-11 ИТ-21)"
      : type.includes("курсами")
        ? "Введите два номера курса (например: 1 3)"
        : "Введите названия двух групп (например: ИТ-11 ИТ-21)";

  // Создаем красивую карточку-подсказку
  const comparisonUI = `
<div style="background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); 
            color: white; 
            padding: 20px; 
            border-radius: 18px; 
            margin: 10px 0; 
            box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
            display: flex;
            align-items: center;
            gap: 15px;">
  <div style="font-size: 30px;">⚖️</div>
  <div>
    <h4 style="margin: 0; font-size: 16px; opacity: 0.9;">${title}</h4>
    <p style="margin: 5px 0 0; font-size: 14px; font-weight: 500;">${promptText}</p>
  </div>
</div>`;

  // Выводим через твою обновленную функцию (которая теперь умеет ставить карточки слева)
  addReceivedMessage(comparisonUI);

  // Логика остается прежней
  selectedTopic = "comparison_waiting_input";
  selectedSubTopic = type;
}


async function finishComparison(inputText) {
  showTyping();

  try {
    const parts = inputText.trim().split(/\s+/);
    if (parts.length < 2) {
      addReceivedMessage("Нужно ввести два значения для сравнения (через пробел)");
      hideTyping();
      return;
    }

    const [value1, value2] = parts;
    const isCourse = selectedSubTopic.includes("курс") || selectedSubTopic.includes("Курстар");

    const res = await axios.get(`${API_BASE_URL}/analysis/compare`, {
      params: {
        type: isCourse ? "course" : "group",
        value1: value1,
        value2: value2,
      },
    });

    const data = res.data;

    if (!data.found) {
      addReceivedMessage("Не удалось найти данные для сравнения 😔");
      hideTyping();
      return;
    }

    // РАСЧЕТЫ
    const leftGPA = Number(data.left.avg_gpa || data.left.avg_score || 0);
    const rightGPA = Number(data.right.avg_gpa || data.right.avg_score || 0);
    const diffAvg = (leftGPA - rightGPA).toFixed(2);
    const leftWinner = leftGPA > rightGPA;
    
    // ИСПРАВЛЕНИЕ: Берем корректные поля успеваемости/качества из ответа сервера
    const leftQuality = Number(data.left.success_rate || data.left.quality || 0).toFixed(1);
    const rightQuality = Number(data.right.success_rate || data.right.quality || 0).toFixed(1);

    const getProgress = (val) => Math.min((val / 4) * 100, 100);

    let reply = `
<div style="background: linear-gradient(160deg, #1a1c2e 0%, #0f172a 100%); 
            color: white; padding: 35px; border-radius: 28px; margin: 20px 0; 
            box-shadow: 0 25px 60px rgba(0,0,0,0.5); border: 1px solid rgba(139, 92, 246, 0.25);
            font-family: 'Segoe UI', Roboto, sans-serif; width: 100%; max-width: 700px; box-sizing: border-box;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="background: rgba(139, 92, 246, 0.15); display: inline-block; padding: 10px 20px; border-radius: 25px; margin-bottom: 15px; border: 1px solid rgba(167, 139, 250, 0.2);">
        <span style="font-size: 28px;">📊</span> <b style="color: #a78bfa; letter-spacing: 1.5px; text-transform: uppercase; font-size: 13px;">Сравнительный анализ данных</b>
    </div>
    <h3 style="margin: 0; font-size: 32px; background: linear-gradient(to right, #fff, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
        ${value1} <span style="color: #64748b; font-size: 22px;">vs</span> ${value2}
    </h3>
  </div>

  <div style="display: flex; flex-direction: column; gap: 25px;">
    
    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 18px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="text-align: center; flex: 1;">
            <div style="font-size: 26px; font-weight: bold; color: #fff;">${data.left.total_students || 0}</div>
            <div style="font-size: 12px; opacity: 0.6;">Контингент</div>
        </div>
        <div style="font-size: 24px; color: #6d28d9; background: rgba(109, 40, 217, 0.2); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">👥</div>
        <div style="text-align: center; flex: 1;">
            <div style="font-size: 26px; font-weight: bold; color: #fff;">${data.right.total_students || 0}</div>
            <div style="font-size: 12px; opacity: 0.6;">Контингент</div>
        </div>
    </div>

    <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px;">
            <span>Средний балл (GPA) ${leftWinner ? '🏆' : ''}</span>
            <span style="color: #a78bfa; font-weight: bold; font-size: 18px;">${leftGPA.toFixed(2)}</span>
        </div>
        <div style="height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
            <div style="width: ${getProgress(leftGPA)}%; height: 100%; background: linear-gradient(90deg, #6366f1, #a78bfa); box-shadow: 0 0 15px rgba(167, 139, 250, 0.4);"></div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px;">
            <span>Средний балл (GPA) ${!leftWinner ? '🏆' : ''}</span>
            <span style="color: #a78bfa; font-weight: bold; font-size: 18px;">${rightGPA.toFixed(2)}</span>
        </div>
        <div style="height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden;">
            <div style="width: ${getProgress(rightGPA)}%; height: 100%; background: linear-gradient(90deg, #6366f1, #f472b6); box-shadow: 0 0 15px rgba(244, 114, 182, 0.4);"></div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="background: rgba(52, 211, 153, 0.08); border: 1px solid rgba(52, 211, 153, 0.2); padding: 20px; border-radius: 20px; text-align: center;">
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 8px; color: #34d399;">Качество знаний</div>
            <div style="font-size: 24px; font-weight: bold;">${leftQuality}% <span style="font-size: 14px; opacity: 0.5;">vs</span> ${rightQuality}%</div>
        </div>
        <div style="background: rgba(251, 113, 133, 0.08); border: 1px solid rgba(251, 113, 133, 0.2); padding: 20px; border-radius: 20px; text-align: center;">
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 8px; color: #fb7185;">Риск отчисления</div>
            <div style="font-size: 24px; font-weight: bold;">${data.left.at_risk} <span style="font-size: 14px; opacity: 0.5;">/</span> ${data.right.at_risk}</div>
        </div>
    </div>

    <div style="background: rgba(139, 92, 246, 0.05); border-left: 4px solid #6d28d9; padding: 15px 20px; border-radius: 0 12px 12px 0; font-size: 14px; line-height: 1.5; color: #cbd5e1;">
        <strong>Аналитический вывод:</strong> ${leftWinner ? value1 : value2} опережает по академическим показателям на ${Math.abs(diffAvg)} балла. 
        ${Number(leftQuality) > Number(rightQuality) ? value1 : value2} демонстрирует более высокую стабильность обучения.
    </div>
  </div>

  <button onclick="downloadComparisonPdf('${value1}', '${value2}', ${leftGPA}, ${rightGPA})" 
          style="width: 100%; margin-top: 30px; background: linear-gradient(90deg, #6d28d9, #4f46e5); color: white; border: none; 
                 padding: 16px; border-radius: 16px; cursor: pointer; font-weight: bold; font-size: 16px;
                 transition: all 0.3s; box-shadow: 0 10px 25px rgba(109, 40, 217, 0.4); display: flex; align-items: center; justify-content: center; gap: 10px;">
    <span>📥</span> Скачать детализированный PDF отчет
  </button>
</div>`;

    addReceivedMessage(reply);
  } catch (err) {
    console.error(err);
    addReceivedMessage("Ошибка при сравнении данных.");
  }
  selectedTopic = null;
  selectedSubTopic = null;
  hideTyping();
}

function downloadComparisonPdf(val1, val2, gpa1, gpa2) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Сравнение ${val1} vs ${val2}</title>
                <style>
                    body { font-family: sans-serif; padding: 50px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #6d28d9; padding-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                    th, td { border: 1px solid #ddd; padding: 15px; text-align: center; }
                    th { background-color: #f3f4f6; }
                    .footer { margin-top: 50px; font-size: 12px; color: #777; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Аналитический отчет сравнения</h1>
                    <p>Сгенерировано системой StudentPerf Bot</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Параметр</th>
                            <th>${val1}</th>
                            <th>${val2}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Средний GPA</td>
                            <td>${gpa1.toFixed(2)}</td>
                            <td>${gpa2.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Статус анализа</td>
                            <td colspan="2">${gpa1 > gpa2 ? val1 : val2} показывает лучшие результаты</td>
                        </tr>
                    </tbody>
                </table>
                <div class="footer">Дата отчета: ${new Date().toLocaleString()}</div>
                <script>
                    window.onload = function() { window.print(); window.close(); };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// ──────────────────────────────────────────────
// 10. ПРОГНОЗ
// ──────────────────────────────────────────────
function startForecast(type) {
  const isKz = selectedLanguage === "kz";
  const title = isKz ? "AI Болжам" : "AI Прогноз успеваемости";
  const promptText = isKz 
    ? "Болжам жасау үшін ИИН немесе аты-жөніңізді енгізіңіз" 
    : "Введите ИИН или ФИО студента для построения прогноза";

  const forecastUI = `
<div style="background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); 
            color: white; padding: 20px; border-radius: 18px; margin: 10px 0; 
            box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3); display: flex; align-items: center; gap: 15px;">
  <div style="font-size: 30px;">🔮</div>
  <div>
    <h4 style="margin: 0; font-size: 16px; opacity: 0.9;">${title}</h4>
    <p style="margin: 5px 0 0; font-size: 14px; font-weight: 500;">${promptText}</p>
  </div>
</div>`;

  addReceivedMessage(forecastUI);

  selectedTopic = "forecast_waiting_input";
  selectedSubTopic = type;
  if (type.includes("Общий") || type.includes("Жалпы")) finishForecast("all");
}

async function finishForecast(input) {
  showTyping();
  try {
    const res = await axios.get(`${API_BASE_URL}/analysis/forecast`, {
      params: { scope: selectedSubTopic, student: input },
    });

    const data = res.data;
    if (!data.found && input !== "all") {
        addReceivedMessage("Студент не найден для построения прогноза 😔");
        hideTyping();
        return;
    }

    // Параметры для красоты (можно подстроить под данные с твоего бэкенда)
    const prob = Number(data.probability || 85); // Вероятность успешного завершения
    const trend = data.trend || "up"; // Направление: up, down, stable
    const predictedGpa = Number(data.predicted_gpa || 3.2).toFixed(2);

    let reply = `
<div style="background: linear-gradient(160deg, #1e1b4b 0%, #312e81 100%); 
            color: white; padding: 30px; border-radius: 28px; margin: 20px 0; 
            box-shadow: 0 25px 50px rgba(0,0,0,0.4); border: 1px solid rgba(236, 72, 153, 0.3);
            width: 100%; max-width: 650px; box-sizing: border-box;">
  
  <div style="text-align: center; margin-bottom: 25px;">
    <div style="background: rgba(236, 72, 153, 0.15); display: inline-block; padding: 8px 18px; border-radius: 20px; margin-bottom: 12px;">
        <span style="font-size: 20px;">✨</span> <b style="color: #f472b6; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Аналитика будущего</b>
    </div>
    <h3 style="margin: 0; font-size: 28px; background: linear-gradient(to right, #fff, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
        ${input === "all" ? "Общий прогноз курса" : "Прогноз: " + (data.student_name || input)}
    </h3>
  </div>

  <div style="display: flex; flex-direction: column; gap: 20px;">
    
    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 13px; opacity: 0.7; margin-bottom: 10px;">Ожидаемый GPA к концу семестра</div>
        <div style="font-size: 42px; font-weight: bold; color: #fb7185; text-shadow: 0 0 15px rgba(251, 113, 133, 0.4);">
            ${predictedGpa} ${trend === 'up' ? '📈' : '📉'}
        </div>
    </div>

    <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
            <span>Вероятность успеха (Pass Rate)</span>
            <span style="color: #f472b6; font-weight: bold;">${prob}%</span>
        </div>
        <div style="height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden;">
            <div style="width: ${prob}%; height: 100%; background: linear-gradient(90deg, #8b5cf6, #ec4899); box-shadow: 0 0 10px rgba(236, 72, 153, 0.5);"></div>
        </div>
    </div>

    <div style="background: rgba(255,255,255,0.03); border-left: 4px solid #ec4899; padding: 15px 20px; border-radius: 0 15px 15px 0;">
        <div style="font-size: 13px; font-weight: bold; color: #f472b6; margin-bottom: 5px;">🤖 Резюме AI:</div>
        <div style="font-size: 14px; line-height: 1.6; color: #e2e8f0;">
            ${data.forecast || "На основе текущей активности ожидается стабильный результат. Рекомендуется сфокусироваться на дисциплинах с низким текущим баллом."}
        </div>
    </div>
  </div>
  
  <div style="margin-top: 25px; text-align: center; font-size: 11px; opacity: 0.5;">
    * Прогноз построен на основе нейронной сети Trinity-Large
  </div>
</div>`;

    addReceivedMessage(reply);
  } catch (err) {
    console.error(err);
    addReceivedMessage("Ошибка при построении прогноза 😔");
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
    // Твой реальный ключ OpenRouter
    const OPENROUTER_API_KEY = "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";

    // Язык пользователя
    const langMap = { kz: "казахский", ru: "русский", en: "английский" };
    const lang = langMap[selectedLanguage] || "русский";

    // Системный промпт (тот, что ты указал — без изменений)
    const systemPrompt = `Ты — SHAM AI, супер-полезный ассистент ТОЛЬКО для студентов и преподавателей университета.

Твоя задача — помогать с:
- успеваемостью, GPA, оценками, дисциплинами
- поиском студентов
- анализом курсов и групп
- путеводителем по университету (Оңай карта, регистрация, стипендии, общежитие и т.д.)
- мотивацией и советами по учёбе

СТРОГИЕ ПРАВИЛА (ВЫПОЛНЯЙ ВСЕГДА):

1. Отвечай ИСКЛЮЧИТЕЛЬНО на языке пользователя: сейчас это ${lang}.  
   НИКОГДА не смешивай языки!

2. Оставайся СТРОГО в теме университета.  
   Если вопрос совсем не по теме — отвечай вежливо:  
   "Извини, я помогаю только по студенческим и университетским вопросам 😊  
   Задай что-нибудь про учёбу, оценки, курсы или Путеводитель!"

3. Если вопрос требует реальных данных из базы (GPA, оценки, конкретный студент, дисциплина, курс, группа):  
   - НИКОГДА НЕ ПРИДУМЫВАЙ цифры и факты!  
   - Отвечай ВСЕГДА ТОЛЬКО так:  
     "Я не вижу твоих данных в чате. используй функции бота и там вам показываеть реальные данный:  
     • Поиск студента  
     • Анализ по дисциплине  
     • Анализ по курсу  
     • Сравнение"  
   - После этого ОБЯЗАТЕЛЬНО добавь вопрос:  
     "Хочешь вернуться в главное меню и выбрать нужную функцию? 😊"  
   - Если пользователь ответит "да", "хочу", "покажи меню", "меню", "вернись в меню" или что-то подобное — В ОБЯЗАТЕЛЬНОМ ПОРЯДКЕ ответь ТОЛЬКО:  
     "Возвращаю в главное меню..."  
     и добавь команду для фронта: [SHOW_MAIN_MENU]  
     Больше ничего не пиши!

4. Если вопрос про процедуры университета (Оңай карта, стипендия, регистрация, общежитие, Карта кампуса ну если спрашиваеть какойта здания или корпус например как ГУК НК и т.д.):  
   - Дай КРАТКИЙ и правильный ответ  
   - ОБЯЗАТЕЛЬНО предложи открыть раздел Путеводителя в формате:  
     [BUTTON:Открыть раздел «Название»|key_razdela]  
   Примеры ключей (используй ТОЛЬКО эти!):  
     - Оңай карта → onay_student_transport_card  
     - Регистрация на курс → registratsiya_kurs  
     - Стипендии и гранты → stipendii_granty  
     - Общежитие → obshezhitie  
     - Расписание → raspisanie  
     - Справки и документы → spravki_dokumenty
     - Карта кампуса → campus_map  
   - Никогда не пиши ключ в обычном тексте! Только внутри [BUTTON:...|key]

5. Стиль общения:
   - Дружелюбный, поддерживающий, мотивирующий
   - Краткий, но с нужными деталями
   - Всегда заканчивай вопросом или предложением: "Чем ещё помочь? 😊" или "Хочешь открыть раздел?"
   - Используй эмодзи 😊📚🔥🎓💪

6. Никогда не ругайся, не обижайся, не выходи за рамки темы.

Текущий язык: ${lang} — отвечай ТОЛЬКО на нём!
Ты — лучший помощник студента! 🚀`;

    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "arcee-ai/trinity-large-preview:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        temperature: 0.7,
        max_tokens: 800
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5502",
          "X-Title": "StudentPerf AI Assistant"
        },
        timeout: 30000
      }
    );

    let aiText = res.data.choices[0].message.content.trim();

    // Обработка кнопок [BUTTON:Текст|key]
    const buttonRegex = /\[BUTTON:(.+?)\|(.+?)\]/g;
    let buttonsHtml = "";

    aiText = aiText.replace(buttonRegex, (match, btnText, key) => {
      buttonsHtml += `
        <button 
          onclick="openGuideSection('${key.trim()}')"
          style="margin: 8px 4px; padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold;">
          ${btnText.trim()} →
        </button>
      `;
      return ""; // убираем кнопку из текста
    });

    addReceivedMessage(aiText);

    // Если есть кнопки — добавляем их отдельным сообщением
    if (buttonsHtml) {
      addReceivedMessage(`
        <div style="margin-top: 12px; text-align: center;">
          ${buttonsHtml}
        </div>
      `);
    }

  } catch (err) {
    console.error("OpenRouter ошибка:", err);

    let msg = "Не удалось получить ответ от AI 😔";
    if (err.response?.status === 404) msg += "<br>404 — неверная модель или endpoint";
    if (err.response?.status === 401) msg += "<br>401 — неверный API-ключ";
    if (err.response?.status === 429) msg += "<br>429 — лимит запросов, подожди";

    addReceivedMessage(`
<div style="background: #1E1E2E; color: #FCA5A5; padding: 24px; border-radius: 16px; text-align: center;">
  <span style="font-size: 40px; display: block; margin-bottom: 16px;">⚠️</span>
  ${msg}<br>
  Проверь ключ и модель на openrouter.ai
</div>`);
  }

  hideTyping();
  startInactivityTimer();
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



