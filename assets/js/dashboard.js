/* Sunday AI — dashboard interactions (no dependencies)
 *
 * Dalawang mode:
 *  • LIVE — kapag tumatakbo via `node server.js`: ang chat ay dumadaan sa
 *    /api/chat at sinasagot ng TOTOONG agents (Claude CLI / Codex CLI na
 *    naka-login sa subscriptions mo). Ang AI Agents panel ay nagpapakita ng
 *    tunay na online/offline status mula sa /api/status.
 *  • DEMO — kapag binuksan ang file nang walang server (o via static host):
 *    canned reply lang, gaya ng dati.
 */
(function () {
  "use strict";

  var LIVE = false; // magiging true kapag na-detect ang local server

  // ---- Animated voice waveform ----
  function buildWave(el, bars) {
    if (!el) return;
    for (var i = 0; i < bars; i++) {
      var s = document.createElement("span");
      s.style.animationDelay = (Math.random() * 1.1).toFixed(2) + "s";
      s.style.height = (5 + Math.random() * 22).toFixed(0) + "px";
      el.appendChild(s);
    }
  }
  buildWave(document.getElementById("wave"), 26);
  buildWave(document.getElementById("wave2"), 26);

  // ---- Live clock ----
  var clock = document.getElementById("clock");
  function tick() {
    if (!clock) return;
    var now = new Date();
    var day = now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    var time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    clock.textContent = day + " · " + time;
  }
  tick();
  setInterval(tick, 15000);

  // ---- Sidebar active state ----
  var navItems = document.querySelectorAll(".nav__item");
  navItems.forEach(function (item) {
    item.addEventListener("click", function () {
      navItems.forEach(function (n) { n.classList.remove("nav__item--active"); });
      item.classList.add("nav__item--active");
    });
  });

  // ---- Agent status (LIVE mode) ----
  function setAgentBadge(key, online) {
    var el = document.querySelector('[data-agent-status="' + key + '"]');
    if (!el) return;
    el.textContent = online ? "ONLINE" : "OFFLINE";
    el.className = "badge " + (online ? "badge--green" : "badge--amber");
  }

  function detectServer() {
    return fetch("/api/status", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || data.server !== "sunday") return;
        LIVE = true;
        Object.keys(data.agents || {}).forEach(function (k) {
          setAgentBadge(k, !!data.agents[k].online);
        });
      })
      .catch(function () { /* walang server — demo mode */ });
  }
  detectServer();
  setInterval(detectServer, 30000);

  // ---- Chat ----
  var input = document.getElementById("msg");
  var send = document.getElementById("send");
  var body = document.querySelector(".conv__body");
  var busy = false;

  function nowLabel() {
    return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  function esc(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function addBubble(text, who, meta) {
    if (!body) return null;
    var b = document.createElement("div");
    b.className = "bubble bubble--" + who;
    b.innerHTML = esc(text).replace(/\n/g, "<br>") +
      "<small>" + (meta ? esc(meta) + " · " : "") + nowLabel() + "</small>";
    body.appendChild(b);
    body.scrollTop = body.scrollHeight;
    return b;
  }

  function liveChat(text) {
    var thinking = addBubble("⏳ Iniisip…", "ai", "Sunday");
    busy = true;
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (thinking) thinking.remove();
        var meta = data.agentName || "Sunday";
        if (data.ms) meta += " · " + (data.ms / 1000).toFixed(1) + "s";
        addBubble(data.reply || data.error || "(walang sagot)", "ai", meta);
      })
      .catch(function (e) {
        if (thinking) thinking.remove();
        addBubble("⚠️ Nawala ang koneksyon sa local server: " + e.message, "ai", "Sunday");
      })
      .finally(function () { busy = false; });
  }

  function demoChat() {
    setTimeout(function () {
      addBubble(
        "On it, Boss — demo mode ito. Para sa TOTOONG sagot (Claude/GPT/Codex gamit ang subscriptions mo), patakbuhin ang: node server.js",
        "ai", "Sunday");
    }, 650);
  }

  function submit() {
    if (!input || busy) return;
    var text = input.value.trim();
    if (!text) return;
    addBubble(text, "me");
    input.value = "";
    if (LIVE) liveChat(text); else demoChat();
  }
  if (send) send.addEventListener("click", submit);
  if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
})();
