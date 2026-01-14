(function() {
  'use strict';

  // Configuration
  const config = window.CHATBOT_CONFIG || {};
  const API_BASE_URL = config.apiUrl || '';
  const API_URL = API_BASE_URL + '/api/chat';
  const ASSISTANT_NAME = config.assistantName || 'Stijn\'s Assistent';
  const GREETING_MESSAGE = config.greetingMessage || `Hoi! Ik ben ${ASSISTANT_NAME}. Hoe kan ik je helpen?`;

  // Create styles matching portfolio theme
  const styles = `
  #portfolio-chatbot-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 60px;
    height: 60px;
    border-radius: 12px;
    background: linear-gradient(
      to bottom right,
      hsl(45, 100%, 72%),
      hsl(35, 100%, 68%)
    );
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

  /* ───────────────── Widget container ───────────────── */
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

  /* ───────────────── Collapsed state (icoon) ───────────────── */
  #portfolio-chatbot-widget.collapsed {
    width: 60px;
    height: 60px;
    max-height: 60px;
    border-radius: 12px;
  }

  /* Maak collapsed widget exact hetzelfde als FAB */
  #portfolio-chatbot-widget.collapsed,
  #portfolio-chatbot-widget.collapsed #portfolio-chatbot-header {
    background: linear-gradient(
      to bottom right,
      hsl(45, 100%, 72%),
      hsl(35, 100%, 68%)
    );
    color: hsl(0, 0%, 7%);
    box-shadow: -4px 8px 24px hsla(0, 0%, 0%, 0.25);
    border: none;
  }

  /* Header in collapsed state = icoon */
  #portfolio-chatbot-widget.collapsed #portfolio-chatbot-header {
    width: 60px;
    height: 60px;
    padding: 0;
    border-bottom: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  /* Titel en kruisje verbergen */
  #portfolio-chatbot-widget.collapsed #portfolio-chatbot-header h3,
  #portfolio-chatbot-widget.collapsed #portfolio-chatbot-close {
    display: none;
  }

  /* Chat-icoon */
  #portfolio-chatbot-widget.collapsed #portfolio-chatbot-header::after {
    content: '💬';
    font-size: 26px;
  }

  /* ───────────────── Header (open state) ───────────────── */
  #portfolio-chatbot-header {
    background: linear-gradient(
      to bottom right,
      hsl(240, 1%, 25%) 3%,
      hsl(0, 0%, 19%) 97%
    );
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
    background: linear-gradient(
      to bottom right,
      hsl(240, 1%, 28%) 3%,
      hsl(0, 0%, 22%) 97%
    );
  }

  #portfolio-chatbot-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    font-family: 'Poppins', sans-serif;
  }

  /* Close button */
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

  /* ───────────────── Messages ───────────────── */
  #portfolio-chatbot-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: hsl(240, 2%, 13%);
  }

  #portfolio-chatbot-messages::-webkit-scrollbar {
    width: 5px;
  }

  #portfolio-chatbot-messages::-webkit-scrollbar-track {
    background: hsl(240, 1%, 17%);
    border-radius: 5px;
  }

  #portfolio-chatbot-messages::-webkit-scrollbar-thumb {
    background: hsl(45, 100%, 72%);
    border-radius: 5px;
  }

  /* ───────────────── Messages ───────────────── */
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
    background: linear-gradient(
      to bottom right,
      hsl(45, 100%, 72%),
      hsl(35, 100%, 68%)
    );
    color: hsl(0, 0%, 7%);
    align-self: flex-end;
  }

  .portfolio-chat-msg.bot {
    background: hsl(240, 2%, 13%);
    color: hsl(0, 0%, 84%);
    align-self: flex-start;
    border: 1px solid hsl(0, 0%, 22%);
  }

  /* ───────────────── Input ───────────────── */
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
    background: linear-gradient(
      to bottom right,
      hsl(45, 100%, 72%),
      hsl(35, 100%, 68%)
    );
    color: hsl(0, 0%, 7%);
    border: none;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    cursor: pointer;
  }

  /* ───────────────── Mobile ───────────────── */
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

  // Create widget HTML
  const widgetHTML = `
    <button id="portfolio-chatbot-fab" aria-label="Open chat">💬</button>
    <div id="portfolio-chatbot-widget" hidden>
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
    </div>
  `;

  // Inject widget into page
  const container = document.createElement('div');
  container.innerHTML = widgetHTML;
  document.body.appendChild(container);

  // Get elements
  const fab = document.getElementById('portfolio-chatbot-fab');
  const widget = document.getElementById('portfolio-chatbot-widget');
  const header = document.getElementById('portfolio-chatbot-header');
  const closeBtn = document.getElementById('portfolio-chatbot-close');
  const messages = document.getElementById('portfolio-chatbot-messages');
  const input = document.getElementById('portfolio-chatbot-input');
  const sendBtn = document.getElementById('portfolio-chatbot-send');

  let busy = false;
  let isCollapsed = true;

  function addMessage(role, text) {
    const el = document.createElement('div');
    el.className = `portfolio-chat-msg ${role}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
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

      if (data.error) {
        addMessage('bot', data.error);
      } else if (data.reply) {
        addMessage('bot', data.reply);
      } else {
        addMessage('bot', 'Geen antwoord ontvangen.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      addMessage('bot', 'De server reageert momenteel niet.');
    } finally {
      busy = false;
      sendBtn.disabled = false;
    }
  }

  function openWidget() {
    widget.hidden = false;
    widget.classList.remove('minimized');
    widget.classList.remove('collapsed');
    isCollapsed = false;

    fab.style.display = 'none';

    if (messages.childElementCount === 0) {
      addMessage('bot', GREETING_MESSAGE);
    }

    setTimeout(() => input.focus(), 0);
  }

  function closeToFab() {
    widget.hidden = true;
    widget.classList.remove('minimized');
    widget.classList.remove('collapsed');
    isCollapsed = false;

    // Reset UI state als er net een request liep
    busy = false;
    sendBtn.disabled = false;

    fab.style.display = 'flex';
  }

  fab.onclick = () => openWidget();

  // Header click = collapse/expand
  header.onclick = () => {
    isCollapsed = !isCollapsed;
    widget.classList.toggle('collapsed', isCollapsed);

    if (!isCollapsed) {
      setTimeout(() => input.focus(), 0);
    }
  };

  // Close button = echt sluiten naar FAB
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeToFab();
  };

  sendBtn.onclick = sendMessage;

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();
