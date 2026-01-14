# Portfolio Chatbot Widget

Een robuuste, beveiligde chatbot die als jouw persoonlijke assistent fungeert op je portfolio website. Bezoekers kunnen vragen stellen over jouw ervaring, vaardigheden en projecten via ChatGPT.

## 🚀 Integratie in 2 Regels Code

Voeg dit toe aan je portfolio website (aan het einde van `<body>`):

```html
<script>window.CHATBOT_CONFIG = { apiUrl: 'https://jouw-server.com' };</script>
<script src="https://jouw-server.com/chatbot-widget.js"></script>
```

Klaar! De chatbot verschijnt als een floating button rechtsonder op je pagina.

[Bekijk volledige embed instructies →](EMBED.md)

## Features

- ✅ **Standalone widget**: Geen dependencies, werkt op elke website (React, Vue, plain HTML, etc.)
- ✅ **Eenvoudige integratie**: Slechts 2 regels code nodig
- ✅ **Moderne UI**: Responsive design met smooth animaties
- ✅ **Persoonlijke assistent**: Chatbot praat over jou in derde persoon als jouw assistent
- ✅ **ChatGPT powered**: Gebruikt gpt-4o-mini voor intelligente antwoorden
- ✅ **Rate limiting**: 1 bericht per 10 seconden per gebruiker
- ✅ **Dagelijkse Discord rapportage**: Automatisch om 18:00 (Europe/Amsterdam)
- ✅ **Strikte begrenzing**: Alleen portfolio vragen, geen coding hulp
- ✅ **Docker ready**: Alles-in-één container voor eenvoudige deployment

## Quick Start

### Optie 1: Direct van DockerHub (Aanbevolen)

```bash
docker run -d \
  -p 3000:3000 \
  -e OPENAI_API_KEY="sk-proj-..." \
  -e DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." \
  -v ./data:/app/data \
  --name portfolio-chatbot \
  --restart unless-stopped \
  stijnvandepol/portfolio-chatbot:latest
```

### Optie 2: Zelf builden

```bash
cd api
docker build -t portfolio-chatbot .
docker run -d -p 3000:3000 --env-file ../.env portfolio-chatbot
```

## Environment Variables

Maak een `.env` bestand:

```bash
OPENAI_API_KEY="sk-proj-..."
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."  # Optioneel
```

## Embed in Je Portfolio

### Basis embed

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mijn Portfolio</title>
</head>
<body>
  <h1>Welkom op mijn portfolio</h1>
  <p>Hier komt je content...</p>

  <!-- Chatbot integratie -->
  <script>
    window.CHATBOT_CONFIG = { apiUrl: 'http://localhost:3000' };
  </script>
  <script src="http://localhost:3000/chatbot-widget.js"></script>
</body>
</html>
```

### Met eigen domein/subdomain

```html
<script>
  window.CHATBOT_CONFIG = { apiUrl: 'https://chatbot.jouwdomein.nl' };
</script>
<script src="https://chatbot.jouwdomein.nl/chatbot-widget.js"></script>
```

[Meer embed voorbeelden →](EMBED.md)

## Lokaal Testen

1. Start de backend:
```bash
docker run -d -p 3000:3000 --env-file .env --name chatbot stijnvandepol/portfolio-chatbot:latest
```

2. Open het voorbeeld:
```
http://localhost:3000/embed-example.html
```

Of gebruik [INTEGRATION.html](INTEGRATION.html) voor een volledig portfolio voorbeeld.

## API Endpoints

### `GET /api/health`
Health check met statistieken

**Response:**
```json
{
  "ok": true,
  "max_message_chars": 60,
  "chat_limit": "1 per 10s",
  "window_start_iso": "2026-01-13T17:00:00.000Z",
  "prompts_in_window": 42
}
```

### `POST /api/chat`
Chat endpoint

**Request:**
```json
{
  "message": "Wat zijn zijn vaardigheden?"
}
```

**Response:**
```json
{
  "reply": "Stijn's focus ligt vooral op infrastructuur en automatisering..."
}
```

### `GET /chatbot-widget.js`
Widget script voor embedding

### `GET /embed-example.html`
Voorbeeld integratie pagina

## Deployment naar DockerHub

```bash
# Login
docker login

# Build en tag
cd api
docker build -t jouwusername/portfolio-chatbot:latest .

# Push
docker push jouwusername/portfolio-chatbot:latest
```

## Productie Setup met Nginx

### Nginx configuratie

```nginx
server {
    listen 80;
    server_name chatbot.jouwdomein.nl;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # CORS headers (optioneel, backend heeft dit al)
        add_header Access-Control-Allow-Origin *;
    }
}
```

### SSL met Certbot

```bash
sudo certbot --nginx -d chatbot.jouwdomein.nl
```

## Widget Customization

De widget heeft standaard een paarse gradient. Om dit aan te passen, edit `api/public/chatbot-widget.js`:

```javascript
// Zoek naar:
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Vervang met jouw kleuren:
background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
```

## Prompt Aanpassen

Bewerk `api/prompt.json` om de chatbot te personaliseren:

```json
{
  "system_prompt": [
    "Je bent de persoonlijke assistent van [JOUW NAAM].",
    "..."
  ],
  "context": [
    "Naam: [JOUW NAAM]",
    "Rol: [JOUW ROL]",
    "..."
  ]
}
```

## Rate Limiting Aanpassen

In `api/server.cjs`:

```javascript
const MAX_MESSAGE_CHARS = 60;        // Max karakters per bericht
const CHAT_WINDOW_MS = 10 * 1000;    // 10 seconden window
const CHAT_MAX_REQUESTS = 1;         // 1 bericht per window
```

## Discord Rapportage

Elke dag om 18:00 (Europe/Amsterdam) krijg je automatisch een Discord bericht met:
- Aantal verstuurde prompts in afgelopen 24 uur
- Rapportage periode

Configureer via `DISCORD_WEBHOOK_URL` in `.env`.

## Troubleshooting

### Widget laadt niet

Check browser console:
- CORS error → Zorg dat backend CORS enabled heeft (standaard aan)
- 404 error → Controleer apiUrl in CHATBOT_CONFIG

### "De server reageert momenteel niet"

```bash
# Check of backend draait
curl http://jouw-server.com/api/health

# Check logs
docker logs portfolio-chatbot
```

### Rate limiting te streng

Pas `CHAT_WINDOW_MS` en `CHAT_MAX_REQUESTS` aan in `api/server.cjs`.

## Project Structuur

```
.
├── api/
│   ├── server.cjs          # Express backend + API
│   ├── package.json        # Dependencies
│   ├── prompt.json         # ChatGPT system prompt
│   ├── Dockerfile          # Container definitie
│   ├── public/
│   │   ├── chatbot-widget.js      # Standalone widget
│   │   └── embed-example.html     # Voorbeeld pagina
│   └── data/               # Stats opslag (persistent volume)
├── EMBED.md                # Volledige embed instructies
├── INTEGRATION.html        # Portfolio voorbeeld
└── .env                    # Environment variables
```

## Security

- Rate limiting per IP-adres
- Content length beperking (60 karakters)
- Strikte prompt boundaries
- Trust proxy voor reverse proxy compatibiliteit
- CORS configuratie voor veilige cross-origin requests

## License

MIT

## Support

Voor vragen of issues, zie:
- [EMBED.md](EMBED.md) - Volledige embed instructies
- [INTEGRATION.html](INTEGRATION.html) - Volledig voorbeeld
- `http://localhost:3000/embed-example.html` - Test pagina

# Configuratie Opties

## Basis Configuratie

```html
<script>
  window.CHATBOT_CONFIG = {
    apiUrl: 'https://jouw-server.com:3000'
  };
</script>
<script src="https://jouw-server.com:3000/chatbot-widget.js"></script>
```

## Volledige Configuratie

```html
<script>
  window.CHATBOT_CONFIG = {
    // Vereist: API endpoint URL
    apiUrl: 'https://jouw-server.com:3000',

    // Optioneel: Naam van de assistent (standaard: "Assistent")
    assistantName: "Stijn's Assistent",

    // Optioneel: Begroeting bericht (standaard: "Hoi! Ik ben {assistantName}. Hoe kan ik je helpen?")
    greetingMessage: 'Hoi! Stel gerust je vragen over mijn ervaring en projecten.'
  };
</script>
<script src="https://jouw-server.com:3000/chatbot-widget.js"></script>
```

## Configuratie Opties

### `apiUrl` (vereist)
- Type: `string`
- De base URL van je chatbot API
- Voorbeelden:
  - `'https://chatbot.jouwdomein.nl'`
  - `'https://api.jouwdomein.nl'`
  - `'http://localhost:3000'` (voor lokaal testen)
  - `''` (lege string voor zelfde origin)

### `assistantName` (optioneel)
- Type: `string`
- Default: `'Assistent'`
- De naam die wordt getoond in de header van de widget
- Voorbeelden:
  - `"Stijn's Assistent"`
  - `"Portfolio Assistent"`
  - `"Virtuele Assistent"`

### `greetingMessage` (optioneel)
- Type: `string`
- Default: `'Hoi! Ik ben {assistantName}. Hoe kan ik je helpen?'`
- Het eerste bericht dat de gebruiker ziet wanneer de chat opent
- Voorbeelden:
  - `'Hoi! Heb je vragen over mijn ervaring?'`
  - `'Welkom! Vraag gerust wat je wilt weten.'`
  - `'Hey! Waar kan ik je mee helpen?'`

## Voorbeelden

### Minimale Setup

```html
<script>
  window.CHATBOT_CONFIG = { apiUrl: 'https://api.jouwsite.nl' };
</script>
<script src="https://api.jouwsite.nl/chatbot-widget.js"></script>
```

### Zelfde Origin (geen CORS nodig)

Als je chatbot op hetzelfde domein draait als je website:

```html
<script>
  window.CHATBOT_CONFIG = {
    apiUrl: '',  // Lege string = zelfde origin
    assistantName: 'Assistent'
  };
</script>
<script src="/chatbot-widget.js"></script>
```

## Backend Configuratie

De chatbot widget verbindt met deze endpoints:

- **POST** `/api/chat` - Voor het versturen van berichten
- **GET** `/api/health` - Voor health checks (optioneel)

Zorg dat deze endpoints beschikbaar zijn op de `apiUrl` die je configureert.

## Styling Aanpassen

De widget gebruikt deze CSS ID's en classes (mocht je custom styling willen toevoegen):

- `#portfolio-chatbot-fab` - De floating action button
- `#portfolio-chatbot-widget` - De hoofd widget container
- `#portfolio-chatbot-header` - Header met naam en close button
- `#portfolio-chatbot-messages` - Berichten container
- `.portfolio-chat-msg` - Individuele berichten
- `.portfolio-chat-msg.user` - Gebruiker berichten
- `.portfolio-chat-msg.bot` - Bot berichten

Je kunt deze overriden in je eigen CSS als je de kleuren/styling wilt aanpassen.
