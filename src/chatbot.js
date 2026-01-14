const fab = document.getElementById("chatFab");
const widget = document.getElementById("chatWidget");
const closeBtn = document.getElementById("chatClose");
const messages = document.getElementById("chatMessages");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("chatSend");

const API_URL = "/api/chat"; // via reverse proxy het mooiste

let busy = false;

function addMsg(role, text){
  const el = document.createElement("div");
  el.className = `chat-msg ${role}`;
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

function setBusy(v){
  busy = v;
  sendBtn.disabled = v;
  input.disabled = v;
  sendBtn.textContent = v ? "…" : "Verstuur";
}

function autosize(){
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 140) + "px";
}

async function send(){
  const text = input.value.trim();
  if (!text || busy) return;

  input.value = "";
  autosize();
  addMsg("user", text);

  setBusy(true);
  try{
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ message: text })
    });

    if(!res.ok){
      const t = await res.text().catch(()=> "");
      throw new Error(`HTTP ${res.status} ${t}`.trim());
    }

    const data = await res.json();
    addMsg("bot", data.reply || "Geen antwoord ontvangen.");
  }catch(e){
    addMsg("bot", "Ik krijg nu geen antwoord van de server. Probeer het zo nog eens.");
  }finally{
    setBusy(false);
    input.focus();
  }
}

fab.addEventListener("click", () => {
  widget.hidden = false;
  fab.style.display = "none";
  if(messages.childElementCount === 0){
    addMsg("bot", "Hoi, ik ben Stijn’s portfolio-assistent. Vraag gerust iets over mijn ervaring, skills, opleiding of projecten.");
  }
  input.focus();
});

closeBtn.addEventListener("click", () => {
  widget.hidden = true;
  fab.style.display = "inline-flex";
});

sendBtn.addEventListener("click", send);

input.addEventListener("input", autosize);
input.addEventListener("keydown", (e) => {
  if(e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    send();
  }
});
