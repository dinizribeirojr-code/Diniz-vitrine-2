/* ===========================================================
   Genesis — "Monte a sua página" (prévia ao vivo)

   O visitante escolhe segmento, digita o nome do negócio e vê uma
   landing page nascer dentro de um celular, ao vivo. Nada é salvo em
   servidor: o estado mora só no LINK (hash da URL). Isso é de propósito
   — o link é a divulgação. Quem monta a prévia da própria pousada
   ganha um endereço que, ao ser compartilhado, reabre a prévia pronta.

   Não grava dado de cliente em lugar nenhum (ver CLAUDE.md): só lê e
   escreve o hash da própria URL, no navegador do visitante.
   =========================================================== */
(function () {
  "use strict";

  var WHATS = "5521996816846";

  var STYLES = [
    { id: "roxo",  a1: "#7c5cff", a2: "#4d9fff" },
    { id: "verde", a1: "#12b981", a2: "#3bd6a6" },
    { id: "ambar", a1: "#f59e0b", a2: "#f97316" },
    { id: "rosa",  a1: "#ec4899", a2: "#f472b6" }
  ];

  // Cada segmento: rótulo do chip, texto que aparece na prévia e o
  // "miolo" (o conteúdo abaixo do topo da página fake).
  var SEGMENTS = {
    pousada: {
      label: "Pousada", emoji: "🏝️",
      eyebrow: "Reservas o ano inteiro",
      placeholder: "Pousada Maré Alta",
      tagline: "Sua estadia à beira-mar começa por aqui.",
      cta: "Reservar agora",
      body: function () {
        return card2(
          ["Suíte Vista Mar", "2 pessoas · café incluso", "a partir de R$ 320"],
          ["Chalé Família", "4 pessoas · varanda", "a partir de R$ 480"]
        );
      }
    },
    cardapio: {
      label: "Restaurante", emoji: "🍽️",
      eyebrow: "Cardápio & delivery",
      placeholder: "Cantina do Porto",
      tagline: "Peça pelo WhatsApp e receba quentinho.",
      cta: "Ver cardápio",
      body: function () {
        return menu([
          ["Moqueca de peixe", "R$ 89"],
          ["Camarão à milanesa", "R$ 76"],
          ["Porção de isca", "R$ 42"]
        ]);
      }
    },
    salao: {
      label: "Salão & Beleza", emoji: "💅",
      eyebrow: "Agenda sem ida e volta",
      placeholder: "Studio Bella",
      tagline: "Escolha o serviço e agende em segundos.",
      cta: "Agendar horário",
      body: function () {
        return list([
          ["Corte + escova", "1h"],
          ["Manicure & pedicure", "1h20"],
          ["Coloração", "2h30"]
        ]);
      }
    },
    loja: {
      label: "Loja", emoji: "🛍️",
      eyebrow: "Sua vitrine online",
      placeholder: "Ateliê Luz",
      tagline: "Seus produtos à mostra, pedido pelo WhatsApp.",
      cta: "Ver produtos",
      body: function () {
        return tiles(
          ["Novidade", "Peça do mês"],
          ["Mais vendido", "Kit presente"]
        );
      }
    },
    servicos: {
      label: "Serviços", emoji: "🔧",
      eyebrow: "Orçamento na hora",
      placeholder: "JR Reformas",
      tagline: "Conte o que precisa e receba um orçamento.",
      cta: "Pedir orçamento",
      body: function () {
        return list([
          ["Atendimento na sua região", "hoje"],
          ["Serviço com garantia", "✔"],
          ["Orçamento sem compromisso", "grátis"]
        ]);
      }
    },
    advocacia: {
      label: "Advocacia", emoji: "⚖️",
      eyebrow: "Atendimento com discrição",
      placeholder: "Dr. Almeida Advocacia",
      tagline: "Sua causa nas mãos de quem entende.",
      cta: "Falar com o advogado",
      body: function () {
        return list([
          ["Direito trabalhista", ""],
          ["Direito de família", ""],
          ["Consultoria empresarial", ""]
        ]);
      }
    }
  };

  var ORDER = ["pousada", "cardapio", "salao", "loja", "servicos", "advocacia"];

  /* ---- helpers de markup do miolo da prévia ---- */
  function card2(a, b) {
    return '<div class="pv-cards">' +
      pvCard(a[0], a[1], a[2]) + pvCard(b[0], b[1], b[2]) + '</div>';
  }
  function pvCard(t, s, p) {
    return '<div class="pv-card"><div class="pv-card-ph"></div>' +
      '<div class="pv-card-t">' + esc(t) + '</div>' +
      '<div class="pv-card-s">' + esc(s) + '</div>' +
      '<div class="pv-card-p">' + esc(p) + '</div>' +
      '<span class="pv-mini-btn">Reservar</span></div>';
  }
  function menu(items) {
    var rows = items.map(function (i) {
      return '<div class="pv-row"><span>' + esc(i[0]) + '</span>' +
        '<b>' + esc(i[1]) + '</b></div>';
    }).join("");
    return '<div class="pv-list">' + rows + '</div>';
  }
  function list(items) {
    var rows = items.map(function (i) {
      return '<div class="pv-row"><span>' + esc(i[0]) + '</span>' +
        (i[1] ? '<em>' + esc(i[1]) + '</em>' : '') + '</div>';
    }).join("");
    return '<div class="pv-list">' + rows + '</div>';
  }
  function tiles(a, b) {
    return '<div class="pv-tiles">' +
      '<div class="pv-tile"><div class="pv-tile-ph"></div><span>' + esc(a[0]) + '</span><b>' + esc(a[1]) + '</b></div>' +
      '<div class="pv-tile"><div class="pv-tile-ph"></div><span>' + esc(b[0]) + '</span><b>' + esc(b[1]) + '</b></div>' +
      '</div>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---- estado ---- */
  var state = { seg: "pousada", nome: "", cidade: "", estilo: "roxo" };

  var el = {
    chips: document.getElementById("seg-chips"),
    swatches: document.getElementById("style-swatches"),
    nome: document.getElementById("b-nome"),
    cidade: document.getElementById("b-cidade"),
    screen: document.getElementById("pv-screen"),
    whats: document.getElementById("b-whats"),
    share: document.getElementById("b-share"),
    hint: document.getElementById("pv-hint")
  };
  if (!el.screen) { return; }

  /* ---- monta chips e swatches ---- */
  ORDER.forEach(function (key) {
    var s = SEGMENTS[key];
    var b = document.createElement("button");
    b.type = "button";
    b.className = "seg-chip";
    b.dataset.seg = key;
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = '<span aria-hidden="true">' + s.emoji + "</span> " + esc(s.label);
    b.addEventListener("click", function () {
      state.seg = key;
      el.nome.placeholder = "Ex.: " + s.placeholder;
      sync();
    });
    el.chips.appendChild(b);
  });

  STYLES.forEach(function (st) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.dataset.estilo = st.id;
    b.style.background = "linear-gradient(135deg," + st.a1 + "," + st.a2 + ")";
    b.setAttribute("aria-label", "Estilo " + st.id);
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () { state.estilo = st.id; sync(); });
    el.swatches.appendChild(b);
  });

  el.nome.addEventListener("input", function () { state.nome = el.nome.value; sync(); });
  el.cidade.addEventListener("input", function () { state.cidade = el.cidade.value; sync(); });

  /* ---- render da prévia ---- */
  function render() {
    var seg = SEGMENTS[state.seg];
    var st = STYLES.filter(function (x) { return x.id === state.estilo; })[0] || STYLES[0];
    var nome = state.nome.trim() || seg.placeholder;
    var inicial = nome.charAt(0).toUpperCase();

    el.screen.style.setProperty("--pv-a1", st.a1);
    el.screen.style.setProperty("--pv-a2", st.a2);

    el.screen.innerHTML =
      '<div class="pv-top"><span class="pv-logo">' + esc(inicial) + '</span>' +
        '<span class="pv-name">' + esc(nome) + '</span>' +
        '<span class="pv-burger" aria-hidden="true"></span></div>' +
      '<div class="pv-hero">' +
        '<span class="pv-eyebrow">' + esc(seg.eyebrow) + '</span>' +
        '<h4 class="pv-title">' + esc(nome) + '</h4>' +
        (state.cidade.trim() ? '<span class="pv-city">📍 ' + esc(state.cidade.trim()) + '</span>' : '') +
        '<p class="pv-tag">' + esc(seg.tagline) + '</p>' +
        '<span class="pv-cta">' + esc(seg.cta) + '</span>' +
      '</div>' +
      '<div class="pv-content">' + seg.body() + '</div>' +
      '<div class="pv-wa"><span class="pv-wa-dot"></span> Falar no WhatsApp</div>';

    if (el.hint) {
      el.hint.textContent = "Prévia de " + seg.label.toLowerCase() +
        " · muda ao vivo enquanto você digita";
    }
  }

  /* ---- marca chips/swatch ativos ---- */
  function marcarAtivos() {
    el.chips.querySelectorAll(".seg-chip").forEach(function (c) {
      var on = c.dataset.seg === state.seg;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    el.swatches.querySelectorAll(".swatch").forEach(function (c) {
      var on = c.dataset.estilo === state.estilo;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* ---- link compartilhável (a divulgação) ---- */
  function serialize() {
    var p = new URLSearchParams();
    p.set("s", state.seg);
    if (state.nome.trim()) { p.set("n", state.nome.trim()); }
    if (state.cidade.trim()) { p.set("c", state.cidade.trim()); }
    if (state.estilo !== "roxo") { p.set("e", state.estilo); }
    return p.toString();
  }
  function shareUrl() {
    return location.origin + location.pathname + "#previa=" + serialize();
  }
  function updateHash() {
    var novo = "#previa=" + serialize();
    if ("#" + location.hash.replace(/^#/, "") !== novo) {
      history.replaceState(null, "", novo);
    }
  }

  function updateWhats() {
    var seg = SEGMENTS[state.seg];
    var nome = state.nome.trim();
    var msg = "Olá! Montei uma prévia no site da Genesis: um site de " +
      seg.label.toLowerCase() +
      (nome ? " para " + nome : "") +
      (state.cidade.trim() ? " em " + state.cidade.trim() : "") +
      ". Quero a página de verdade. Minha prévia: " + shareUrl();
    el.whats.href = "https://wa.me/" + WHATS + "?text=" + encodeURIComponent(msg);
  }

  var hashTimer;
  function sync() {
    render();
    marcarAtivos();
    updateWhats();
    clearTimeout(hashTimer);
    hashTimer = setTimeout(updateHash, 250);
  }

  /* ---- botão copiar link ---- */
  el.share.addEventListener("click", function () {
    updateHash();
    var url = shareUrl();
    var done = function () {
      var txt = el.share.textContent;
      el.share.textContent = "Link copiado ✓";
      el.share.classList.add("is-copied");
      setTimeout(function () {
        el.share.textContent = txt;
        el.share.classList.remove("is-copied");
      }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url, done); });
    } else {
      fallbackCopy(url, done);
    }
  });
  function fallbackCopy(text, cb) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      cb();
    } catch (e) {
      el.share.textContent = "Copie da barra de endereço";
      setTimeout(function () { el.share.textContent = "Copiar link da prévia"; }, 2200);
    }
  }

  /* ---- lê o link ao abrir (reabre a prévia compartilhada) ---- */
  function fromHash() {
    var m = location.hash.match(/previa=(.*)$/);
    if (!m) { return; }
    var p = new URLSearchParams(m[1]);
    if (p.get("s") && SEGMENTS[p.get("s")]) { state.seg = p.get("s"); }
    if (p.get("n")) { state.nome = p.get("n").slice(0, 32); }
    if (p.get("c")) { state.cidade = p.get("c").slice(0, 28); }
    if (p.get("e")) { state.estilo = p.get("e"); }
    el.nome.value = state.nome;
    el.cidade.value = state.cidade;
  }

  fromHash();
  el.nome.placeholder = "Ex.: " + SEGMENTS[state.seg].placeholder;
  sync();
})();
