const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

process.env.TZ = "Europe/Amsterdam";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cors());

// Serve static files (widget)
app.use(express.static(path.join(__dirname, "public")));

const MAX_MESSAGE_CHARS = 60;
const CHAT_WINDOW_MS = 5 * 1000;
const CHAT_MAX_REQUESTS = 1;

const REPORT_HOUR = 18;
const DISCORD_WEBHOOK_URL = (process.env.DISCORD_WEBHOOK_URL || "").trim();

const DATA_DIR = path.join(__dirname, "data");
const STATS_FILE = path.join(DATA_DIR, "stats.json");

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Te veel verzoeken. Probeer het later opnieuw." }
});
app.use("/api/", apiLimiter);

const chatLimiter = rateLimit({
  windowMs: CHAT_WINDOW_MS,
  max: CHAT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rustig aan. Je mag maximaal 1 bericht per 10 seconden sturen." }
});

const apiKey = (process.env.OPENAI_API_KEY || "").trim();
if (!apiKey) {
  console.error("OPENAI_API_KEY ontbreekt.");
  process.exit(1);
}
const client = new OpenAI({ apiKey });

const PROMPT_FILE = path.join(__dirname, "prompt.json");

let cachedPrompt = null;
let cachedPromptAt = 0;
const PROMPT_CACHE_MS = 5 * 60 * 1000;

function loadPromptFile() {
  const raw = fs.readFileSync(PROMPT_FILE, "utf8");
  const parsed = JSON.parse(raw);

  const systemPrompt = Array.isArray(parsed.system_prompt)
    ? parsed.system_prompt.join("\n")
    : "";

  const context = Array.isArray(parsed.context)
    ? parsed.context.join("\n")
    : "";

  return `
${systemPrompt}

CONTEXT:
${context}
`.trim();
}

function getPromptCached() {
  const now = Date.now();
  if (cachedPrompt && now - cachedPromptAt < PROMPT_CACHE_MS) return cachedPrompt;

  cachedPrompt = loadPromptFile();
  cachedPromptAt = now;
  return cachedPrompt;
}

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STATS_FILE)) {
    fs.writeFileSync(
      STATS_FILE,
      JSON.stringify(
        {
          window_start_iso: null,
          prompts_in_window: 0
        },
        null,
        2
      ),
      "utf8"
    );
  }
}

function readStats() {
  ensureDataStore();
  try {
    return JSON.parse(fs.readFileSync(STATS_FILE, "utf8"));
  } catch {
    return { window_start_iso: null, prompts_in_window: 0 };
  }
}

function writeStats(stats) {
  ensureDataStore();
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), "utf8");
}

function formatIsoLocal(d) {
  return d.toISOString();
}

function getCurrentWindowStart(now = new Date()) {
  const start = new Date(now);
  start.setHours(REPORT_HOUR, 0, 0, 0);

  if (now < start) {
    start.setDate(start.getDate() - 1);
  }
  return start;
}

function getNextWindowStart(now = new Date()) {
  const next = new Date(now);
  next.setHours(REPORT_HOUR, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  return next;
}

function getOrInitWindowStats(now = new Date()) {
  const stats = readStats();
  const expectedStart = getCurrentWindowStart(now).toISOString();

  if (stats.window_start_iso !== expectedStart) {
    stats.window_start_iso = expectedStart;
    stats.prompts_in_window = 0;
    writeStats(stats);
  }
  return stats;
}

function incrementPromptCount() {
  const now = new Date();
  const stats = getOrInitWindowStats(now);
  stats.prompts_in_window += 1;
  writeStats(stats);
  return stats.prompts_in_window;
}

function windowLabel(now = new Date()) {
  const start = getCurrentWindowStart(now);
  const end = getNextWindowStart(now); // volgende 18:00
  const opts = { year: "numeric", month: "2-digit", day: "2-digit" };
  const s = start.toLocaleDateString("nl-NL", opts) + " 18:00";
  const e = end.toLocaleDateString("nl-NL", opts) + " 18:00";
  return `${s} → ${e}`;
}

async function sendDiscordMessage(text) {
  if (!DISCORD_WEBHOOK_URL) return false;

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text })
  });

  return res.ok;
}

cron.schedule(
  "0 18 * * *",
  async () => {
    try {
      const now = new Date();

      const justBefore = new Date(now.getTime() - 1000);
      const stats = getOrInitWindowStats(justBefore);

      const count = stats.prompts_in_window || 0;
      const label = windowLabel(justBefore);

      const msg =
        `Dagrapport gpt-chatbot\n` +
        `Venster: ${label}\n` +
        `Prompts verstuurd: ${count}`;

      const ok = await sendDiscordMessage(msg);

      const newStart = getCurrentWindowStart(now).toISOString();
      writeStats({ window_start_iso: newStart, prompts_in_window: 0 });

      if (!ok) {
        console.error("Discord webhook faalde (bericht niet verstuurd). Teller is wel gereset.");
      }
    } catch (e) {
      console.error("Dagrapport cron faalde:", e?.message || e);
    }
  },
  { timezone: "Europe/Amsterdam" }
);

app.get("/api/health", (req, res) => {
  const stats = getOrInitWindowStats(new Date());
  console.log("[Health check] OK");
  res.json({
    ok: true,
    max_message_chars: MAX_MESSAGE_CHARS,
    chat_limit: `${CHAT_MAX_REQUESTS} per ${CHAT_WINDOW_MS / 1000}s`,
    window_start_iso: stats.window_start_iso,
    prompts_in_window: stats.prompts_in_window
  });
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  const message = (req.body.message || "").toString().trim();

  if (!message) return res.status(400).json({ error: "Leeg bericht." });
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({
      error: `Bericht te lang. Maximaal ${MAX_MESSAGE_CHARS} tekens toegestaan.`,
      max: MAX_MESSAGE_CHARS,
      received: message.length
    });
  }

  incrementPromptCount();

  try {
    const systemPrompt = getPromptCached();
    console.log(`[Chat] Vraag ontvangen: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const reply = completion?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("[Chat] Geen reply in completion:", JSON.stringify(completion));
      return res.status(500).json({ error: "Geen antwoord ontvangen van ChatGPT." });
    }

    console.log(`[Chat] Antwoord verstuurd (${reply.length} tekens)`);
    res.json({ reply });
  } catch (err) {
    console.error("Chat fout:", err?.message || err);
    if (err?.error?.message) {
      console.error("OpenAI error details:", err.error.message);
    }
    res.status(500).json({ error: "Chat fout. Probeer het later opnieuw." });
  }
});

app.listen(3000, () => console.log("API draait op poort 3000"));
