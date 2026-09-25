(function () {
  "use strict";

  // Header background/shadow on scroll
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Mobile nav toggle
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Abrir menu");
      });
    });
  }

  // Reveal on scroll
  var revealEls = document.querySelectorAll("[data-reveal]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  // Assistente virtual (OmniRoute via Netlify Function em /api/chat)
  var chatToggle = document.getElementById("chat-toggle");
  var chatPanel = document.getElementById("chat-panel");
  var chatForm = document.getElementById("chat-form");
  if (chatToggle && chatPanel && chatForm) {
    var chatLog = document.getElementById("chat-log");
    var chatInput = document.getElementById("chat-input");
    var chatSend = chatForm.querySelector("button");
    var history = [];

    var setChatOpen = function (open) {
      chatPanel.hidden = !open;
      chatToggle.setAttribute("aria-expanded", open ? "true" : "false");
      chatToggle.setAttribute("aria-label", open ? "Fechar assistente virtual" : "Abrir assistente virtual");
      if (open) chatInput.focus();
    };

    var addMsg = function (text, kind) {
      var p = document.createElement("p");
      p.className = "chat-msg is-" + kind;
      p.textContent = text;
      chatLog.appendChild(p);
      chatLog.scrollTop = chatLog.scrollHeight;
      return p;
    };

    chatToggle.addEventListener("click", function () { setChatOpen(chatPanel.hidden); });
    document.getElementById("chat-close").addEventListener("click", function () { setChatOpen(false); });

    chatForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = chatInput.value.trim();
      if (!text || chatSend.disabled) return;

      addMsg(text, "user");
      history.push({ role: "user", content: text });
      chatInput.value = "";
      chatSend.disabled = true;
      var typing = addMsg("Digitando…", "assistant is-typing");

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history })
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok || !data.reply) throw new Error(data.error || "Não consegui responder agora.");
            return data.reply;
          });
        })
        .then(function (reply) {
          typing.remove();
          history.push({ role: "assistant", content: reply });
          addMsg(reply, "assistant");
        })
        .catch(function (err) {
          typing.remove();
          history.pop();
          addMsg(err.message || "Não consegui responder agora.", "error");
        })
        .then(function () {
          chatSend.disabled = false;
          chatInput.focus();
        });
    });
  }

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
