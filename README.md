# MermaidMind

A local web service for creating, rendering, and managing Mermaid diagrams with AI assistance via Azure OpenAI.

## Features

- **Code Editor** -- Side-by-side Mermaid code editor with line numbers and live preview
- **AI Generate** -- Describe a diagram in plain English, AI creates the Mermaid code
- **AI Theme** -- Apply color themes using presets (Ocean, Sunset, Forest, etc.) or custom descriptions
- **AI Fix** -- Auto-fix syntax errors and improve diagram structure
- **AI Explain** -- Get a plain English explanation of any diagram
- **AI Expand** -- Add more detail and nodes to existing diagrams
- **Export** -- Download diagrams as SVG, PNG, or PDF
- **Presentation Mode** -- Fullscreen view with pan/zoom controls
- **Version Snapshots** -- Save manual snapshots and restore previous versions
- **Tags** -- Tag diagrams and filter by tags
- **Search** -- Search diagrams by name, source, or tags
- **Dark/Light Theme** -- Toggle between dark and light UI themes
- **All Mermaid Types** -- Flowchart, sequence, class, state, ER, gantt, pie, mindmap, timeline, and more

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Server | Express.js |
| AI | Azure OpenAI (gpt-4o) |
| Database | SQLite (better-sqlite3) |
| Frontend | Vanilla HTML/CSS/JS |
| Renderer | Mermaid.js (CDN) |
| PDF Export | jsPDF (CDN) |

## Setup

```bash
# Install dependencies
npm install

# Configure Azure OpenAI
cp .env.example .env
# Edit .env with your Azure OpenAI credentials

# Run
npm run dev
```

Open http://localhost:3940

## Configuration

Set these in `.env` or via the Settings panel in the UI:

| Variable | Description |
|---|---|
| `AZURE_OPENAI_API_KEY` | Your Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | e.g. `https://your-resource.openai.azure.com` |
| `AZURE_OPENAI_API_VERSION` | API version (default: `2024-02-01`) |
| `AZURE_OPENAI_DEPLOYMENT` | Deployment name (default: `gpt-4o`) |
| `PORT` | Server port (default: `3940`) |

Settings can also be configured at runtime via the UI settings panel. UI settings override `.env` values.

## Running as a Background Daemon (macOS)

You can run MermaidMind as a background daemon using macOS `launchd` so it starts automatically on login and restarts if it crashes.

### Setup

Create the file `~/Library/LaunchAgents/com.mermaid.mind.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mermaid.mind</string>

    <key>WorkingDirectory</key>
    <string>/path/to/mermaid-mind</string>

    <key>ProgramArguments</key>
    <array>
        <string>/path/to/node</string>
        <string>server.js</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>~/Library/Logs/mermaid-mind.log</string>

    <key>StandardErrorPath</key>
    <string>~/Library/Logs/mermaid-mind.err.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/path/to/node/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>PORT</key>
        <string>3940</string>
    </dict>
</dict>
</plist>
```

> Replace `/path/to/node` with the output of `which node` and `/path/to/mermaid-mind` with your actual project path.

### Commands

```bash
# Load and start the daemon
launchctl load ~/Library/LaunchAgents/com.mermaid.mind.plist

# Stop and unload the daemon
launchctl unload ~/Library/LaunchAgents/com.mermaid.mind.plist

# Check status
launchctl list | grep mermaid

# View logs
tail -f ~/Library/Logs/mermaid-mind.log
tail -f ~/Library/Logs/mermaid-mind.err.log
```

The server will be available at `http://localhost:3940` after loading.

## Project Structure

```
mermaid-mind/
  server.js          # Express server, API routes, settings, AI integration
  db.js              # SQLite schema and query helpers
  public/
    index.html       # Single-page frontend
  .env.example       # Environment variable template
  package.json
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/settings` | Get settings (secrets masked) |
| `POST` | `/settings` | Update settings |
| `POST` | `/settings/test` | Test Azure OpenAI connection |
| `POST` | `/api/generate` | Text description to Mermaid diagram |
| `POST` | `/api/save` | Save diagram |
| `PUT` | `/api/history/:id` | Update diagram |
| `GET` | `/api/history` | List all diagrams |
| `GET` | `/api/history/:id` | Get single diagram |
| `DELETE` | `/api/history/:id` | Delete diagram |
| `POST` | `/api/auto-name` | Generate name from code |
| `POST` | `/api/ai-action` | AI actions (theme, fix, explain, expand) |
| `GET/POST/DELETE` | `/api/history/:id/tags` | Manage diagram tags |
| `GET/POST` | `/api/history/:id/versions` | Manage version snapshots |
| `GET` | `/api/tags` | List all tags |
