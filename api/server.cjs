const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cors());

// Serve static files (widget)
app.use(express.static(path.join(__dirname, "public")));

const MAX_MESSAGE_CHARS = 60;
const CHAT_WINDOW_MS = 3 * 1000; // 3 seconds per user
const CHAT_MAX_REQUESTS = 1;

// Stats tracking
const STATS_DIR = path.join(__dirname, "data");
const STATS_FILE = path.join(STATS_DIR, "stats.json");

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." }
});
app.use("/api/", apiLimiter);

// Per-user rate limiter: 1 message per 3 seconds
const chatLimiterPerUser = rateLimit({
  windowMs: CHAT_WINDOW_MS,
  max: CHAT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Please wait 3 seconds between messages." }
});

// Global rate limiter: 50 messages per minute across all users
const chatLimiterGlobal = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  keyGenerator: () => 'global', // Same key for all users
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Server is busy. Please try again in a moment." }
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

// Stats functions
function ensureStatsDir() {
  if (!fs.existsSync(STATS_DIR)) {
    fs.mkdirSync(STATS_DIR, { recursive: true });
  }
}

function getTodayString() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function readStats() {
  ensureStatsDir();
  if (!fs.existsSync(STATS_FILE)) {
    const initialStats = {
      date: getTodayString(),
      prompts_today: 0,
      total_prompts: 0
    };
    fs.writeFileSync(STATS_FILE, JSON.stringify(initialStats, null, 2));
    return initialStats;
  }

  try {
    const data = fs.readFileSync(STATS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading stats:', err);
    return { date: getTodayString(), prompts_today: 0, total_prompts: 0 };
  }
}

function incrementPromptCount() {
  const stats = readStats();
  const today = getTodayString();

  // Reset daily counter if it's a new day
  if (stats.date !== today) {
    stats.date = today;
    stats.prompts_today = 0;
  }

  stats.prompts_today += 1;
  stats.total_prompts = (stats.total_prompts || 0) + 1;

  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  return stats;
}

app.get("/api/health", (req, res) => {
  const stats = readStats();
  console.log("[Health check] OK");
  res.json({
    ok: true,
    max_message_chars: MAX_MESSAGE_CHARS,
    chat_limit_per_user: `${CHAT_MAX_REQUESTS} per ${CHAT_WINDOW_MS / 1000}s`,
    chat_limit_global: "50 per minute",
    prompts_today: stats.prompts_today,
    total_prompts: stats.total_prompts,
    date: stats.date
  });
});

app.post("/api/chat", chatLimiterGlobal, chatLimiterPerUser, async (req, res) => {
  const message = (req.body.message || "").toString().trim();

  if (!message) return res.status(400).json({ error: "Empty message." });
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({
      error: `Message too long. Maximum ${MAX_MESSAGE_CHARS} characters allowed.`,
      max: MAX_MESSAGE_CHARS,
      received: message.length
    });
  }

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

    // Increment prompt counter (only on successful response)
    incrementPromptCount();

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
