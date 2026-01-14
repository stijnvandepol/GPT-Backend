(function() {
  'use strict';

  // Configuration
  const API_BASE_URL = window.CHATBOT_CONFIG?.apiUrl || 'http://localhost:3000/';
  const API_URL = API_BASE_URL + '/api/chat';

  // Create styles
  const styles = `
    #stijn-chatbot-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: transform 0.2s;
    }
    #stijn-chatbot-fab:hover {
      transform: scale(1.1);
    }
    #stijn-chatbot-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 380px;
      height: 550px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    #stijn-chatbot-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #stijn-chatbot-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    #stijn-chatbot-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    #stijn-chatbot-close:hover {
      background: rgba(255,255,255,0.3);
    }
    #stijn-chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8f9fa;
    }
    .stijn-chat-msg {
      padding: 12px 16px;
      border-radius: 12px;
      max-width: 80%;
      word-wrap: break-word;
      animation: slideIn 0.3s ease;
    }
    .stijn-chat-msg.user {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      align-self: flex-end;
      margin-left: auto;
    }
    .stijn-chat-msg.bot {
      background: white;
      color: #333;
      align-self: flex-start;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    #stijn-chatbot-input-container {
      padding: 16px;
      background: white;
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 8px;
    }
    #stijn-chatbot-input {
      flex: 1;
      padding: 12px;
      border: 2px solid #e9ecef;
      border-radius: 24px;
      outline: none;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    #stijn-chatbot-input:focus {
      border-color: #667eea;
    }
    #stijn-chatbot-send {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    #stijn-chatbot-send:hover {
      transform: scale(1.05);
    }
    #stijn-chatbot-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
    @media (max-width: 480px) {
      #stijn-chatbot-widget {
        width: calc(100vw - 32px);
        height: calc(100vh - 100px);
        bottom: 16px;
        right: 16px;
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
