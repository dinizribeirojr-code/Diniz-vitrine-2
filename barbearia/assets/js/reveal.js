/* =============================================================================
 * reveal.js — Animação de entrada das seções (premium, opcional)
 * -----------------------------------------------------------------------------
 * Robusto por padrão: o conteúdo só recebe o estado "escondido" DEPOIS que o
 * JS roda (a classe `reveal-on` é adicionada ao <html>). Se o JS falhar ou o
 * usuário preferir menos movimento, tudo aparece normalmente — nada some.
 * ========================================================================== */

(() => {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  // Só agora ligamos o estado inicial escondido (evita "flash" sem JS).
  document.documentElement.classList.add('reveal-on');

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach((el) => io.observe(el));
})();
