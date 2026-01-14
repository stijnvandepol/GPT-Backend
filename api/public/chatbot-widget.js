(function() {
  'use strict';

  // Configuration
  const API_BASE_URL = window.CHATBOT_CONFIG?.apiUrl || '';
  const API_URL = API_BASE_URL + '/api/chat';

  // Create styles matching portfolio theme
  const styles = `
    #stijn-chatbot-fab {
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
    #stijn-chatbot-fab:hover {
      transform: scale(1.05);
      box-shadow: 0 16px 30px hsla(0, 0%, 0%, 0.25);
    }
    #stijn-chatbot-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 380px;
      height: 550px;
      background: hsl(240, 2%, 12%);
      border: 1px solid hsl(0, 0%, 22%);
      border-radius: 20px;
      box-shadow: -4px 8px 24px hsla(0, 0%, 0%, 0.25);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: fadeIn 0.5s ease backwards;
    }
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    #stijn-chatbot-header {
      background: linear-gradient(to bottom right, hsl(240, 1%, 25%) 3%, hsl(0, 0%, 19%) 97%);
      color: hsl(0, 0%, 98%);
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid hsl(0, 0%, 22%);
    }
    #stijn-chatbot-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      font-family: 'Poppins', sans-serif;
    }
    #stijn-chatbot-close {
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
    #stijn-chatbot-close:hover {
      background: hsl(240, 2%, 20%);
      color: hsl(45, 100%, 72%);
    }
    #stijn-chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: hsl(240, 2%, 13%);
    }
    #stijn-chatbot-messages::-webkit-scrollbar {
      width: 5px;
    }
    #stijn-chatbot-messages::-webkit-scrollbar-track {
      background: hsl(240, 1%, 17%);
      border-radius: 5px;
    }
    #stijn-chatbot-messages::-webkit-scrollbar-thumb {
      background: hsl(45, 100%, 72%);
      border-radius: 5px;
    }
    .stijn-chat-msg {
      padding: 12px 16px;
      border-radius: 14px;
      max-width: 80%;
      word-wrap: break-word;
      animation: slideIn 0.3s ease;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      line-height: 1.6;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .stijn-chat-msg.user {
      background: linear-gradient(to bottom right, hsl(45, 100%, 72%), hsl(35, 100%, 68%));
      color: hsl(0, 0%, 7%);
      align-self: flex-end;
      margin-left: auto;
      box-shadow: 0 4px 12px hsla(45, 100%, 72%, 0.15);
    }
    .stijn-chat-msg.bot {
      background: linear-gradient(
        to bottom right,
        hsla(240, 1%, 18%, 0.251) 0%,
        hsla(240, 2%, 11%, 0) 100%
      ), hsl(240, 2%, 13%);
      color: hsl(0, 0%, 84%);
      align-self: flex-start;
      border: 1px solid hsl(0, 0%, 22%);
      box-shadow: -4px 8px 24px hsla(0, 0%, 0%, 0.25);
    }
    #stijn-chatbot-input-container {
      padding: 16px;
      background: hsl(240, 2%, 12%);
      border-top: 1px solid hsl(0, 0%, 22%);
      display: flex;
      gap: 8px;
    }
    #stijn-chatbot-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid hsl(0, 0%, 22%);
      border-radius: 14px;
      outline: none;
      font-size: 14px;
      font-family: 'Poppins', sans-serif;
      background: hsl(240, 2%, 13%);
      color: hsl(0, 0%, 98%);
      transition: border-color 0.25s ease;
    }
    #stijn-chatbot-input:focus {
      border-color: hsl(45, 100%, 72%);
    }
    #stijn-chatbot-input::placeholder {
      color: hsl(0, 0%, 84%, 0.7);
    }
    #stijn-chatbot-send {
      background: linear-gradient(to bottom right, hsl(45, 100%, 72%), hsl(35, 100%, 68%));
      color: hsl(0, 0%, 7%);
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s ease;
      box-shadow: 0 4px 12px hsla(45, 100%, 72%, 0.15);
    }
    #stijn-chatbot-send:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 16px hsla(45, 100%, 72%, 0.25);
    }
    #stijn-chatbot-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    @media (max-width: 480px) {
      #stijn-chatbot-widget {
        width: calc(100vw - 32px);
        height: calc(100vh - 100px);
        bottom: 16px;
        right: 16px;
        border-radius: 16px;
      }
      #stijn-chatbot-fab {
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
    <button id="stijn-chatbot-fab" aria-label="Open chat">💬</button>
    <div id="stijn-chatbot-widget" hidden>
      <div id="stijn-chatbot-header">
        <h3>Stijn's Assistent</h3>
        <button id="stijn-chatbot-close" aria-label="Close chat">×</button>
      </div>
      <div id="stijn-chatbot-messages"></div>
      <div id="stijn-chatbot-input-container">
        <input
          type="text"
          id="stijn-chatbot-input"
          placeholder="Stel een vraag..."
          maxlength="60"
          autocomplete="off"
        />
        <button id="stijn-chatbot-send" aria-label="Send message">➤</button>
      </div>
    </div>
  `;

  // Inject widget into page
  const container = document.createElement('div');
  container.innerHTML = widgetHTML;
  document.body.appendChild(container);

  // Get elements
  const fab = document.getElementById('stijn-chatbot-fab');
  const widget = document.getElementById('stijn-chatbot-widget');
  const closeBtn = document.getElementById('stijn-chatbot-close');
  const messages = document.getElementById('stijn-chatbot-messages');
  const input = document.getElementById('stijn-chatbot-input');
  const sendBtn = document.getElementById('stijn-chatbot-send');

  let busy = false;

  function addMessage(role, text) {
    const el = document.createElement('div');
    el.className = `stijn-chat-msg ${role}`;
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

      const data = await res.json();

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

  fab.onclick = () => {
    widget.hidden = false;
    fab.style.display = 'none';
    if (messages.childElementCount === 0) {
      addMessage('bot', "Hoi! Ik ben Stijn's assistent. Hoe kan ik je helpen?");
    }
  };

  closeBtn.onclick = () => {
    widget.hidden = true;
    fab.style.display = 'flex';
  };

  sendBtn.onclick = sendMessage;

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();
