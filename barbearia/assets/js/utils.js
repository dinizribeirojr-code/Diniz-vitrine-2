/* =============================================================================
 * utils.js — Formatação (BRL, datas pt-BR) e validações
 * ========================================================================== */

const Utils = (() => {
  const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  // ---- Moeda ----------------------------------------------------------------
  const brl = (cents) =>
    (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // ---- Datas (trabalhamos com 'YYYY-MM-DD' para o dia, evitando fuso) -------
  const pad = (n) => String(n).padStart(2, '0');

  // Data local -> 'YYYY-MM-DD'
  const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // 'YYYY-MM-DD' -> Date (meia-noite local)
  const parseISODate = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const todayISO = () => toISODate(new Date());

  // minutos desde meia-noite -> 'HH:MM'
  const minutesToHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

  // 'HH:MM' -> minutos desde meia-noite
  const hhmmToMinutes = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };

  const weekdayOf = (isoDate) => parseISODate(isoDate).getDay();

  // 'YYYY-MM-DD' -> 'Ter, 12 de Ago'
  const prettyDate = (isoDate) => {
    const d = parseISODate(isoDate);
    return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()].slice(0, 3)}`;
  };

  // 'YYYY-MM-DD' -> '12/08/2025' (padrão brasileiro)
  const brDate = (isoDate) => {
    const d = parseISODate(isoDate);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const longDate = (isoDate) => {
    const d = parseISODate(isoDate);
    return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
  };

  // minutos "agora" no dia local (para bloquear horários passados)
  const nowMinutes = () => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  };

  const durationLabel = (min) => {
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h${pad(m)}` : `${h}h`;
  };

  // ---- Validações -----------------------------------------------------------
  const onlyDigits = (s) => (s || '').replace(/\D/g, '');

  const isValidPhone = (s) => {
    const d = onlyDigits(s);
    return d.length === 10 || d.length === 11; // fixo ou celular BR
  };

  const isValidEmail = (s) =>
    !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()); // e-mail é opcional aqui

  const isRequiredEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim());

  // Máscara de telefone brasileiro enquanto digita
  const maskPhone = (s) => {
    const d = onlyDigits(s).slice(0, 11);
    if (d.length <= 2) return d.replace(/(\d{0,2})/, '($1');
    if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  // ---- Diversos -------------------------------------------------------------
  const uid = (prefix = 'id') =>
    `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  // número de agendamento legível: AG-YYMMDD-XXXX
  const bookingNumber = () => {
    const d = new Date();
    const stamp = `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const rnd = Math.floor(1000 + Math.random() * 9000);
    return `AG-${stamp}-${rnd}`;
  };

  const escapeHtml = (s) =>
    String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  return {
    WEEKDAYS, WEEKDAYS_SHORT, MONTHS,
    brl, toISODate, parseISODate, todayISO, minutesToHHMM, hhmmToMinutes,
    weekdayOf, prettyDate, brDate, longDate, nowMinutes, durationLabel,
    onlyDigits, isValidPhone, isValidEmail, isRequiredEmail, maskPhone,
    uid, bookingNumber, escapeHtml,
  };
})();
