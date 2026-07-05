const CONFIG = {
  submitApiUrl: "APPS_SCRIPT_WEB_APP_URL_HERE",
  pageTitle: "ITQ 엑셀 함수 75제 온라인 숙제장"
};

const state = {
  functions: [],
  students: [],
  selectedFunction: null,
  lastFocusedElement: null
};

const elements = {};
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".xlsm"];

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  document.title = CONFIG.pageTitle;
  cacheElements();
  bindEvents();
  await Promise.all([loadStudents(), loadFunctions()]);
}

function cacheElements() {
  elements.studentSelect = document.querySelector("#student-select");
  elements.studentMessage = document.querySelector("#student-message");
  elements.searchInput = document.querySelector("#search-input");
  elements.levelFilter = document.querySelector("#level-filter");
  elements.resultCount = document.querySelector("#result-count");
  elements.pageMessage = document.querySelector("#page-message");
  elements.functionList = document.querySelector("#function-list");
  elements.emptyMessage = document.querySelector("#empty-message");
  elements.functionError = document.querySelector("#function-error");
  elements.submitBackdrop = document.querySelector("#submit-backdrop");
  elements.submitPanel = document.querySelector("#submit-panel");
  elements.submitClose = document.querySelector("#submit-close");
  elements.selectedStudent = document.querySelector("#selected-student");
  elements.selectedFunction = document.querySelector("#selected-function");
  elements.submitForm = document.querySelector("#submit-form");
  elements.solutionFile = document.querySelector("#solution-file");
  elements.submitButton = document.querySelector("#submit-button");
  elements.submitStatus = document.querySelector("#submit-status");
  elements.submitMessage = document.querySelector("#submit-message");
}

function bindEvents() {
  elements.searchInput.addEventListener("input", applyFilters);
  elements.levelFilter.addEventListener("change", applyFilters);
  elements.studentSelect.addEventListener("change", clearStudentMessage);
  elements.submitClose.addEventListener("click", closeSubmitPanel);
  elements.submitBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.submitBackdrop) {
      closeSubmitPanel();
    }
  });
  elements.submitForm.addEventListener("submit", handleSubmit);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.submitBackdrop.hidden) {
      closeSubmitPanel();
    }
  });
}

async function loadStudents() {
  try {
    const response = await fetch("data/students.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("students.json load failed");
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("students.json must contain an array");
    }

    state.students = data.filter((student) => student.id && student.name);
    renderStudentOptions();
  } catch (error) {
    elements.studentSelect.disabled = true;
    showStudentMessage("학생 명단을 불러오지 못했습니다.", "error");
  }
}

async function loadFunctions() {
  try {
    const response = await fetch("data/functions.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("functions.json load failed");
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("functions.json must contain an array");
    }

    state.functions = data.filter(isValidFunction);
    elements.functionList.setAttribute("aria-busy", "false");
    applyFilters();
  } catch (error) {
    elements.functionList.setAttribute("aria-busy", "false");
    elements.functionError.hidden = false;
    elements.resultCount.textContent = "";
  }
}

function isValidFunction(item) {
  return Boolean(
    item &&
    item.id &&
    item.name &&
    item.displayName &&
    item.problemUrl
  );
}

function renderStudentOptions() {
  const fragment = document.createDocumentFragment();

  state.students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student.id;
    option.textContent = student.name;
    fragment.append(option);
  });

  elements.studentSelect.append(fragment);
}

function applyFilters() {
  const query = elements.searchInput.value.trim().toLocaleLowerCase("ko");
  const selectedLevel = (elements.levelFilter.value || "전체").trim();

  const filteredFunctions = state.functions.filter((item) => {
    const searchableText = [
      item.id,
      item.name,
      item.displayName,
      item.description || ""
    ].join(" ").toLocaleLowerCase("ko");

    const matchesQuery = !query || searchableText.includes(query);
    const itemLevel = (item.level || "미분류").trim();
    const matchesLevel =
      selectedLevel === "전체" || itemLevel === selectedLevel;

    return matchesQuery && matchesLevel;
  });

  renderFunctionCards(filteredFunctions);
}

function renderFunctionCards(functions) {
  elements.functionList.replaceChildren();
  const fragment = document.createDocumentFragment();

  functions.forEach((item) => {
    fragment.append(createFunctionCard(item));
  });

  elements.functionList.append(fragment);
  elements.emptyMessage.hidden = functions.length !== 0;
  elements.resultCount.textContent = `총 ${functions.length}개 함수가 표시됩니다.`;
}

function createFunctionCard(item) {
  const article = document.createElement("article");
  article.className = "function-card";

  const top = document.createElement("div");
  top.className = "function-card__top";

  const number = document.createElement("span");
  number.className = "function-number";
  number.textContent = item.id;

  const level = document.createElement("span");
  level.className = "level-badge";
  level.textContent = item.level || "미분류";

  top.append(number, level);

  const title = document.createElement("h3");
  title.textContent = item.name;

  const displayName = document.createElement("p");
  displayName.className = "display-name";
  displayName.textContent = item.displayName;

  const description = document.createElement("p");
  description.className = "description";
  description.textContent = item.description || "간단설명이 아직 등록되지 않았습니다.";

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const problemLink = document.createElement("a");
  problemLink.className = "button button--problem";
  problemLink.href = item.problemUrl;
  problemLink.target = "_blank";
  problemLink.rel = "noopener noreferrer";
  problemLink.textContent = "문제 파일 열기";
  problemLink.setAttribute("aria-label", `${item.displayName} 문제 파일 새 창에서 열기`);

  const copyButton = document.createElement("button");
  copyButton.className = "button button--copy";
  copyButton.type = "button";
  copyButton.textContent = "AI 질문 프롬프트 복사";
  copyButton.addEventListener("click", () => copyAiPrompt(item));

  const submitOpenButton = document.createElement("button");
  submitOpenButton.className = "button button--open-submit";
  submitOpenButton.type = "button";
  submitOpenButton.textContent = "이 함수 제출하기";
  submitOpenButton.addEventListener("click", () => openSubmitPanel(item, submitOpenButton));

  actions.append(problemLink, copyButton, submitOpenButton);
  article.append(top, title, displayName, description, actions);

  return article;
}

async function copyAiPrompt(item) {
  const prompt = `저는 ITQ 엑셀 함수 예제를 풀고 있습니다.
정답을 바로 알려주지 말고, 제가 스스로 풀 수 있도록 힌트 중심으로 도와주세요.

함수명: ${item.displayName}
제가 입력한 수식:
나온 결과 또는 오류:
제가 원하는 결과:
제가 헷갈리는 부분:`;

  try {
    await copyText(prompt);
    showPageMessage("AI 질문 프롬프트가 복사되었습니다.");
  } catch (error) {
    showPageMessage("프롬프트를 복사하지 못했습니다. 다시 시도하세요.");
  }
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      // 브라우저가 클립보드 권한을 막으면 아래의 호환 방식으로 다시 시도합니다.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Clipboard copy failed");
  }
}

function openSubmitPanel(item, triggerElement) {
  const student = getSelectedStudent();

  if (!student) {
    showStudentMessage("이름을 먼저 선택하세요.", "error");
    elements.studentSelect.focus();
    return;
  }

  state.selectedFunction = item;
  state.lastFocusedElement = triggerElement;
  elements.selectedStudent.textContent = `${student.name} (${student.id})`;
  elements.selectedFunction.textContent = item.displayName;
  elements.submitForm.reset();
  setSubmitStatus("준비중", "info");
  showSubmitMessage("");
  elements.submitBackdrop.hidden = false;
  document.body.classList.add("modal-open");
  elements.submitClose.focus();
}

function closeSubmitPanel() {
  elements.submitBackdrop.hidden = true;
  document.body.classList.remove("modal-open");
  state.selectedFunction = null;

  if (state.lastFocusedElement) {
    state.lastFocusedElement.focus();
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const student = getSelectedStudent();
  const selectedFunction = state.selectedFunction;
  const file = elements.solutionFile.files[0];

  if (!student || !selectedFunction) {
    setSubmitStatus("제출 실패", "error");
    showSubmitMessage("이름과 함수를 다시 선택하세요.", "error");
    return;
  }

  const fileError = validateSubmitFile(file);

  if (fileError) {
    setSubmitStatus("제출 실패", "error");
    showSubmitMessage(fileError, "error");
    elements.solutionFile.focus();
    return;
  }

  const submitApiUrl = CONFIG.submitApiUrl.trim();
  if (
    !submitApiUrl ||
    submitApiUrl === "APPS_SCRIPT_WEB_APP_URL_HERE"
  ) {
    setSubmitStatus("준비중", "info");
    showSubmitMessage(
      "제출 기능이 아직 연결되지 않았습니다. 강사에게 문의하세요.",
      "error"
    );
    return;
  }

  setSubmitStatus("제출 중입니다. 잠시만 기다려 주세요.", "info");
  showSubmitMessage("");
  elements.submitButton.disabled = true;

  try {
    const fileBase64 = await fileToBase64(file);
    const payload = {
      studentId: student.id,
      studentName: student.name,
      functionId: selectedFunction.id,
      functionName: selectedFunction.name,
      displayName: selectedFunction.displayName,
      originalFileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileBase64
    };
    const result = await submitAssignment(payload);
    const resultDetails = [
      result.savedFileName
        ? `저장파일명: ${result.savedFileName}`
        : "",
      result.submitCount
        ? `제출횟수: ${result.submitCount}`
        : ""
    ].filter(Boolean).join(" / ");

    setSubmitStatus("제출이 완료되었습니다.", "success");
    showSubmitMessage(resultDetails, "success");
  } catch (error) {
    setSubmitStatus("제출 실패", "error");
    showSubmitMessage(
      error.message || "제출 처리 중 알 수 없는 오류가 발생했습니다.",
      "error"
    );
  } finally {
    elements.submitButton.disabled = false;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const commaIndex = result.indexOf(",");

      if (commaIndex === -1) {
        reject(new Error("파일을 base64로 변환하지 못했습니다."));
        return;
      }

      resolve(result.slice(commaIndex + 1));
    };

    reader.onerror = () => {
      reject(new Error("첨부 파일을 읽지 못했습니다."));
    };

    reader.readAsDataURL(file);
  });
}

async function submitAssignment(payload) {
  let response;

  try {
    response = await fetch(CONFIG.submitApiUrl.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    throw new Error(
      `제출 서버에 연결하지 못했습니다. Web App URL과 배포 권한을 확인하세요. (${error.message})`
    );
  }

  const responseText = await response.text();
  let result;

  try {
    result = JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      `서버 응답을 확인할 수 없습니다. HTTP 상태: ${response.status}`
    );
  }

  if (!response.ok || !result.ok) {
    throw new Error(
      result.message || `제출 요청에 실패했습니다. HTTP 상태: ${response.status}`
    );
  }

  return result;
}

function validateSubmitFile(file) {
  if (!file) {
    return "제출할 파일을 선택하세요.";
  }

  const lowerName = file.name.toLocaleLowerCase("en");
  const isAllowed = ALLOWED_EXTENSIONS.some(
    (extension) => lowerName.endsWith(extension)
  );

  if (!isAllowed) {
    return ".xlsx, .xls, .xlsm 파일만 제출할 수 있습니다.";
  }

  return "";
}

function getSelectedStudent() {
  return state.students.find(
    (student) => student.id === elements.studentSelect.value
  ) || null;
}

function setSubmitStatus(message, type) {
  elements.submitStatus.textContent = message;
  elements.submitStatus.dataset.state = type;
}

function showStudentMessage(message, type = "") {
  elements.studentMessage.textContent = message;
  elements.studentMessage.className = `field-message${type ? ` is-${type}` : ""}`;
}

function clearStudentMessage() {
  showStudentMessage("");
}

function showSubmitMessage(message, type = "") {
  elements.submitMessage.textContent = message;
  elements.submitMessage.className = `field-message${type ? ` is-${type}` : ""}`;
}

function showPageMessage(message) {
  elements.pageMessage.textContent = message;
  elements.pageMessage.hidden = false;
  window.clearTimeout(showPageMessage.timer);
  showPageMessage.timer = window.setTimeout(() => {
    elements.pageMessage.hidden = true;
  }, 3500);
}
