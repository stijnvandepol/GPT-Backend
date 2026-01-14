const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

// Als je later alles via dezelfde domain + reverse proxy doet, kun je CORS zelfs uitzetten.
// Voor nu: open.
app.use(cors());

const apiKey = (process.env.OPENAI_API_KEY || "").trim();
if (!apiKey) {
  console.error("OPENAI_API_KEY ontbreekt. Zet hem in env of .env (via env_file).");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  const message = (req.body?.message || "").toString().trim();
  if (!message) return res.status(400).json({ error: "message ontbreekt" });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "Je bent een behulpzame website-chatbot. Antwoord kort en helder." },
        { role: "user", content: message }
      ]
    });

    res.json({ reply: completion.choices?.[0]?.message?.content ?? "" });
  } catch (err) {
    console.error("OpenAI call faalde:", err?.message || err);
    res.status(500).json({ error: "OpenAI call faalde" });
  }
});

app.listen(3000, () => console.log("API draait op :3000"));
