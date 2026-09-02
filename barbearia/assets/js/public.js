/* =============================================================================
 * public.js — Página pública + fluxo de agendamento (cliente)
 * ========================================================================== */

(() => {
  const cfg = window.APP_CONFIG;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // ---- Toast ---------------------------------------------------------------
  function toast(msg, kind = '') {
    const wrap = $('#toastWrap');
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  // ---- Avaliações estáticas (demo) -----------------------------------------
  const REVIEWS = [
    { stars: 5, text: 'Melhor degradê que já fiz. Marquei pelo site e nem esperei.', author: 'Marcos V.' },
    { stars: 5, text: 'Atendimento no horário certinho, ambiente impecável.', author: 'André S.' },
    { stars: 5, text: 'O combo premium vale cada centavo. Recomendo o Diego.', author: 'Felipe N.' },
  ];

  // =========================================================================
  // RENDER DA PÁGINA
  // =========================================================================
  function renderBrand() {
    const b = cfg.brand;
    $('#brandLogo').textContent = b.logoText;
    $('#brandName').textContent = b.name;
    $('#brandSub').textContent = b.tagline;
    $('#footBrand').textContent = b.name;
    $('#heroImg').src = b.heroImage;
    $('#heroImg').alt = `Ambiente da ${b.name}`;
    $('#infoAddress').textContent = b.address;
    $('#infoPhone').textContent = b.phone;
    $('#mapsLink').href = b.maps;
    $('#igLink').href = b.instagram;
    $('#year').textContent = new Date().getFullYear();

    const waMsg = `Olá! Vim pelo site da ${b.name} e gostaria de agendar um horário.`;
    $('#waContato').href = Notify.whatsappLink(b.whatsapp, waMsg);
    $('#waFloat').href = Notify.whatsappLink(b.whatsapp, waMsg);
  }

  function renderServices() {
    const grid = $('#servicesGrid');
    const services = DB.query('services', (s) => s.active);
    grid.innerHTML = services.map((s) => `
      <article class="service-card">
        <div class="svc-top">
          <h3>${Utils.escapeHtml(s.name)}</h3>
          <span class="price">${Utils.brl(s.priceCents)}</span>
        </div>
        <p class="desc">${Utils.escapeHtml(s.description)}</p>
        <div class="meta">
          <span class="tag">⏱ ${Utils.durationLabel(s.durationMin)}</span>
        </div>
        <button class="btn btn-ghost btn-sm" data-book-service="${s.id}">Agendar este</button>
      </article>
    `).join('');
  }

  function renderBarbers() {
    const grid = $('#barbersGrid');
    const barbers = DB.query('barbers', (b) => b.active);
    grid.innerHTML = barbers.map((b) => `
      <article class="barber-card">
        <div class="barber-photo"><img src="${b.photo}" alt="${Utils.escapeHtml(b.name)}" loading="lazy" onerror="this.style.display='none'"/></div>
        <div class="barber-body">
          <h3>${Utils.escapeHtml(b.name)}</h3>
          <div class="spec">${b.specialties.map((sp) => `<span class="tag">${Utils.escapeHtml(sp)}</span>`).join('')}</div>
          <p class="bio">${Utils.escapeHtml(b.bio || '')}</p>
        </div>
      </article>
    `).join('');
  }

  function renderReviews() {
    $('#reviewsGrid').innerHTML = REVIEWS.map((r) => `
      <article class="review-card">
        <div class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
        <p class="text">"${Utils.escapeHtml(r.text)}"</p>
        <p class="author">— ${Utils.escapeHtml(r.author)}</p>
      </article>
    `).join('');
  }

  function renderHours() {
    const list = $('#hoursList');
    const today = new Date().getDay();
    const rows = [1, 2, 3, 4, 5, 6, 0].map((wd) => {
      const bh = Scheduling.businessHoursFor(wd);
      const label = Utils.WEEKDAYS[wd];
      let val;
      if (!bh || bh.closed) val = 'Fechado';
      else val = `${Utils.minutesToHHMM(bh.open)}–${Utils.minutesToHHMM(bh.close)}`;
      return `<li class="${wd === today ? 'today' : ''}"><span>${label}</span><span>${val}</span></li>`;
    });
    list.innerHTML = rows.join('');

    // badge do hero
    const bh = Scheduling.businessHoursFor(today);
    $('#heroHours').textContent = (!bh || bh.closed)
      ? 'Fechado hoje'
      : `${Utils.minutesToHHMM(bh.open)}–${Utils.minutesToHHMM(bh.close)}`;
  }

  // =========================================================================
  // FLUXO DE AGENDAMENTO (modal com etapas)
  // =========================================================================
  const state = {
    step: 1,
    serviceId: null,
    barberId: 'any',      // 'any' ou id
    date: null,
    startMin: null,
    assignedBarberId: null,
    customer: { name: '', phone: '', email: '', notes: '' },
    result: null,
  };

  const STEPS = ['Serviço', 'Profissional', 'Data e hora', 'Seus dados', 'Confirmação'];

  function openBooking(preselectServiceId) {
    Object.assign(state, {
      step: 1, serviceId: preselectServiceId || null, barberId: 'any',
      date: null, startMin: null, assignedBarberId: null,
      customer: { name: '', phone: '', email: '', notes: '' }, result: null,
    });
    if (preselectServiceId) state.step = 2;
    renderModal();
  }

  function closeBooking() { $('#bookingRoot').innerHTML = ''; }

  function renderModal() {
    const root = $('#bookingRoot');
    root.innerHTML = `
      <div class="modal-backdrop" data-backdrop>
        <div class="modal" role="dialog" aria-modal="true" aria-label="Agendamento">
          <div class="modal-header">
            <h3>${state.result ? 'Tudo certo!' : 'Agendar horário'}</h3>
            <button class="modal-close" data-close aria-label="Fechar">✕</button>
          </div>
          <div class="modal-body" id="modalBody"></div>
        </div>
      </div>`;
    renderStep();
  }

  function stepperHTML() {
    if (state.result) return '';
    const bars = STEPS.map((_, i) =>
      `<div class="step ${i + 1 <= state.step ? 'active' : ''}"></div>`).join('');
    return `<div class="stepper">${bars}</div>
      <div class="step-label">Etapa ${state.step} de ${STEPS.length} · <b>${STEPS[state.step - 1]}</b></div>`;
  }

  function renderStep() {
    const body = $('#modalBody');
    if (state.result) return renderSuccess(body);
    let html = stepperHTML();
    if (state.step === 1) html += stepService();
    else if (state.step === 2) html += stepBarber();
    else if (state.step === 3) html += stepDateTime();
    else if (state.step === 4) html += stepCustomer();
    else if (state.step === 5) html += stepSummary();
    body.innerHTML = html;
    wireStep();
  }

  // ---- Etapa 1: serviço ----------------------------------------------------
  function stepService() {
    const services = DB.query('services', (s) => s.active);
    return `
      <div class="option-list">
        ${services.map((s) => `
          <button class="option ${state.serviceId === s.id ? 'selected' : ''}" data-service="${s.id}">
            <span class="opt-avatar">✂️</span>
            <span class="opt-main">
              <span class="t">${Utils.escapeHtml(s.name)}</span>
              <span class="s">${Utils.escapeHtml(s.description)} · ${Utils.durationLabel(s.durationMin)}</span>
            </span>
            <span class="opt-price">${Utils.brl(s.priceCents)}</span>
          </button>`).join('')}
      </div>
      <div class="modal-nav">
        <span></span>
        <button class="btn btn-primary" data-next ${state.serviceId ? '' : 'disabled'}>Continuar</button>
      </div>`;
  }

  // ---- Etapa 2: barbeiro ---------------------------------------------------
  function stepBarber() {
    const barbers = DB.query('barbers', (b) => b.active);
    const anyCard = `
      <button class="option ${state.barberId === 'any' ? 'selected' : ''}" data-barber="any">
        <span class="opt-avatar">⭐</span>
        <span class="opt-main">
          <span class="t">Qualquer profissional</span>
          <span class="s">Mais horários disponíveis — encaixamos com quem estiver livre</span>
        </span>
      </button>`;
    return `
      <div class="option-list">
        ${anyCard}
        ${barbers.map((b) => `
          <button class="option ${state.barberId === b.id ? 'selected' : ''}" data-barber="${b.id}">
            <span class="opt-avatar"><img src="${b.photo}" alt="" onerror="this.parentNode.textContent='💈'"/></span>
            <span class="opt-main">
              <span class="t">${Utils.escapeHtml(b.name)}</span>
              <span class="s">${b.specialties.slice(0, 3).join(' · ')}</span>
            </span>
          </button>`).join('')}
      </div>
      <div class="modal-nav">
        <button class="btn btn-ghost" data-prev>Voltar</button>
        <button class="btn btn-primary" data-next>Continuar</button>
      </div>`;
  }

  // ---- Etapa 3: data e hora ------------------------------------------------
  function stepDateTime() {
    const svc = DB.get('services', state.serviceId);
    const dates = Scheduling.availableDates(state.barberId, svc.durationMin);
    if (!dates.length) {
      return `<div class="state"><div class="ico">📅</div>
        Não há horários livres nos próximos dias para este serviço.
        <div style="margin-top:14px"><button class="btn btn-ghost" data-prev>Voltar</button></div></div>`;
    }
    if (!state.date || !dates.includes(state.date)) state.date = dates[0];

    const chips = dates.slice(0, 21).map((iso) => {
      const d = Utils.parseISODate(iso);
      return `<button class="date-chip ${state.date === iso ? 'selected' : ''}" data-date="${iso}">
        <div class="dow">${Utils.WEEKDAYS_SHORT[d.getDay()]}</div>
        <div class="dnum">${d.getDate()}</div>
        <div class="mon">${Utils.MONTHS[d.getMonth()].slice(0, 3)}</div>
      </button>`;
    }).join('');

    return `
      <div class="date-scroller">${chips}</div>
      <div id="slotsArea">${slotsHTML()}</div>
      <div class="modal-nav">
        <button class="btn btn-ghost" data-prev>Voltar</button>
        <button class="btn btn-primary" data-next ${state.startMin != null ? '' : 'disabled'}>Continuar</button>
      </div>`;
  }

  function slotsHTML() {
    const svc = DB.get('services', state.serviceId);
    let starts;
    if (state.barberId === 'any') {
      starts = Scheduling.anyBarberStarts(state.date, svc.durationMin).map((x) => x.startMin);
    } else {
      starts = Scheduling.availableStarts(state.barberId, state.date, svc.durationMin);
    }
    if (!starts.length) {
      return `<div class="state"><div class="ico">⌛</div>Sem horários livres neste dia. Escolha outra data.</div>`;
    }
    return `<div class="slots-grid">${starts.map((m) =>
      `<button class="slot ${state.startMin === m ? 'selected' : ''}" data-slot="${m}">${Utils.minutesToHHMM(m)}</button>`
    ).join('')}</div>`;
  }

  // ---- Etapa 4: dados do cliente -------------------------------------------
  function stepCustomer() {
    const c = state.customer;
    return `
      <div class="field" id="f-name">
        <label>Nome completo <span class="req">*</span></label>
        <input type="text" id="in-name" value="${Utils.escapeHtml(c.name)}" placeholder="Como podemos te chamar?" autocomplete="name"/>
        <div class="err">Informe seu nome.</div>
      </div>
      <div class="field" id="f-phone">
        <label>Telefone / WhatsApp <span class="req">*</span></label>
        <input type="tel" id="in-phone" value="${Utils.escapeHtml(c.phone)}" placeholder="(21) 99999-9999" inputmode="tel"/>
        <div class="err">Telefone inválido. Use DDD + número.</div>
      </div>
      <div class="field" id="f-email">
        <label>E-mail <span style="color:var(--faint)">(opcional)</span></label>
        <input type="email" id="in-email" value="${Utils.escapeHtml(c.email)}" placeholder="voce@email.com" autocomplete="email"/>
        <div class="err">E-mail inválido.</div>
      </div>
      <div class="field">
        <label>Observações <span style="color:var(--faint)">(opcional)</span></label>
        <textarea id="in-notes" rows="2" placeholder="Alguma preferência? Ex.: máquina 2, chegar mais cedo...">${Utils.escapeHtml(c.notes)}</textarea>
      </div>
      <div class="modal-nav">
        <button class="btn btn-ghost" data-prev>Voltar</button>
        <button class="btn btn-primary" data-next>Revisar</button>
      </div>`;
  }

  // ---- Etapa 5: resumo -----------------------------------------------------
  function stepSummary() {
    const svc = DB.get('services', state.serviceId);
    const barberId = resolveBarber();
    const barber = DB.get('barbers', barberId);
    state.assignedBarberId = barberId;
    return `
      <div class="summary-box">
        <div class="summary-row"><span class="k">Serviço</span><span class="v">${Utils.escapeHtml(svc.name)}</span></div>
        <div class="summary-row"><span class="k">Profissional</span><span class="v">${Utils.escapeHtml(barber ? barber.name : '—')}</span></div>
        <div class="summary-row"><span class="k">Data</span><span class="v">${Utils.longDate(state.date)}</span></div>
        <div class="summary-row"><span class="k">Horário</span><span class="v">${Utils.minutesToHHMM(state.startMin)} — ${Utils.minutesToHHMM(state.startMin + svc.durationMin)}</span></div>
        <div class="summary-row"><span class="k">Duração</span><span class="v">${Utils.durationLabel(svc.durationMin)}</span></div>
        <div class="summary-row"><span class="k">Cliente</span><span class="v">${Utils.escapeHtml(state.customer.name)}</span></div>
        <div class="summary-total"><span class="k">Total</span><span class="v">${Utils.brl(svc.priceCents)}</span></div>
      </div>
      <p style="color:var(--muted);font-size:.85rem;margin-top:14px">O pagamento é feito na barbearia. Você receberá a confirmação e poderá cancelar até ${cfg.scheduling.cancelDeadlineHours}h antes.</p>
      <div class="modal-nav">
        <button class="btn btn-ghost" data-prev>Voltar</button>
        <button class="btn btn-primary" data-confirm>Confirmar agendamento</button>
      </div>`;
  }

  // Para "qualquer profissional", escolhe um barbeiro livre no horário.
  function resolveBarber() {
    if (state.barberId !== 'any') return state.barberId;
    const svc = DB.get('services', state.serviceId);
    const opts = Scheduling.anyBarberStarts(state.date, svc.durationMin)
      .find((x) => x.startMin === state.startMin);
    return opts ? opts.barberIds[0] : null;
  }

  // ---- Sucesso -------------------------------------------------------------
  function renderSuccess(body) {
    const a = state.result;
    const svc = DB.get('services', a.serviceId);
    const barber = DB.get('barbers', a.barberId);
    body.innerHTML = `
      <div class="success-box">
        <div class="success-check">✓</div>
        <h3>Agendamento confirmado!</h3>
        <p style="color:var(--muted)">${Utils.escapeHtml(a.customerName)}, seu horário está reservado.</p>
        <div class="code-pill">${a.code}</div>
        <div class="summary-box" style="text-align:left;margin-top:6px">
          <div class="summary-row"><span class="k">Serviço</span><span class="v">${Utils.escapeHtml(svc.name)}</span></div>
          <div class="summary-row"><span class="k">Profissional</span><span class="v">${Utils.escapeHtml(barber.name)}</span></div>
          <div class="summary-row"><span class="k">Quando</span><span class="v">${Utils.prettyDate(a.date)} · ${Utils.minutesToHHMM(a.startMin)}</span></div>
        </div>
        <div class="success-actions">
          <button class="btn btn-primary" data-ics>📅 Adicionar ao calendário</button>
          <a class="btn btn-whatsapp" href="${Notify.whatsappForAppointment(a)}" target="_blank" rel="noopener">Confirmar no WhatsApp</a>
        </div>
        <div style="margin-top:16px"><button class="btn btn-ghost btn-sm" data-close>Fechar</button></div>
      </div>`;
    $('[data-ics]', body).addEventListener('click', () => CalendarICS.download(a));
    $('[data-close]', body).addEventListener('click', closeBooking);
  }

  // ---- Confirmação (validação de "servidor") -------------------------------
  function confirmBooking() {
    const svc = DB.get('services', state.serviceId);
    const barberId = resolveBarber();
    if (!barberId) { toast('Esse horário não está mais livre. Escolha outro.', 'error'); state.step = 3; state.startMin = null; renderStep(); return; }

    // Revalida no ato — fecha a corrida entre dois clientes (regra de servidor).
    try {
      Scheduling.assertBookable({
        barberId, isoDate: state.date, startMin: state.startMin, durationMin: svc.durationMin,
      });
    } catch (e) {
      toast(e.message, 'error');
      state.step = 3; state.startMin = null; renderStep();
      return;
    }

    // Cliente: reaproveita se telefone já existe, senão cria.
    const phone = state.customer.phone;
    let customer = DB.getAll('customers').find((c) => Utils.onlyDigits(c.phone) === Utils.onlyDigits(phone));
    if (!customer) {
      customer = DB.insert('customers', {
        shopId: 'shop_navalha', name: state.customer.name, phone,
        email: state.customer.email, notes: state.customer.notes,
      });
    }

    const appt = DB.insert('appointments', {
      shopId: 'shop_navalha',
      code: Utils.bookingNumber(),
      serviceId: svc.id, barberId, customerId: customer.id,
      customerName: state.customer.name, customerPhone: phone, customerEmail: state.customer.email,
      date: state.date, startMin: state.startMin, durationMin: svc.durationMin,
      priceCents: svc.priceCents, status: 'solicitado', notes: state.customer.notes,
      source: 'site',
    });

    // Dispara notificação de confirmação (MODO DEMONSTRAÇÃO por padrão).
    Notify.dispatch('confirmacao', appt, 'whatsapp');

    state.result = appt;
    renderModal();
  }

  // ---- Wiring dos eventos de cada etapa ------------------------------------
  function wireStep() {
    const body = $('#modalBody');

    $$('[data-service]', body).forEach((el) => el.addEventListener('click', () => {
      state.serviceId = el.dataset.service;
      state.startMin = null;
      renderStep();
    }));

    $$('[data-barber]', body).forEach((el) => el.addEventListener('click', () => {
      state.barberId = el.dataset.barber;
      state.date = null; state.startMin = null;
      renderStep();
    }));

    $$('[data-date]', body).forEach((el) => el.addEventListener('click', () => {
      state.date = el.dataset.date;
      state.startMin = null;
      $('#slotsArea').innerHTML = slotsHTML();
      wireSlots();
      $$('[data-date]', body).forEach((c) => c.classList.toggle('selected', c.dataset.date === state.date));
      const next = $('[data-next]', body); if (next) next.disabled = true;
    }));
    wireSlots();

    const prev = $('[data-prev]', body);
    if (prev) prev.addEventListener('click', () => { state.step = Math.max(1, state.step - 1); renderStep(); });

    const next = $('[data-next]', body);
    if (next) next.addEventListener('click', onNext);

    const confirm = $('[data-confirm]', body);
    if (confirm) confirm.addEventListener('click', confirmBooking);
  }

  function wireSlots() {
    $$('[data-slot]', $('#modalBody')).forEach((el) => el.addEventListener('click', () => {
      state.startMin = Number(el.dataset.slot);
      $$('[data-slot]').forEach((s) => s.classList.toggle('selected', Number(s.dataset.slot) === state.startMin));
      const next = $('[data-next]', $('#modalBody')); if (next) next.disabled = false;
    }));
  }

  function onNext() {
    // Validações por etapa
    if (state.step === 4 && !validateCustomer()) return;
    if (state.step < 5) { state.step += 1; renderStep(); }
  }

  function validateCustomer() {
    const body = $('#modalBody');
    const name = $('#in-name', body).value.trim();
    const phone = $('#in-phone', body).value.trim();
    const email = $('#in-email', body).value.trim();
    const notes = $('#in-notes', body).value.trim();
    let ok = true;

    const setInvalid = (id, bad) => { $(id, body).classList.toggle('invalid', bad); if (bad) ok = false; };
    setInvalid('#f-name', name.length < 2);
    setInvalid('#f-phone', !Utils.isValidPhone(phone));
    setInvalid('#f-email', !Utils.isValidEmail(email)); // vazio é válido

    state.customer = { name, phone, email, notes };
    if (!ok) toast('Confira os campos destacados.', 'error');
    return ok;
  }

  // Máscara de telefone ao digitar (delegação)
  document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'in-phone') {
      const pos = e.target.value;
      e.target.value = Utils.maskPhone(pos);
    }
  });

  // Fechar modal (backdrop, botão, ESC)
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-booking]')) { openBooking(null); }
    else if (e.target.closest('[data-book-service]')) { openBooking(e.target.closest('[data-book-service]').dataset.bookService); }
    else if (e.target.matches('[data-close]')) { closeBooking(); }
    else if (e.target.matches('[data-backdrop]')) { closeBooking(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBooking(); });

  // =========================================================================
  // INIT
  // =========================================================================
  function init() {
    renderBrand();
    renderServices();
    renderBarbers();
    renderReviews();
    renderHours();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
