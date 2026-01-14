const elMessages = document.getElementById("messages");
const elInput = document.getElementById("input");
const elSend = document.getElementById("btnSend");
const elClear = document.getElementById("btnClear");

const STORAGE_KEY = "chat_messages_v1";

// 1) Kies je API route:
// - Als je reverse proxy gebruikt: "/api/chat"
// - Als je lokaal test met losse poort: "http://localhost:3000/api/chat"
const API_URL = "/api/chat";
const API_FALLBACK = "http://localhost:3000/api/chat";

let isBusy = false;

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function saveMessages(messages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function renderSystemLine(text) {
  const div = document.createElement("div");
  div.className = "systemline";
  div.textContent = text;
  elMessages.appendChild(div);
  elMessages.scrollTop = elMessages.scrollHeight;
}

function renderMessage(role, text, time = nowTime()) {
  const msg = document.createElement("div");
  msg.className = `msg ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = time;

  if (role !== "user") {
    const avatar = document.createElement("div");
    avatar.className = "avatar bot";
    msg.appendChild(avatar);
  }

  const stack = document.createElement("div");
  stack.appendChild(bubble);
  stack.appendChild(meta);

  msg.appendChild(stack);
  elMessages.appendChild(msg);

  elMessages.scrollTop = elMessages.scrollHeight;
}

function setBusy(busy) {
  isBusy = busy;
  elSend.disabled = busy;
  elInput.disabled = busy;
  elSend.textContent = busy ? "Bezig…" : "Verzenden";
}

function autosizeTextarea() {
  elInput.style.height = "auto";
  elInput.style.height = Math.min(elInput.scrollHeight, 160) + "px";
}

async function postChat(message) {
  const payload = { message };

  // Probeer eerst API_URL (voor productie / reverse proxy)
  // en als dat faalt: fallback naar localhost:3000 (voor lokale dev)
  const tryOnce = async (url) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${txt}`.trim());
    }
    return res.json();
  };

  try {
    return await tryOnce(API_URL);
  } catch (e) {
    // Alleen fallback proberen als je op localhost zit
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
      return await tryOnce(API_FALLBACK);
    }
    throw e;
  }
}

function restore() {
  const messages = loadMessages();
  if (!messages.length) {
    renderSystemLine("Nieuwe chat gestart. Geen historie gevonden, dus: schoon begin.");
    return;
  }

  messages.forEach(m => renderMessage(m.role, m.text, m.time));
  renderSystemLine("Historie hersteld uit je browser (localStorage).");
}

function persistAppend(role, text, time) {
  const messages = loadMessages();
  messages.push({ role, text, time });
  saveMessages(messages);
}

async function sendCurrent() {
  const text = elInput.value.trim();
  if (!text || isBusy) return;

  elInput.value = "";
  autosizeTextarea();

  const t = nowTime();
  renderMessage("user", text, t);
  persistAppend("user", text, t);

  setBusy(true);

  try {
    const data = await postChat(text);
    const reply = (data && data.reply) ? data.reply : "Geen response ontvangen.";
    const tb = nowTime();
    renderMessage("bot", reply, tb);
    persistAppend("bot", reply, tb);
  } catch (err) {
    const tb = nowTime();
    const msg = "Ik krijg geen antwoord van de backend. Check of de API draait en of /api/chat bereikbaar is.";
    renderMessage("bot", msg, tb);
    persistAppend("bot", msg, tb);
  } finally {
    setBusy(false);
    elInput.focus();
  }
}

elSend.addEventListener("click", sendCurrent);

elClear.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  elMessages.innerHTML = "";
  renderSystemLine("Gesprek gewist.");
  elInput.focus();
});

elInput.addEventListener("input", autosizeTextarea);

elInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendCurrent();
  }
});

restore();
autosizeTextarea();
elInput.focus();
