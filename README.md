# Sunday AI Assistant

Personal AI assistant concept — para sa coding, automation at personal productivity.
Rebrand ng "Jarvis" na design papuntang **Sunday**. Gumagamit ng Claude, Codex at GPT.

> Static site — walang build step, walang dependencies. Buksan lang ang `index.html`.

## Mga Page

| File | Description |
|------|-------------|
| `index.html` | **Dashboard UI** — voice control, active projects, system status, AI agents, chat, at recent activity. |
| `flowchart.html` | **Architecture Flowchart** — buong system flow: input modes → STT → intent → router → agents → tools → execution → approval → output. |

## Paano Patakbuhin

Walang kailangang i-install. Piliin ang isa:

```bash
# Opsyon 1: buksan diretso
open index.html            # macOS
xdg-open index.html        # Linux

# Opsyon 2: local server (mas malinis para sa assets)
python3 -m http.server 8000
# tapos buksan http://localhost:8000
```

## GitHub Pages

Puwedeng i-host nang libre:
1. Repo **Settings → Pages**
2. Source: branch na ito, `/root` folder
3. Buksan ang binigay na URL — `index.html` ang landing page.

## Structure

```
.
├── index.html            # Dashboard
├── flowchart.html        # Architecture diagram
└── assets/
    ├── css/styles.css     # Shared dark-HUD theme
    └── js/dashboard.js    # Live clock, waveform, chat demo
```

## Stack (concept — nasa flowchart)

Frontend: Tauri + React + Next.js · Backend: Node.js / FastAPI · DB: PostgreSQL + pgvector ·
AI: Claude API, Codex CLI, GPT API · STT: Whisper · TTS: ElevenLabs.
