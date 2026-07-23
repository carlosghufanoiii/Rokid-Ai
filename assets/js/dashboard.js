/* Sunday AI — lightweight dashboard interactions (no dependencies) */
(function () {
  "use strict";

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

  // ---- Chat composer (demo echo) ----
  var input = document.getElementById("msg");
  var send = document.getElementById("send");
  var body = document.querySelector(".conv__body");

  function nowLabel() {
    return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  function addBubble(text, who) {
    if (!body) return;
    var b = document.createElement("div");
    b.className = "bubble bubble--" + who;
    b.innerHTML = text.replace(/</g, "&lt;") + '<small>' + nowLabel() + "</small>";
    body.appendChild(b);
    body.scrollTop = body.scrollHeight;
  }
  function submit() {
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    addBubble(text, "me");
    input.value = "";
    setTimeout(function () {
      addBubble("On it, Boss — routing that to the right agent now.", "ai");
    }, 650);
  }
  if (send) send.addEventListener("click", submit);
  if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
})();
