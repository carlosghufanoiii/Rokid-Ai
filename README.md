# Sunday AI Assistant

Personal AI assistant — para sa coding, automation at personal productivity.
Rebrand ng "Jarvis" na design papuntang **Sunday**. Gumagamit ng Claude, Codex at GPT
**gamit ang subscriptions mo (walang API keys, walang per-token na bayad).**

> Walang build step, walang npm dependencies. Ang server ay plain Node.js.

## ⚡ Totoong AI Chat — gamit ang Subscriptions mo

Ang dashboard ay kumokonekta sa maliit na **local server sa desktop mo** na
tumatawag sa mga CLI na naka-login na sa accounts mo:

| Agent | CLI | Subscription |
|---|---|---|
| Claude Agent | `claude` (Claude Code) | Claude Pro / Max |
| Codex Agent | `codex` (Codex CLI) | ChatGPT Plus / Pro |
| GPT Agent | `codex` (OpenAI models) | ChatGPT Plus / Pro |

### Setup (isang beses lang)

```bash
# 1. Claude Code CLI — mag-login gamit ang Claude account mo
npm install -g @anthropic-ai/claude-code
claude   # sundan ang login

# 2. Codex CLI — mag-login gamit ang ChatGPT account mo
npm install -g @openai/codex
codex    # sundan ang login

# 3. Patakbuhin si Sunday
node server.js
# buksan: http://localhost:8787
```

Kapag tumatakbo ang server: **LIVE mode** — totoong sagot mula kina Claude/GPT/Codex,
at ang AI Agents panel ay nagpapakita ng tunay na online/offline status.
Kapag walang server (binuksan lang ang HTML): **demo mode** — canned reply lang.

Ang simpleng router (gaya sa flowchart) ang pumipili ng agent:
mga salitang pang-code (*fix, implement, ayusin, test…*) → **Codex** ·
analysis (*explain, plan, suriin, review…*) → **Claude** · iba pa → **GPT**.

## Mga Page

| File | Description |
|------|-------------|
| `index.html` | **Dashboard UI** — voice control, active projects, system status, AI agents, live chat, at recent activity. |
| `flowchart.html` | **Architecture Flowchart** — buong system flow: input modes → STT → intent → router → agents → tools → execution → approval → output. |
| `server.js` | **Local desktop server** — nagruruta ng chat papunta sa Claude/Codex CLIs (subscriptions mo). |

## Demo lang (walang AI)?

```bash
# Opsyon 1: buksan diretso
open index.html            # macOS
xdg-open index.html        # Linux

# Opsyon 2: static server
python3 -m http.server 8000
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
├── server.js             # Local server → Claude/Codex CLIs (subscriptions)
└── assets/
    ├── css/styles.css     # Shared dark-HUD theme
    └── js/dashboard.js    # Live/demo chat, agent status, clock, waveform
```

## Stack

Frontend: static HTML/CSS/JS (dark-HUD) · Server: plain Node.js (walang deps) ·
AI: Claude Code CLI + Codex CLI — naka-login sa **subscriptions**, hindi API keys.
