/* ===========================================================
   Genesis AI — medição de contatos pelo WhatsApp

   COMO LIGAR (leva um minuto):

   1) Google Analytics (gratuito) — crie a conta em analytics.google.com,
      pegue o ID de medição no formato G-XXXXXXXXXX e cole em GA4_ID.

   2) Google Ads (só quando for anunciar) — crie uma conversão do tipo
      site, categoria "contato". O Google gera dois valores:
      o ID da conta (AW-000000000) e o rótulo da conversão.
      Cole em ADS_ID e ADS_LABEL.

   Enquanto os campos estiverem vazios este arquivo NÃO carrega nada,
   NÃO cria cookie e NÃO faz nenhuma requisição. O site segue igual.
   =========================================================== */
(function () {
  "use strict";

  /* ===== PREENCHA AQUI ===== */
  var GA4_ID    = "";   // ex.: "G-XXXXXXXXXX"
  var ADS_ID    = "";   // ex.: "AW-123456789"
  var ADS_LABEL = "";   // ex.: "AbC-D_efGhIjKl"
  /* ========================= */

  // Sem configuração, não faz absolutamente nada.
  if (!GA4_ID && !ADS_ID) { return; }

  // De qual parte da página veio o clique — assim você descobre o que
  // realmente traz contato, em vez de só quantos contatos vieram.
  function origem(el) {
    if (el.classList.contains("whatsapp-float")) { return "botao-flutuante"; }
    if (el.closest(".site-header")) { return "cabecalho"; }
    if (el.closest(".site-footer")) { return "rodape"; }
    var sec = el.closest("section[id]");
    return (sec && sec.id) ? sec.id : "outro";
  }

  var tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + (GA4_ID || ADS_ID);
  document.head.appendChild(tag);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("js", new Date());
  if (GA4_ID) { gtag("config", GA4_ID, { anonymize_ip: true }); }
  if (ADS_ID) { gtag("config", ADS_ID); }

  document.querySelectorAll('a[href*="wa.me"]').forEach(function (link) {
    link.addEventListener("click", function () {
      var secao = origem(link);

      // Relatório do Analytics: quantos contatos e de onde saíram.
      if (GA4_ID) {
        gtag("event", "contato_whatsapp", { secao: secao });
      }

      // Conversão do Google Ads: o que ensina a campanha a otimizar.
      if (ADS_ID && ADS_LABEL) {
        gtag("event", "conversion", { send_to: ADS_ID + "/" + ADS_LABEL });
      }
    });
  });
})();
