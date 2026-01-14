(function() {
  'use strict';

  // Configuration
  const config = window.CHATBOT_CONFIG || {};
  const API_BASE_URL = config.apiUrl || '';
  const API_URL = API_BASE_URL + '/api/chat';
  const ASSISTANT_NAME = config.assistantName || 'Stijn\'s Assistent';
  const GREETING_MESSAGE = config.greetingMessage || `Hoi! Ik ben ${ASSISTANT_NAME}. Hoe kan ik je helpen?`;

  // Styles
  const styles = `
  #portfolio-chatbot-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 60px;
    height: 60px;
    border-radius: 12px;
    background: linear-gradient(to bottom right, hsl(45, 100%, 72%), hsl(35, 100%, 68%));
    color: hsl(0, 0%, 7%);
    border: none;
    cursor: pointer;
    box-shadow: -4px 8px 24px hsla(0, 0%, 0%, 0.25);
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    transition: all 0.25s ease;
  }
  #portfolio-chatbot-fab:hover {
    transform: scale(1.05);
    box-shadow: 0 16px 30px hsla(0, 0%, 0%, 0.25);
  }

  #portfolio-chatbot-widget {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 380px;
    background: hsl(240, 2%, 12%);
    border: 1px solid hsl(0, 0%, 22%);
    border-radius: 20px;
    box-shadow: -4px 8px 24px hsla(0, 0%, 0%, 0.25);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-height: 550px;
    transition: all 0.3s ease;
  }

  /* Collapsed = mini icoon rechtsonder (geel) */
  #portfolio-chatbot-widget.collapsed {
    width: 60px;
    height: 60px;
    max-height: 60px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(to bottom right, hsl(45, 100%, 72%), hsl(35, 100%, 68%));
    box-shadow: -4px 8px 24px hsla(0, 0%, 0%, 0.25);
    position: fixed; /* zekerheid */
  }

  /* Icoon renderen op de WIDGET zelf (meest stabiel) */
  #portfolio-chatbot-widget.collapsed::after {
    content: '💬';
    font-size: 26px;
    line-height: 1;
    color: hsl(0, 0%, 7%);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none; /* klik gaat naar widget */
  }

  /* In collapsed state: alleen klikbaar vlak, rest volledig weg */
  #portfolio-chatbot-widget.collapsed #portfolio-chatbot-header,
  #portfolio-chatbot-widget.collapsed #portfolio-chatbot-messages,
  #portfolio-chatbot-widget.collapsed #portfolio-chatbot-input-container {
    display: none !important;
  }

  #portfolio-chatbot-header {
    background: linear-gradient(to bottom right, hsl(240, 1%, 25%) 3%, hsl(0, 0%, 19%) 97%);
    color: hsl(0, 0%, 98%);
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid hsl(0, 0%, 22%);
    cursor: pointer;
    user-select: none;
  }
  #portfolio-chatbot-header:hover {
    background: linear-gradient(to bottom right, hsl(240, 1%, 28%) 3%, hsl(0, 0%, 22%) 97%);
  }
  #portfolio-chatbot-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    font-family: 'Poppins', sans-serif;
  }

  #portfolio-chatbot-close {
    background: hsla(240, 1%, 18%, 0.251);
    border: 1px solid hsl(0, 0%, 22%);
    color: hsl(0, 0%, 98%);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;
  }
  #portfolio-chatbot-close:hover {
    background: hsl(240, 2%, 20%);
    color: hsl(45, 100%, 72%);
  }

  #portfolio-chatbot-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: hsl(240, 2%, 13%);
  }

  .portfolio-chat-msg {
    padding: 12px 16px;
    border-radius: 14px;
    max-width: 80%;
    word-wrap: break-word;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    line-height: 1.6;
  }
  .portfolio-chat-msg.user {
    background: linear-gradient(to bottom right, hsl(45, 100%, 72%), hsl(35, 100%, 68%));
    color: hsl(0, 0%, 7%);
    align-self: flex-end;
  }
  .portfolio-chat-msg.bot {
    background: hsl(240, 2%, 13%);
    color: hsl(0, 0%, 84%);
    align-self: flex-start;
    border: 1px solid hsl(0, 0%, 22%);
  }

  #portfolio-chatbot-input-container {
    padding: 16px;
    background: hsl(240, 2%, 12%);
    border-top: 1px solid hsl(0, 0%, 22%);
    display: flex;
    gap: 8px;
  }

  #portfolio-chatbot-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid hsl(0, 0%, 22%);
    border-radius: 14px;
    outline: none;
    font-size: 14px;
    font-family: 'Poppins', sans-serif;
    background: hsl(240, 2%, 13%);
    color: hsl(0, 0%, 98%);
  }

  #portfolio-chatbot-input::placeholder {
    color: hsla(0, 0%, 84%, 0.7);
  }

  #portfolio-chatbot-send {
    background: linear-gradient(to bottom right, hsl(45, 100%, 72%), hsl(35, 100%, 68%));
    color: hsl(0, 0%, 7%);
    border: none;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    cursor: pointer;
  }

  @media (max-width: 480px) {
    #portfolio-chatbot-widget {
      width: calc(100vw - 32px);
      height: calc(100vh - 100px);
      bottom: 16px;
      right: 16px;
      border-radius: 16px;
    }
    #portfolio-chatbot-fab {
      bottom: 16px;
      right: 16px;
    }
  }
  `;

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Widget HTML
  const widgetHTML = `
    <button id="portfolio-chatbot-fab" aria-label="Open chat" hidden>💬</button>
    <div id="portfolio-chatbot-widget" hidden></div>
  `;

  // Inject widget into page
  const container = document.createElement('div');
  container.innerHTML = widgetHTML;
  document.body.appendChild(container);

  // Build full widget structure once (so we can hide it cleanly in collapsed state)
  const widget = document.getElementById('portfolio-chatbot-widget');
  widget.innerHTML = `
    <div id="portfolio-chatbot-header">
      <h3>${ASSISTANT_NAME}</h3>
      <button id="portfolio-chatbot-close" aria-label="Close chat">×</button>
    </div>
    <div id="portfolio-chatbot-messages"></div>
    <div id="portfolio-chatbot-input-container">
      <input
        type="text"
        id="portfolio-chatbot-input"
        placeholder="Stel een vraag..."
        maxlength="63"
        autocomplete="off"
      />
      <button id="portfolio-chatbot-send" aria-label="Send message">➤</button>
    </div>
  `;

  // Elements
  const fab = document.getElementById('portfolio-chatbot-fab');
  const header = document.getElementById('portfolio-chatbot-header');
  const closeBtn = document.getElementById('portfolio-chatbot-close');
  const messages = document.getElementById('portfolio-chatbot-messages');
  const input = document.getElementById('portfolio-chatbot-input');
  const sendBtn = document.getElementById('portfolio-chatbot-send');

  let busy = false;

  function addMessage(role, text) {
    const el = document.createElement('div');
    el.className = `portfolio-chat-msg ${role}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  // State: collapsed (gele icoon in widget, FAB weg)
  function setStateCollapsed() {
    widget.hidden = false;
    widget.classList.add('collapsed');

    fab.hidden = true;
    fab.style.display = 'none';
  }

  // State: open (grote chat, geen extra geel icoon zichtbaar)
  function setStateOpen() {
    widget.hidden = false;
    widget.classList.remove('collapsed');

    fab.hidden = true;
    fab.style.display = 'none';

    if (messages.childElementCount === 0) {
      addMessage('bot', GREETING_MESSAGE);
    }

    setTimeout(() => input.focus(), 0);
  }

  // State: fab (chat volledig weg, alleen FAB zichtbaar)
  function setStateFab() {
    widget.hidden = true;
    widget.classList.remove('collapsed');

    busy = false;
    sendBtn.disabled = false;

    fab.hidden = false;
    fab.style.display = 'flex';
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || busy) return;

    input.value = '';
    addMessage('user', text);
    busy = true;
    sendBtn.disabled = true;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const ct = res.headers.get('content-type') || '';
      const isJson = ct.includes('application/json');
      const data = isJson ? await res.json().catch(() => ({})) : {};

      if (!res.ok) {
        addMessage('bot', data.error || `Serverfout (HTTP ${res.status}).`);
        return;
      }

      addMessage('bot', data.reply || data.error || 'Geen antwoord ontvangen.');
    } catch (err) {
      console.error('Chat error:', err);
      addMessage('bot', 'De server reageert momenteel niet.');
    } finally {
      busy = false;
      sendBtn.disabled = false;
    }
  }

  // Start: standaard volledig ingeklapt (gele icoon), en dus GEEN invoerblok zichtbaar
  setStateCollapsed();

  // Clicks
  // Let op: collapsed widget heeft geen header zichtbaar; dus we klikken op de widget zelf
  widget.addEventListener('click', () => {
    if (widget.classList.contains('collapsed')) setStateOpen();
  });

  // FAB is normaliter verborgen; alleen na "×" (stateFab) komt hij terug.
  fab.onclick = () => setStateOpen();

  // Header click (alleen in open state zichtbaar): open->collapse
  header.onclick = () => {
    if (!widget.classList.contains('collapsed')) setStateCollapsed();
  };

  // Close button: terug naar FAB (helemaal weg)
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    setStateFab();
  };

  sendBtn.onclick = sendMessage;

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();
