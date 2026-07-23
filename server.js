#!/usr/bin/env node
/**
 * Sunday AI — Local Desktop Server
 * ---------------------------------
 * Tumatakbo sa desktop mo. WALANG API keys — ginagamit nito ang mga CLI na
 * naka-login na sa subscriptions mo:
 *
 *   • Claude Agent  → Claude Code CLI  (`claude`)  — Claude Pro/Max subscription
 *   • Codex Agent   → Codex CLI        (`codex`)   — ChatGPT subscription
 *   • GPT Agent     → Codex CLI (OpenAI models via ChatGPT subscription)
 *
 * Setup (isang beses lang):
 *   1. Install Claude Code:  npm install -g @anthropic-ai/claude-code
 *      tapos:  claude   (mag-login gamit ang Claude account mo)
 *   2. Install Codex CLI:    npm install -g @openai/codex
 *      tapos:  codex    (mag-login gamit ang ChatGPT account mo)
 *   3. Patakbuhin:           node server.js
 *   4. Buksan:               http://localhost:8787
 *
 * Walang dependencies — plain Node.js (v18+).
 */

const http = require("http");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;
const HOST = "127.0.0.1"; // localhost lang — hindi naka-expose sa network
const ROOT = __dirname;
const CLI_TIMEOUT_MS = 180_000; // 3 min max kada request

// ---------------------------------------------------------------- utilities

function run(cmd, args, input) {
  return new Promise((resolve) => {
    const child = execFile(
      cmd,
      args,
      { timeout: CLI_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024, windowsHide: true },
      (err, stdout, stderr) => {
        if (err && !stdout) {
          resolve({ ok: false, out: (stderr || err.message || "").trim() });
        } else {
          resolve({ ok: true, out: (stdout || "").trim() });
        }
      }
    );
    if (input && child.stdin) { child.stdin.write(input); child.stdin.end(); }
  });
}

async function which(cmd) {
  const probe = process.platform === "win32" ? "where" : "which";
  const r = await run(probe, [cmd]);
  return r.ok && r.out.length > 0;
}

// ------------------------------------------------------------------ agents

const AGENTS = {
  claude: {
    name: "Claude Agent",
    role: "Analysis & Planning",
    cli: "claude",
    call: (msg) => run("claude", ["-p", msg, "--output-format", "text"]),
  },
  codex: {
    name: "Codex Agent",
    role: "Code Implementation",
    cli: "codex",
    call: (msg) => run("codex", ["exec", "--skip-git-repo-check", msg]),
  },
  gpt: {
    name: "GPT Agent",
    role: "General Assistant",
    cli: "codex", // OpenAI models sa pamamagitan ng ChatGPT subscription
    call: (msg) => run("codex", ["exec", "--skip-git-repo-check", msg]),
  },
};

/** Simpleng router — pipili ng agent base sa laman ng message (gaya sa flowchart). */
function routeAgent(message) {
  const m = message.toLowerCase();
  const codeWords = ["fix", "implement", "code", "bug", "refactor", "test", "deploy", "gawa ng code", "ayusin", "i-run", "terminal", "repo", "commit"];
  const analysisWords = ["analyze", "plan", "review", "explain", "architecture", "design", "suriin", "ipaliwanag", "planuhin", "summary", "document"];
  if (codeWords.some((w) => m.includes(w))) return "codex";
  if (analysisWords.some((w) => m.includes(w))) return "claude";
  return "gpt";
}

// ------------------------------------------------------------------ server

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".md": "text/markdown" };

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // ---- API: status ng mga agent (anong CLI ang naka-install) ----
  if (url.pathname === "/api/status") {
    const [hasClaude, hasCodex] = await Promise.all([which("claude"), which("codex")]);
    return send(res, 200, {
      server: "sunday",
      agents: {
        claude: { name: AGENTS.claude.name, role: AGENTS.claude.role, online: hasClaude },
        codex: { name: AGENTS.codex.name, role: AGENTS.codex.role, online: hasCodex },
        gpt: { name: AGENTS.gpt.name, role: AGENTS.gpt.role, online: hasCodex },
      },
    });
  }

  // ---- API: chat ----
  if (url.pathname === "/api/chat" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 1e6) req.destroy(); });
    req.on("end", async () => {
      let body;
      try { body = JSON.parse(raw); } catch { return send(res, 400, { error: "bad json" }); }
      const message = String(body.message || "").trim();
      if (!message) return send(res, 400, { error: "empty message" });

      const agentKey = AGENTS[body.agent] ? body.agent : routeAgent(message);
      const agent = AGENTS[agentKey];

      if (!(await which(agent.cli))) {
        return send(res, 200, {
          agent: agentKey,
          agentName: agent.name,
          reply:
            `⚠️ Hindi naka-install ang \`${agent.cli}\` CLI sa machine na ito.\n\n` +
            (agent.cli === "claude"
              ? "Install: npm install -g @anthropic-ai/claude-code — tapos patakbuhin ang `claude` para mag-login gamit ang Claude subscription mo."
              : "Install: npm install -g @openai/codex — tapos patakbuhin ang `codex` para mag-login gamit ang ChatGPT subscription mo."),
          offline: true,
        });
      }

      const t0 = Date.now();
      const result = await agent.call(message);
      return send(res, 200, {
        agent: agentKey,
        agentName: agent.name,
        reply: result.out || "(walang sagot)",
        ok: result.ok,
        ms: Date.now() - t0,
      });
    });
    return;
  }

  // ---- Static files (ang dashboard mismo) ----
  let file = url.pathname === "/" ? "/index.html" : url.pathname;
  file = path.normalize(file).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(ROOT, file);
  if (!full.startsWith(ROOT)) return send(res, 403, { error: "forbidden" });
  fs.readFile(full, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain");
    send(res, 200, data, MIME[path.extname(full)] || "application/octet-stream");
  });
});

server.listen(PORT, HOST, () => {
  console.log("");
  console.log("  ☀️  SUNDAY AI — local server");
  console.log(`  →  http://localhost:${PORT}`);
  console.log("");
  console.log("  Agents (via subscriptions, hindi API keys):");
  which("claude").then((ok) => console.log(`   • Claude Agent : ${ok ? "✅ ready (claude CLI)" : "❌ install: npm i -g @anthropic-ai/claude-code"}`));
  which("codex").then((ok) => console.log(`   • Codex/GPT    : ${ok ? "✅ ready (codex CLI)" : "❌ install: npm i -g @openai/codex"}`));
});
