# AI Chatbot Widget

A beautiful, customizable chatbot widget powered by OpenAI's GPT models. Add intelligent chat functionality to any website with just 2 lines of code.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

## ✨ Features

- 🎨 **Fully Customizable** - Match your website's design with easy configuration
- 🚀 **Easy Integration** - Add to any website with 2 lines of code
- 🔒 **Rate Limiting** - Built-in protection against abuse
- 📱 **Responsive** - Works perfectly on desktop and mobile
- ⚡ **Fast & Lightweight** - Minimal dependencies, optimized performance
- 🎯 **Context-Aware** - Customizable prompts for your specific use case
- 🐳 **Docker Ready** - Deploy with a single command

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
docker run -d \
  -p 3000:3000 \
  -e OPENAI_API_KEY="sk-..." \
  --name ai-chatbot \
  --restart unless-stopped \
  ai-chatbot-widget
```

### Option 2: Manual Setup

```bash
# Install dependencies
cd api
npm install

# Create .env file
echo "OPENAI_API_KEY=your_key_here" > .env

# Start server
npm start
```

Server runs on `http://localhost:3000`

## 📦 Installation on Your Website

Add these 2 lines to your HTML, just before the closing `</body>` tag:

```html
<script>
  window.CHATBOT_CONFIG = {
    apiUrl: 'http://localhost:3000',
    assistantName: 'AI Assistant',
    greetingMessage: 'Hi! How can I help you today?'
  };
</script>
<script src="http://localhost:3000/chatbot-widget.js"></script>
```

That's it! The chatbot will appear as a yellow icon in the bottom-right corner.

## ⚙️ Configuration

### Widget Configuration

Customize the widget behavior:

```javascript
window.CHATBOT_CONFIG = {
  // Required: API endpoint URL
  apiUrl: 'https://your-server.com',

  // Optional: Assistant name (default: 'AI Assistant')
  assistantName: 'Your Assistant',

  // Optional: Greeting message
  greetingMessage: 'Hello! How can I assist you today?'
};
```

### Prompt Configuration

Edit `api/prompt.json` to customize your chatbot's personality:

```json
{
  "system_prompt": [
    "You are a helpful assistant.",
    "Answer questions concisely and professionally.",
    "Be friendly and approachable."
  ],
  "context": [
    "Add your specific context here.",
    "Company information, services, products, etc.",
    "Any information the assistant should know."
  ]
}
```

### Server Configuration

Edit `api/server.cjs` to adjust rate limits:

```javascript
const MAX_MESSAGE_CHARS = 60;          // Maximum characters per message
const CHAT_WINDOW_MS = 10 * 1000;     // Rate limit window (10 seconds)
const CHAT_MAX_REQUESTS = 1;          // Max messages per window
```

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t ai-chatbot-widget .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -e OPENAI_API_KEY="your_key_here" \
  --name ai-chatbot \
  --restart unless-stopped \
  ai-chatbot-widget
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  chatbot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=your_key_here
    restart: unless-stopped
```

Run with: `docker-compose up -d`

## 📡 API Endpoints

### POST /api/chat

Send a message to the chatbot.

**Request:**
```json
{
  "message": "Hello, how are you?"
}
```

**Response:**
```json
{
  "reply": "I'm doing great! How can I help you today?"
}
```

**Error Response:**
```json
{
  "error": "Message too long. Maximum 60 characters allowed."
}
```

### GET /api/health

Check server status and view usage statistics.

**Response:**
```json
{
  "ok": true,
  "max_message_chars": 60,
  "chat_limit_per_user": "1 per 3s",
  "chat_limit_global": "50 per minute",
  "prompts_today": 42,
  "total_prompts": 1337,
  "date": "2026-01-15"
}
```

**Fields:**
- `chat_limit_per_user`: Rate limit per individual user (1 message per 3 seconds)
- `chat_limit_global`: Global rate limit across all users (50 messages per minute)
- `prompts_today`: Number of prompts sent today
- `total_prompts`: Total prompts since first use
- `date`: Current date (YYYY-MM-DD)

## 🎨 Customization

### Styling

The widget uses HSL colors for easy customization. Edit `api/public/chatbot-widget.js`:

```javascript
// Yellow accent color (buttons, user messages)
background: linear-gradient(to bottom right, hsl(45, 100%, 72%), hsl(35, 100%, 68%));

// Dark background
background: hsl(240, 2%, 12%);

// Borders
border: 1px solid hsl(0, 0%, 22%);

// Text colors
color: hsl(0, 0%, 98%);  // Light text
color: hsl(0, 0%, 84%);  // Muted text
```

### Widget Behavior

Modify click handlers in `api/public/chatbot-widget.js`:

- **Collapsed icon**: Click to expand chat
- **Header**: Click to toggle collapsed/expanded
- **Close button (×)**: Collapse to icon
- **Send button**: Send message
- **Enter key**: Send message (Shift+Enter for new line)

## 🔒 Security & Best Practices

### Rate Limiting

Three levels of protection:
1. **API-wide**: 100 requests per 5 minutes (all endpoints)
2. **Per-user**: 1 message per 3 seconds (individual user protection)
3. **Global**: 50 messages per minute (total across all users)

This prevents both individual spam and server overload from multiple users.

### Production Checklist

- [ ] Use HTTPS in production
- [ ] Set strong `OPENAI_API_KEY`
- [ ] Configure CORS for your domain only
- [ ] Enable logging and monitoring
- [ ] Set up error tracking
- [ ] Monitor OpenAI API usage
- [ ] Consider implementing user authentication
- [ ] Add content filtering if needed

### CORS Configuration

By default, CORS allows all origins. For production, edit `api/server.cjs`:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com']
}));
```

## 🌐 Production Deployment

### With Nginx

Example configuration:

```nginx
server {
    listen 80;
    server_name chatbot.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL with Certbot

```bash
sudo certbot --nginx -d chatbot.yourdomain.com
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_production_key

# Optional
PORT=3000
NODE_ENV=production
```

## 🛠️ Development

### Project Structure

```
.
├── api/
│   ├── server.cjs              # Express backend
│   ├── package.json            # Dependencies
│   ├── prompt.json             # Bot personality & context
│   └── public/
│       └── chatbot-widget.js   # Standalone widget
├── Dockerfile                  # Container definition
├── README.md                   # This file
└── .env.example                # Environment variables template
```

### Local Development

```bash
# Install dependencies
cd api
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start development server
npm run dev
```

### Testing

Test the widget by opening: `http://localhost:3000/chatbot-widget.js`

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Chatbot Test</title>
</head>
<body>
  <h1>Test Page</h1>

  <script>
    window.CHATBOT_CONFIG = {
      apiUrl: 'http://localhost:3000',
      assistantName: 'Test Assistant',
      greetingMessage: 'Hi! This is a test.'
    };
  </script>
  <script src="http://localhost:3000/chatbot-widget.js"></script>
</body>
</html>
```

## ❓ Troubleshooting

### Widget doesn't appear

1. Check browser console for errors
2. Verify API URL is correct
3. Ensure server is running
4. Check CORS settings

### "Server not responding" error

1. Verify `OPENAI_API_KEY` is set correctly
2. Check server logs: `docker logs ai-chatbot`
3. Test health endpoint: `curl http://localhost:3000/api/health`
4. Ensure OpenAI API is accessible
5. Check rate limits

### Rate limit errors

1. Adjust `CHAT_WINDOW_MS` in `api/server.cjs`
2. Increase `CHAT_MAX_REQUESTS` if needed
3. Clear browser cache and cookies

### Styling conflicts

1. Check for CSS conflicts with your website
2. Adjust z-index if widget is hidden (default: 9999)
3. Ensure widget script loads after DOM

## 📝 License

MIT License - Free to use in your projects!

## 🙏 Credits

Built with:
- [OpenAI API](https://openai.com/api/) - GPT models
- [Express.js](https://expressjs.com/) - Web framework
- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) - Rate limiting

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the [troubleshooting section](#-troubleshooting)
- Review the [API documentation](#-api-endpoints)

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Conversation history
- [ ] User authentication
- [ ] Analytics dashboard
- [ ] Custom themes
- [ ] Voice input/output
- [ ] File attachments
- [ ] Emoji support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Made with ❤️ by developers, for developers
