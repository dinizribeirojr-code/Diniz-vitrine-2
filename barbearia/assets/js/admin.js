/* =============================================================================
 * admin.js — Painel administrativo (admin e barbeiro)
 * -----------------------------------------------------------------------------
 * Protegido por Auth. O papel (role) define o que aparece:
 *   admin  → tudo; barbeiro → apenas a própria agenda, confirmar/concluir e
 *            bloquear horários.
 * ========================================================================== */

(() => {
  const cfg = window.APP_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = () => $('#app');

  const STATUSES = ['solicitado', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu'];
  const STATUS_LABEL = {
    solicitado: 'Solicitado', confirmado: 'Confirmado', concluido: 'Concluído',
    cancelado: 'Cancelado', nao_compareceu: 'Não compareceu',
  };

  let session = null;
  let view = 'dashboard';
  let agendaMode = 'day';           // day | week | month
  let filters = { barberId: 'all', status: 'all' };
  let cursorDate = Utils.todayISO(); // referência para day/week/month

  // ---- Toast ---------------------------------------------------------------
  function toast(msg, kind = '') {
    const wrap = $('#toastWrap');
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  // ---- Escopo do barbeiro: só enxerga os próprios agendamentos -------------
  const scopedAppointments = () => {
    let list = DB.getAll('appointments');
    if (session.role === 'barber') list = list.filter((a) => a.barberId === session.barberId);
    return list;
  };

  // =========================================================================
  // LOGIN
  // =========================================================================
  function renderLogin(err) {
    app().innerHTML = `
      <div class="login-wrap">
        <form class="login-card" id="loginForm">
          <div class="brand">
            <span class="brand-logo">${cfg.brand.logoText}</span>
          </div>
          <h1>${Utils.escapeHtml(cfg.brand.name)}</h1>
          <p class="sub">Painel administrativo</p>
          <div class="field">
            <label>Usuário</label>
            <input type="text" id="lg-user" autocomplete="username" placeholder="admin" />
          </div>
          <div class="field">
            <label>Senha</label>
            <input type="password" id="lg-pass" autocomplete="current-password" placeholder="••••••••" />
          </div>
          ${err ? `<div class="toast error" style="position:static;margin-bottom:12px">${err}</div>` : ''}
          <button class="btn btn-primary btn-block" type="submit">Entrar</button>
          <div class="login-hint">
            <b>Acesso de demonstração</b><br/>
            Administrador — usuário <b>admin</b>, senha <b>admin123</b><br/>
            Barbeiro — usuário <b>caio</b> / <b>theo</b> / <b>igor</b>, senha <b>barbeiro123</b>
          </div>
          <div style="text-align:center;margin-top:16px"><a class="navlink" href="index.html" style="color:var(--muted);font-size:.85rem">← Voltar ao site</a></div>
        </form>
      </div>`;
    $('#loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const sess = Auth.login($('#lg-user').value, $('#lg-pass').value);
      if (!sess) return renderLogin('Usuário ou senha inválidos.');
      session = sess;
      boot();
    });
  }

  // =========================================================================
  // SHELL DO PAINEL
  // =========================================================================
  function navItems() {
    const base = [
      ['dashboard', '📊', 'Painel'],
      ['agenda', '📅', 'Agenda'],
    ];
    if (session.role === 'admin') {
      base.push(['servicos', '✂️', 'Serviços']);
      base.push(['barbeiros', '💈', 'Barbeiros']);
      base.push(['clientes', '👤', 'Clientes']);
      base.push(['bloqueios', '🚫', 'Bloqueios']);
      base.push(['config', '⚙️', 'Configurações']);
    } else {
      base.push(['bloqueios', '🚫', 'Meus bloqueios']);
    }
    return base;
  }

  function renderShell() {
    app().innerHTML = `
      <div class="admin-shell">
        <aside class="admin-sidebar">
          <a class="brand" href="index.html">
            <span class="brand-logo">${cfg.brand.logoText}</span>
            <span><span class="brand-name" style="font-size:1.1rem">${Utils.escapeHtml(cfg.brand.name)}</span></span>
          </a>
          <nav class="admin-nav" id="adminNav">
            ${navItems().map(([id, ico, label]) =>
              `<button data-view="${id}" class="${view === id ? 'active' : ''}"><span class="ico">${ico}</span><span class="txt">${label}</span></button>`
            ).join('')}
          </nav>
          <div class="sidebar-user">
            <b>${Utils.escapeHtml(session.name)}</b>
            ${session.role === 'admin' ? 'Administrador' : 'Barbeiro'}
            <div style="margin-top:12px"><button class="btn btn-ghost btn-sm btn-block" id="logoutBtn">Sair</button></div>
          </div>
        </aside>
        <main class="admin-main" id="adminMain"></main>
      </div>`;
    $$('#adminNav button').forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; renderShell(); }));
    $('#logoutBtn').addEventListener('click', () => { Auth.logout(); session = null; renderLogin(); });
    renderView();
  }

  function renderView() {
    const main = $('#adminMain');
    if (view === 'dashboard') return renderDashboard(main);
    if (view === 'agenda') return renderAgenda(main);
    if (view === 'servicos') return renderServices(main);
    if (view === 'barbeiros') return renderBarbers(main);
    if (view === 'clientes') return renderCustomers(main);
    if (view === 'bloqueios') return renderBlocks(main);
    if (view === 'config') return renderConfig(main);
  }

  // =========================================================================
  // DASHBOARD
  // =========================================================================
  function renderDashboard(main) {
    const today = Utils.todayISO();
    const all = scopedAppointments();
    const todays = all.filter((a) => a.date === today);
    const active = (a) => a.status !== 'cancelado' && a.status !== 'nao_compareceu';

    const totalToday = todays.filter(active).length;
    const doneToday = todays.filter((a) => a.status === 'concluido').length;
    const revenue = todays.filter((a) => a.status !== 'cancelado' && a.status !== 'nao_compareceu')
      .reduce((s, a) => s + a.priceCents, 0);
    const canceledToday = todays.filter((a) => a.status === 'cancelado').length;

    main.innerHTML = `
      <div class="admin-topbar">
        <div><h1>Painel</h1><p style="color:var(--muted)">${Utils.longDate(today)}</p></div>
        <div class="actions">
          ${session.role === 'admin' ? '<button class="btn btn-primary btn-sm" id="newApptBtn">+ Novo agendamento</button>' : ''}
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><div class="label">Agendamentos hoje</div><div class="value">${totalToday}</div><div class="sub">ativos na agenda</div></div>
        <div class="stat-card"><div class="label">Atendimentos concluídos</div><div class="value">${doneToday}</div><div class="sub">hoje</div></div>
        <div class="stat-card"><div class="label">Faturamento estimado</div><div class="value gold">${Utils.brl(revenue)}</div><div class="sub">hoje, exceto cancelados</div></div>
        <div class="stat-card"><div class="label">Cancelamentos</div><div class="value">${canceledToday}</div><div class="sub">hoje</div></div>
      </div>
      <h2 style="font-family:var(--font-head);font-size:1.5rem;margin:10px 0 14px">Agenda de hoje</h2>
      ${apptTable(todays.sort((a, b) => a.startMin - b.startMin))}`;

    const nb = $('#newApptBtn'); if (nb) nb.addEventListener('click', () => openApptForm());
    wireApptTable(main);
  }

  // =========================================================================
  // AGENDA (dia / semana / mês) + filtros
  // =========================================================================
  function renderAgenda(main) {
    const barbers = DB.getAll('barbers');
    main.innerHTML = `
      <div class="admin-topbar">
        <h1>Agenda</h1>
        <div class="actions">
          <div class="view-toggle">
            <button data-mode="day" class="${agendaMode === 'day' ? 'active' : ''}">Dia</button>
            <button data-mode="week" class="${agendaMode === 'week' ? 'active' : ''}">Semana</button>
            <button data-mode="month" class="${agendaMode === 'month' ? 'active' : ''}">Mês</button>
          </div>
          <button class="btn btn-ghost btn-sm" id="exportCsv">⬇ Exportar CSV</button>
          ${session.role === 'admin' ? '<button class="btn btn-primary btn-sm" id="newApptBtn">+ Novo</button>' : ''}
        </div>
      </div>
      <div class="filters">
        <button class="btn btn-ghost btn-sm" id="prevPeriod">‹</button>
        <button class="btn btn-ghost btn-sm" id="todayBtn">Hoje</button>
        <button class="btn btn-ghost btn-sm" id="nextPeriod">›</button>
        <strong id="periodLabel" style="margin:0 8px"></strong>
        ${session.role === 'admin' ? `
        <select id="fltBarber">
          <option value="all">Todos os barbeiros</option>
          ${barbers.map((b) => `<option value="${b.id}" ${filters.barberId === b.id ? 'selected' : ''}>${Utils.escapeHtml(b.name)}</option>`).join('')}
        </select>` : ''}
        <select id="fltStatus">
          <option value="all">Todos os status</option>
          ${STATUSES.map((s) => `<option value="${s}" ${filters.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}
        </select>
      </div>
      <div id="agendaBody"></div>`;

    $$('[data-mode]').forEach((b) => b.addEventListener('click', () => { agendaMode = b.dataset.mode; renderAgenda(main); }));
    const fb = $('#fltBarber'); if (fb) fb.addEventListener('change', () => { filters.barberId = fb.value; renderAgendaBody(); });
    $('#fltStatus').addEventListener('change', () => { filters.status = $('#fltStatus').value; renderAgendaBody(); });
    $('#todayBtn').addEventListener('click', () => { cursorDate = Utils.todayISO(); renderAgendaBody(); });
    $('#prevPeriod').addEventListener('click', () => { shiftCursor(-1); renderAgendaBody(); });
    $('#nextPeriod').addEventListener('click', () => { shiftCursor(1); renderAgendaBody(); });
    $('#exportCsv').addEventListener('click', exportCSV);
    const nb = $('#newApptBtn'); if (nb) nb.addEventListener('click', () => openApptForm());
    renderAgendaBody();
  }

  function shiftCursor(dir) {
    const d = Utils.parseISODate(cursorDate);
    if (agendaMode === 'day') d.setDate(d.getDate() + dir);
    else if (agendaMode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    cursorDate = Utils.toISODate(d);
  }

  function applyFilters(list) {
    return list.filter((a) => {
      if (session.role === 'admin' && filters.barberId !== 'all' && a.barberId !== filters.barberId) return false;
      if (filters.status !== 'all' && a.status !== filters.status) return false;
      return true;
    });
  }

  function renderAgendaBody() {
    const body = $('#agendaBody');
    const label = $('#periodLabel');
    const list = applyFilters(scopedAppointments());

    if (agendaMode === 'day') {
      label.textContent = Utils.longDate(cursorDate);
      const day = list.filter((a) => a.date === cursorDate).sort((a, b) => a.startMin - b.startMin);
      body.innerHTML = apptTable(day);
      wireApptTable(body);
    } else if (agendaMode === 'week') {
      renderWeek(body, label, list);
    } else {
      renderMonth(body, label, list);
    }
  }

  function weekStart(iso) {
    const d = Utils.parseISODate(iso);
    d.setDate(d.getDate() - d.getDay()); // domingo
    return d;
  }

  function renderWeek(body, label, list) {
    const start = weekStart(cursorDate);
    const days = [...Array(7)].map((_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    label.textContent = `${Utils.brDate(Utils.toISODate(days[0]))} – ${Utils.brDate(Utils.toISODate(days[6]))}`;

    // faixa de horas exibidas
    const startH = 8, endH = 20;
    const today = Utils.todayISO();
    let html = '<div class="table-wrap"><div class="week-grid">';
    html += '<div class="week-time"></div>';
    days.forEach((d) => {
      const iso = Utils.toISODate(d);
      html += `<div class="week-head ${iso === today ? 'today' : ''}"><div>${Utils.WEEKDAYS_SHORT[d.getDay()]}</div><div class="d">${d.getDate()}</div></div>`;
    });
    for (let h = startH; h < endH; h++) {
      html += `<div class="week-time">${String(h).padStart(2, '0')}h</div>`;
      days.forEach((d) => {
        const iso = Utils.toISODate(d);
        const appts = list.filter((a) => a.date === iso && a.startMin >= h * 60 && a.startMin < (h + 1) * 60)
          .sort((a, b) => a.startMin - b.startMin);
        html += `<div class="week-cell">${appts.map((a) => {
          const barber = DB.get('barbers', a.barberId);
          return `<div class="week-appt ${a.status}" data-appt="${a.id}" title="${Utils.escapeHtml(a.customerName)}">${Utils.minutesToHHMM(a.startMin)} ${Utils.escapeHtml(a.customerName.split(' ')[0])}${session.role === 'admin' && barber ? ' · ' + barber.name.split(' ')[0] : ''}</div>`;
        }).join('')}</div>`;
      });
    }
    html += '</div></div>';
    body.innerHTML = html;
    $$('[data-appt]', body).forEach((el) => el.addEventListener('click', () => openApptDetail(el.dataset.appt)));
  }

  function renderMonth(body, label, list) {
    const ref = Utils.parseISODate(cursorDate);
    const year = ref.getFullYear(), month = ref.getMonth();
    label.textContent = `${Utils.MONTHS[month]} de ${year}`;
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = Utils.todayISO();

    let cells = '';
    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach((d) => cells += `<div class="month-dow">${d}</div>`);
    for (let i = 0; i < startPad; i++) cells += `<div class="month-day other"></div>`;
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAppts = list.filter((a) => a.date === iso && a.status !== 'cancelado');
      cells += `<div class="month-day ${iso === today ? 'today' : ''}" data-day="${iso}" style="cursor:pointer">
        <div class="n">${day}</div>
        ${dayAppts.length ? `<div class="count"><span class="dot"></span>${dayAppts.length} agend.</div>` : ''}
      </div>`;
    }
    body.innerHTML = `<div class="month-grid">${cells}</div>`;
    $$('[data-day]', body).forEach((el) => el.addEventListener('click', () => {
      cursorDate = el.dataset.day; agendaMode = 'day'; renderAgenda($('#adminMain'));
    }));
  }

  // ---- Tabela de agendamentos ----------------------------------------------
  function apptTable(list) {
    if (!list.length) {
      return `<div class="state"><div class="ico">🗓️</div>Nenhum agendamento neste período.</div>`;
    }
    return `<div class="table-wrap"><table class="data">
      <thead><tr>
        <th>Horário</th><th>Cliente</th><th>Serviço</th>${session.role === 'admin' ? '<th>Barbeiro</th>' : ''}<th>Valor</th><th>Status</th><th>Ações</th>
      </tr></thead>
      <tbody>
      ${list.map((a) => {
        const svc = DB.get('services', a.serviceId);
        const barber = DB.get('barbers', a.barberId);
        return `<tr data-row="${a.id}">
          <td><b>${Utils.minutesToHHMM(a.startMin)}</b><div style="color:var(--faint);font-size:.78rem">${Utils.brDate(a.date)}</div></td>
          <td>${Utils.escapeHtml(a.customerName)}<div style="color:var(--faint);font-size:.78rem">${Utils.escapeHtml(a.customerPhone)}</div></td>
          <td>${svc ? Utils.escapeHtml(svc.name) : '—'}</td>
          ${session.role === 'admin' ? `<td>${barber ? Utils.escapeHtml(barber.name) : '—'}</td>` : ''}
          <td>${Utils.brl(a.priceCents)}</td>
          <td><span class="badge ${a.status}">${STATUS_LABEL[a.status]}</span></td>
          <td><div class="row-actions">
            <button class="icon-btn" data-detail="${a.id}">Abrir</button>
          </div></td>
        </tr>`;
      }).join('')}
      </tbody></table></div>`;
  }

  function wireApptTable(root) {
    $$('[data-detail]', root).forEach((el) => el.addEventListener('click', () => openApptDetail(el.dataset.detail)));
  }

  // =========================================================================
  // DRAWER: detalhe / mudança de status / remarcar / cancelar
  // =========================================================================
  function drawer(html) {
    $('#drawerRoot').innerHTML = `
      <div class="drawer-backdrop" data-drawer-close>
        <div class="drawer" onclick="event.stopPropagation()">${html}</div>
      </div>`;
    $$('[data-drawer-close]').forEach((el) => el.addEventListener('click', (e) => { if (e.target === el) closeDrawer(); }));
  }
  function closeDrawer() { $('#drawerRoot').innerHTML = ''; }

  function openApptDetail(id) {
    const a = DB.get('appointments', id);
    if (!a) return;
    const svc = DB.get('services', a.serviceId);
    const barber = DB.get('barbers', a.barberId);

    drawer(`
      <div class="drawer-header">
        <h3 style="font-family:var(--font-head);font-size:1.4rem">Agendamento</h3>
        <button class="modal-close" data-x>✕</button>
      </div>
      <div class="drawer-body">
        <div class="code-pill" style="margin-top:0">${a.code}</div>
        <div class="summary-box" style="margin:14px 0">
          <div class="summary-row"><span class="k">Cliente</span><span class="v">${Utils.escapeHtml(a.customerName)}</span></div>
          <div class="summary-row"><span class="k">Telefone</span><span class="v">${Utils.escapeHtml(a.customerPhone)}</span></div>
          ${a.customerEmail ? `<div class="summary-row"><span class="k">E-mail</span><span class="v">${Utils.escapeHtml(a.customerEmail)}</span></div>` : ''}
          <div class="summary-row"><span class="k">Serviço</span><span class="v">${svc ? Utils.escapeHtml(svc.name) : '—'}</span></div>
          <div class="summary-row"><span class="k">Barbeiro</span><span class="v">${barber ? Utils.escapeHtml(barber.name) : '—'}</span></div>
          <div class="summary-row"><span class="k">Quando</span><span class="v">${Utils.brDate(a.date)} · ${Utils.minutesToHHMM(a.startMin)}–${Utils.minutesToHHMM(a.startMin + a.durationMin)}</span></div>
          ${a.notes ? `<div class="summary-row"><span class="k">Obs.</span><span class="v">${Utils.escapeHtml(a.notes)}</span></div>` : ''}
          <div class="summary-total"><span class="k">Valor</span><span class="v">${Utils.brl(a.priceCents)}</span></div>
        </div>

        <label style="font-size:.85rem;color:var(--muted)">Status</label>
        <div class="status-picker" id="statusPicker">
          ${STATUSES.map((s) => `<button class="badge ${s} ${a.status === s ? 'active' : ''}" data-status="${s}">${STATUS_LABEL[s]}</button>`).join('')}
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px">
          <a class="btn btn-whatsapp btn-sm" href="${Notify.whatsappLink(a.customerPhone, Notify.templates.confirmacao(Notify.enrich(a)))}" target="_blank" rel="noopener">Enviar WhatsApp</a>
          <button class="btn btn-ghost btn-sm" data-reschedule>Remarcar</button>
          <button class="btn btn-ghost btn-sm" data-ics>Baixar .ics</button>
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-ghost btn-sm" style="color:var(--st-cancelado);border-color:var(--st-cancelado)" data-cancel>Cancelar agendamento</button>
        </div>
      </div>`);

    $('[data-x]').addEventListener('click', closeDrawer);
    $$('#statusPicker [data-status]').forEach((b) => b.addEventListener('click', () => changeStatus(a.id, b.dataset.status)));
    $('[data-reschedule]').addEventListener('click', () => openApptForm(a));
    $('[data-ics]').addEventListener('click', () => CalendarICS.download(a));
    $('[data-cancel]').addEventListener('click', () => {
      if (confirm('Cancelar este agendamento? O horário ficará livre novamente.')) {
        DB.update('appointments', a.id, { status: 'cancelado' });
        Notify.dispatch('cancelamento', DB.get('appointments', a.id), 'whatsapp');
        toast('Agendamento cancelado.', 'success');
        closeDrawer(); renderView();
      }
    });
  }

  function changeStatus(id, status) {
    DB.update('appointments', id, { status });
    const a = DB.get('appointments', id);
    if (status === 'confirmado') Notify.dispatch('confirmacao', a, 'whatsapp');
    if (status === 'concluido') Notify.dispatch('conclusao', a, 'whatsapp');
    if (status === 'cancelado') Notify.dispatch('cancelamento', a, 'whatsapp');
    toast(`Status: ${STATUS_LABEL[status]}.`, 'success');
    closeDrawer(); renderView();
  }

  // =========================================================================
  // FORMULÁRIO: criar / remarcar agendamento (drawer)
  // =========================================================================
  function openApptForm(existing) {
    const isEdit = !!existing;
    const services = DB.query('services', (s) => s.active);
    const barbers = DB.query('barbers', (b) => b.active);
    const st = {
      serviceId: existing ? existing.serviceId : services[0].id,
      barberId: existing ? existing.barberId : (session.role === 'barber' ? session.barberId : barbers[0].id),
      date: existing ? existing.date : Utils.todayISO(),
      startMin: existing ? existing.startMin : null,
      name: existing ? existing.customerName : '',
      phone: existing ? existing.customerPhone : '',
      email: existing ? existing.customerEmail : '',
      notes: existing ? existing.notes : '',
    };

    const paint = () => {
      drawer(`
        <div class="drawer-header">
          <h3 style="font-family:var(--font-head);font-size:1.4rem">${isEdit ? 'Remarcar' : 'Novo agendamento'}</h3>
          <button class="modal-close" data-x>✕</button>
        </div>
        <div class="drawer-body">
          <div class="field"><label>Serviço</label>
            <select id="fServ">${services.map((s) => `<option value="${s.id}" ${st.serviceId === s.id ? 'selected' : ''}>${Utils.escapeHtml(s.name)} — ${Utils.durationLabel(s.durationMin)} — ${Utils.brl(s.priceCents)}</option>`).join('')}</select>
          </div>
          <div class="field"><label>Barbeiro</label>
            <select id="fBarb" ${session.role === 'barber' ? 'disabled' : ''}>${barbers.map((b) => `<option value="${b.id}" ${st.barberId === b.id ? 'selected' : ''}>${Utils.escapeHtml(b.name)}</option>`).join('')}</select>
          </div>
          <div class="field"><label>Data</label>
            <input type="date" id="fDate" value="${st.date}" min="${Utils.todayISO()}"/>
          </div>
          <div class="field"><label>Horário disponível</label>
            <div id="slotArea"></div>
          </div>
          ${isEdit ? '' : `
          <div class="field"><label>Nome do cliente <span class="req">*</span></label><input id="fName" value="${Utils.escapeHtml(st.name)}"/></div>
          <div class="field"><label>Telefone <span class="req">*</span></label><input id="fPhone" value="${Utils.escapeHtml(st.phone)}" placeholder="(21) 99999-9999"/></div>
          <div class="field"><label>E-mail (opcional)</label><input id="fEmail" value="${Utils.escapeHtml(st.email)}"/></div>
          <div class="field"><label>Observações</label><textarea id="fNotes" rows="2">${Utils.escapeHtml(st.notes)}</textarea></div>`}
          <button class="btn btn-primary btn-block" data-save>${isEdit ? 'Confirmar remarcação' : 'Criar agendamento'}</button>
        </div>`);

      $('[data-x]').addEventListener('click', closeDrawer);
      const svcSel = $('#fServ'), barbSel = $('#fBarb'), dateInp = $('#fDate');
      const refreshSlots = () => {
        st.serviceId = svcSel.value; st.barberId = barbSel.value; st.date = dateInp.value;
        st.startMin = null;
        const svc = DB.get('services', st.serviceId);
        let starts = Scheduling.availableStarts(st.barberId, st.date, svc.durationMin);
        // ao remarcar, o próprio horário atual continua válido
        if (isEdit && existing.barberId === st.barberId && existing.date === st.date && !starts.includes(existing.startMin)) {
          starts = [existing.startMin, ...starts].sort((a, b) => a - b);
        }
        $('#slotArea').innerHTML = starts.length
          ? `<div class="slots-grid">${starts.map((m) => `<button class="slot" data-slot="${m}">${Utils.minutesToHHMM(m)}</button>`).join('')}</div>`
          : `<div class="state" style="padding:14px"><div class="ico">⌛</div>Sem horários livres. Troque data ou barbeiro.</div>`;
        $$('#slotArea [data-slot]').forEach((b) => b.addEventListener('click', () => {
          st.startMin = Number(b.dataset.slot);
          $$('#slotArea [data-slot]').forEach((x) => x.classList.toggle('selected', Number(x.dataset.slot) === st.startMin));
        }));
      };
      svcSel.addEventListener('change', refreshSlots);
      barbSel.addEventListener('change', refreshSlots);
      dateInp.addEventListener('change', refreshSlots);
      refreshSlots();

      $('[data-save]').addEventListener('click', () => saveAppt(st, existing));
    };
    paint();
  }

  function saveAppt(st, existing) {
    const svc = DB.get('services', st.serviceId);
    if (st.startMin == null) return toast('Escolha um horário.', 'error');

    // Validação de conflito (regra de servidor)
    try {
      // Ao remarcar, ignore o próprio registro liberando seu horário atual:
      if (existing) DB.update('appointments', existing.id, { status: '__temp_hold__' });
      Scheduling.assertBookable({ barberId: st.barberId, isoDate: st.date, startMin: st.startMin, durationMin: svc.durationMin });
    } catch (e) {
      if (existing) DB.update('appointments', existing.id, { status: existing.status });
      return toast(e.message, 'error');
    }

    if (existing) {
      DB.update('appointments', existing.id, {
        serviceId: st.serviceId, barberId: st.barberId, date: st.date,
        startMin: st.startMin, durationMin: svc.durationMin, priceCents: svc.priceCents,
        status: existing.status === '__temp_hold__' ? 'confirmado' : existing.status,
      });
      Notify.dispatch('confirmacao', DB.get('appointments', existing.id), 'whatsapp');
      toast('Agendamento remarcado.', 'success');
    } else {
      const name = $('#fName').value.trim();
      const phone = $('#fPhone').value.trim();
      if (name.length < 2 || !Utils.isValidPhone(phone)) return toast('Nome e telefone válidos são obrigatórios.', 'error');
      let customer = DB.getAll('customers').find((c) => Utils.onlyDigits(c.phone) === Utils.onlyDigits(phone));
      if (!customer) customer = DB.insert('customers', { shopId: 'shop_navalha', name, phone, email: $('#fEmail').value.trim(), notes: '' });
      const appt = DB.insert('appointments', {
        shopId: 'shop_navalha', code: Utils.bookingNumber(),
        serviceId: st.serviceId, barberId: st.barberId, customerId: customer.id,
        customerName: name, customerPhone: phone, customerEmail: $('#fEmail').value.trim(),
        date: st.date, startMin: st.startMin, durationMin: svc.durationMin,
        priceCents: svc.priceCents, status: 'confirmado', notes: $('#fNotes').value.trim(), source: 'admin',
      });
      Notify.dispatch('confirmacao', appt, 'whatsapp');
      toast('Agendamento criado.', 'success');
    }
    closeDrawer(); renderView();
  }

  // =========================================================================
  // SERVIÇOS (CRUD)
  // =========================================================================
  function renderServices(main) {
    const services = DB.getAll('services');
    main.innerHTML = `
      <div class="admin-topbar"><h1>Serviços</h1>
        <div class="actions"><button class="btn btn-primary btn-sm" id="newSvc">+ Novo serviço</button></div></div>
      <div class="manage-grid">
        ${services.map((s) => `
          <div class="manage-card">
            <h4>${Utils.escapeHtml(s.name)}</h4>
            <div class="muted">${Utils.durationLabel(s.durationMin)} · ${Utils.brl(s.priceCents)} · ${s.active ? 'Ativo' : 'Inativo'}</div>
            <p class="muted" style="margin-top:8px">${Utils.escapeHtml(s.description)}</p>
            <div class="card-actions">
              <button class="icon-btn" data-edit="${s.id}">Editar</button>
              <button class="icon-btn danger" data-del="${s.id}">Excluir</button>
            </div>
          </div>`).join('')}
      </div>`;
    $('#newSvc').addEventListener('click', () => editService());
    $$('[data-edit]', main).forEach((b) => b.addEventListener('click', () => editService(DB.get('services', b.dataset.edit))));
    $$('[data-del]', main).forEach((b) => b.addEventListener('click', () => {
      if (confirm('Excluir este serviço? Agendamentos existentes não são afetados.')) { DB.remove('services', b.dataset.del); renderView(); }
    }));
  }

  function editService(svc) {
    const s = svc || { name: '', description: '', durationMin: 30, priceReais: '', active: true };
    drawer(`
      <div class="drawer-header"><h3 style="font-family:var(--font-head);font-size:1.4rem">${svc ? 'Editar' : 'Novo'} serviço</h3><button class="modal-close" data-x>✕</button></div>
      <div class="drawer-body">
        <div class="field"><label>Nome <span class="req">*</span></label><input id="sName" value="${Utils.escapeHtml(s.name)}"/></div>
        <div class="field"><label>Descrição</label><textarea id="sDesc" rows="2">${Utils.escapeHtml(s.description)}</textarea></div>
        <div class="field"><label>Duração (minutos) <span class="req">*</span></label><input id="sDur" type="number" min="5" step="5" value="${s.durationMin}"/></div>
        <div class="field"><label>Preço (R$) <span class="req">*</span></label><input id="sPrice" type="number" min="0" step="0.01" value="${svc ? (svc.priceCents / 100).toFixed(2) : ''}"/></div>
        <div class="field"><label><input type="checkbox" id="sActive" ${s.active ? 'checked' : ''}/> Serviço ativo (aparece no site)</label></div>
        <button class="btn btn-primary btn-block" data-save>Salvar</button>
      </div>`);
    $('[data-x]').addEventListener('click', closeDrawer);
    $('[data-save]').addEventListener('click', () => {
      const name = $('#sName').value.trim();
      const dur = parseInt($('#sDur').value, 10);
      const price = Math.round(parseFloat($('#sPrice').value) * 100);
      if (!name || !dur || isNaN(price)) return toast('Preencha nome, duração e preço.', 'error');
      const data = { name, description: $('#sDesc').value.trim(), durationMin: dur, priceCents: price, active: $('#sActive').checked, shopId: 'shop_navalha' };
      if (svc) DB.update('services', svc.id, data); else DB.insert('services', data);
      toast('Serviço salvo.', 'success'); closeDrawer(); renderView();
    });
  }

  // =========================================================================
  // BARBEIROS (CRUD básico)
  // =========================================================================
  function renderBarbers(main) {
    const barbers = DB.getAll('barbers');
    main.innerHTML = `
      <div class="admin-topbar"><h1>Barbeiros</h1>
        <div class="actions"><button class="btn btn-primary btn-sm" id="newBarb">+ Novo barbeiro</button></div></div>
      <div class="manage-grid">
        ${barbers.map((b) => `
          <div class="manage-card">
            <div style="display:flex;gap:12px;align-items:center">
              <span class="opt-avatar" style="width:52px;height:52px"><img src="${b.photo}" alt="" onerror="this.parentNode.textContent='💈'"/></span>
              <div><h4 style="margin:0">${Utils.escapeHtml(b.name)}</h4><div class="muted">${b.active ? 'Ativo' : 'Inativo'}</div></div>
            </div>
            <p class="muted" style="margin-top:10px">${b.specialties.map((x) => Utils.escapeHtml(x)).join(' · ')}</p>
            <div class="card-actions">
              <button class="icon-btn" data-edit="${b.id}">Editar</button>
              <button class="icon-btn danger" data-del="${b.id}">Excluir</button>
            </div>
          </div>`).join('')}
      </div>`;
    $('#newBarb').addEventListener('click', () => editBarber());
    $$('[data-edit]', main).forEach((b) => b.addEventListener('click', () => editBarber(DB.get('barbers', b.dataset.edit))));
    $$('[data-del]', main).forEach((b) => b.addEventListener('click', () => {
      if (confirm('Excluir este barbeiro?')) { DB.remove('barbers', b.dataset.del); renderView(); }
    }));
  }

  function editBarber(barber) {
    const b = barber || { name: '', photo: '', specialties: [], bio: '', active: true };
    drawer(`
      <div class="drawer-header"><h3 style="font-family:var(--font-head);font-size:1.4rem">${barber ? 'Editar' : 'Novo'} barbeiro</h3><button class="modal-close" data-x>✕</button></div>
      <div class="drawer-body">
        <div class="field"><label>Nome <span class="req">*</span></label><input id="bName" value="${Utils.escapeHtml(b.name)}"/></div>
        <div class="field"><label>Foto (URL)</label><input id="bPhoto" value="${Utils.escapeHtml(b.photo)}" placeholder="https://..."/></div>
        <div class="field"><label>Especialidades (separadas por vírgula)</label><input id="bSpec" value="${Utils.escapeHtml(b.specialties.join(', '))}"/></div>
        <div class="field"><label>Bio</label><textarea id="bBio" rows="2">${Utils.escapeHtml(b.bio || '')}</textarea></div>
        <div class="field"><label><input type="checkbox" id="bActive" ${b.active ? 'checked' : ''}/> Ativo</label></div>
        <button class="btn btn-primary btn-block" data-save>Salvar</button>
      </div>`);
    $('[data-x]').addEventListener('click', closeDrawer);
    $('[data-save]').addEventListener('click', () => {
      const name = $('#bName').value.trim();
      if (!name) return toast('Informe o nome.', 'error');
      const data = {
        name, photo: $('#bPhoto').value.trim(),
        specialties: $('#bSpec').value.split(',').map((x) => x.trim()).filter(Boolean),
        bio: $('#bBio').value.trim(), active: $('#bActive').checked, shopId: 'shop_navalha',
      };
      if (barber) DB.update('barbers', barber.id, data);
      else DB.insert('barbers', { ...data, userRef: Utils.uid('u') });
      toast('Barbeiro salvo.', 'success'); closeDrawer(); renderView();
    });
  }

  // =========================================================================
  // CLIENTES (lista + histórico)
  // =========================================================================
  function renderCustomers(main) {
    const customers = DB.getAll('customers');
    main.innerHTML = `
      <div class="admin-topbar"><h1>Clientes</h1></div>
      <div class="filters"><input id="custSearch" placeholder="Buscar por nome ou telefone" style="min-width:240px"/></div>
      <div id="custList"></div>`;
    const paint = (term = '') => {
      const t = term.toLowerCase();
      const list = customers.filter((c) => c.name.toLowerCase().includes(t) || Utils.onlyDigits(c.phone).includes(Utils.onlyDigits(term)));
      $('#custList').innerHTML = list.length ? `<div class="table-wrap"><table class="data">
        <thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Agendamentos</th><th></th></tr></thead>
        <tbody>${list.map((c) => {
          const count = DB.query('appointments', (a) => a.customerId === c.id).length;
          return `<tr><td>${Utils.escapeHtml(c.name)}</td><td>${Utils.escapeHtml(c.phone)}</td><td>${Utils.escapeHtml(c.email || '—')}</td><td>${count}</td>
            <td><button class="icon-btn" data-hist="${c.id}">Histórico</button></td></tr>`;
        }).join('')}</tbody></table></div>` : `<div class="state"><div class="ico">👤</div>Nenhum cliente encontrado.</div>`;
      $$('[data-hist]').forEach((b) => b.addEventListener('click', () => customerHistory(b.dataset.hist)));
    };
    paint();
    $('#custSearch').addEventListener('input', (e) => paint(e.target.value));
  }

  function customerHistory(id) {
    const c = DB.get('customers', id);
    const appts = DB.query('appointments', (a) => a.customerId === id).sort((a, b) => (b.date + b.startMin).localeCompare(a.date + a.startMin));
    drawer(`
      <div class="drawer-header"><h3 style="font-family:var(--font-head);font-size:1.4rem">${Utils.escapeHtml(c.name)}</h3><button class="modal-close" data-x>✕</button></div>
      <div class="drawer-body">
        <div class="muted" style="margin-bottom:14px">${Utils.escapeHtml(c.phone)} ${c.email ? '· ' + Utils.escapeHtml(c.email) : ''}</div>
        ${appts.length ? appts.map((a) => {
          const svc = DB.get('services', a.serviceId);
          return `<div class="manage-card" style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <b>${svc ? Utils.escapeHtml(svc.name) : '—'}</b><span class="badge ${a.status}">${STATUS_LABEL[a.status]}</span>
            </div>
            <div class="muted" style="margin-top:6px">${Utils.brDate(a.date)} · ${Utils.minutesToHHMM(a.startMin)} · ${Utils.brl(a.priceCents)}</div>
          </div>`;
        }).join('') : '<div class="state">Sem histórico ainda.</div>'}
      </div>`);
    $('[data-x]').addEventListener('click', closeDrawer);
  }

  // =========================================================================
  // BLOQUEIOS DE HORÁRIO
  // =========================================================================
  function renderBlocks(main) {
    const barbers = DB.getAll('barbers');
    let blocks = DB.getAll('blocked_slots');
    if (session.role === 'barber') blocks = blocks.filter((b) => b.barberId === session.barberId);

    main.innerHTML = `
      <div class="admin-topbar"><h1>Bloqueio de horários</h1>
        <div class="actions"><button class="btn btn-primary btn-sm" id="newBlock">+ Bloquear horário</button></div></div>
      <p style="color:var(--muted);margin-bottom:18px">Use para folgas, pausas estendidas ou compromissos. Horários bloqueados somem da agenda pública.</p>
      ${blocks.length ? `<div class="table-wrap"><table class="data">
        <thead><tr><th>Barbeiro</th><th>Data</th><th>Período</th><th>Motivo</th><th></th></tr></thead>
        <tbody>${blocks.sort((a, b) => a.date.localeCompare(b.date)).map((bl) => {
          const barber = DB.get('barbers', bl.barberId);
          return `<tr><td>${barber ? Utils.escapeHtml(barber.name) : '—'}</td><td>${Utils.brDate(bl.date)}</td>
            <td>${Utils.minutesToHHMM(bl.startMin)}–${Utils.minutesToHHMM(bl.endMin)}</td><td>${Utils.escapeHtml(bl.reason || '')}</td>
            <td><button class="icon-btn danger" data-del="${bl.id}">Remover</button></td></tr>`;
        }).join('')}</tbody></table></div>` : '<div class="state"><div class="ico">🚫</div>Nenhum bloqueio cadastrado.</div>'}`;

    $('#newBlock').addEventListener('click', () => {
      drawer(`
        <div class="drawer-header"><h3 style="font-family:var(--font-head);font-size:1.4rem">Bloquear horário</h3><button class="modal-close" data-x>✕</button></div>
        <div class="drawer-body">
          <div class="field"><label>Barbeiro</label>
            <select id="kBarb" ${session.role === 'barber' ? 'disabled' : ''}>${barbers.map((b) => `<option value="${b.id}" ${session.role === 'barber' && b.id === session.barberId ? 'selected' : ''}>${Utils.escapeHtml(b.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Data</label><input type="date" id="kDate" value="${Utils.todayISO()}" min="${Utils.todayISO()}"/></div>
          <div class="field"><label>Início</label><input type="time" id="kStart" value="12:00"/></div>
          <div class="field"><label>Fim</label><input type="time" id="kEnd" value="13:00"/></div>
          <div class="field"><label>Motivo</label><input id="kReason" placeholder="Folga, almoço, compromisso..."/></div>
          <button class="btn btn-primary btn-block" data-save>Bloquear</button>
        </div>`);
      $('[data-x]').addEventListener('click', closeDrawer);
      $('[data-save]').addEventListener('click', () => {
        const startMin = Utils.hhmmToMinutes($('#kStart').value);
        const endMin = Utils.hhmmToMinutes($('#kEnd').value);
        if (endMin <= startMin) return toast('O fim deve ser depois do início.', 'error');
        DB.insert('blocked_slots', {
          shopId: 'shop_navalha', barberId: $('#kBarb').value, date: $('#kDate').value,
          startMin, endMin, reason: $('#kReason').value.trim(),
        });
        toast('Horário bloqueado.', 'success'); closeDrawer(); renderView();
      });
    });
    $$('[data-del]', main).forEach((b) => b.addEventListener('click', () => { DB.remove('blocked_slots', b.dataset.del); renderView(); }));
  }

  // =========================================================================
  // CONFIGURAÇÕES: horário de funcionamento + mensagens + reset
  // =========================================================================
  function renderConfig(main) {
    const bh = DB.getAll('business_hours').sort((a, b) => (a.weekday === 0 ? 7 : a.weekday) - (b.weekday === 0 ? 7 : b.weekday));
    main.innerHTML = `
      <div class="admin-topbar"><h1>Configurações</h1></div>

      <h2 style="font-family:var(--font-head);font-size:1.5rem;margin:6px 0 14px">Horário de funcionamento</h2>
      <div class="hours-editor" id="hoursEditor">
        ${bh.map((h) => `
          <div class="hours-row ${h.closed ? 'closed' : ''}" data-wd="${h.weekday}">
            <div class="day">${Utils.WEEKDAYS_SHORT[h.weekday]}</div>
            <div class="times">
              <label style="color:var(--muted)"><input type="checkbox" data-open ${!h.closed ? 'checked' : ''}/> Aberto</label>
              <input type="time" data-o value="${Utils.minutesToHHMM(h.open)}"/> às
              <input type="time" data-c value="${Utils.minutesToHHMM(h.close)}"/>
              <span style="color:var(--faint)">pausa</span>
              <input type="time" data-bs value="${h.breakStart != null ? Utils.minutesToHHMM(h.breakStart) : ''}"/>–
              <input type="time" data-be value="${h.breakEnd != null ? Utils.minutesToHHMM(h.breakEnd) : ''}"/>
            </div>
          </div>`).join('')}
      </div>
      <button class="btn btn-primary btn-sm" id="saveHours" style="margin-top:16px">Salvar horários</button>

      <h2 style="font-family:var(--font-head);font-size:1.5rem;margin:32px 0 14px">Mensagens & lembretes</h2>
      <div class="manage-card" style="max-width:640px">
        <p class="muted">As mensagens automáticas estão em <b>modo demonstração</b>: são registradas mas não enviadas até você configurar a integração (WhatsApp/e-mail) em <code>config.js</code> + backend.</p>
        <ul class="muted" style="margin:12px 0 0;padding-left:18px">
          <li>Confirmação do agendamento</li>
          <li>Lembrete 24h e 2h antes</li>
          <li>Aviso de cancelamento</li>
          <li>Confirmação de conclusão</li>
        </ul>
        <div style="margin-top:14px">
          <button class="btn btn-ghost btn-sm" id="viewNotifs">Ver notificações registradas (${DB.getAll('notifications').length})</button>
        </div>
      </div>

      <h2 style="font-family:var(--font-head);font-size:1.5rem;margin:32px 0 14px">Dados de demonstração</h2>
      <div class="manage-card" style="max-width:640px">
        <p class="muted">Recarrega a barbearia, barbeiros, serviços e agendamentos fictícios. Útil para reapresentar a demonstração do zero.</p>
        <button class="btn btn-ghost btn-sm" id="resetDemo" style="margin-top:12px;color:var(--st-cancelado);border-color:var(--st-cancelado)">Restaurar dados de demonstração</button>
      </div>`;

    $('#saveHours').addEventListener('click', saveHours);
    $('#viewNotifs').addEventListener('click', viewNotifications);
    $('#resetDemo').addEventListener('click', () => {
      if (confirm('Isso apaga todas as alterações e recria os dados de demonstração. Continuar?')) {
        DB.reset(); toast('Dados de demonstração restaurados.', 'success'); view = 'dashboard'; renderShell();
      }
    });
  }

  function saveHours() {
    $$('#hoursEditor .hours-row').forEach((row) => {
      const wd = Number(row.dataset.wd);
      const rec = DB.getAll('business_hours').find((h) => h.weekday === wd);
      const closed = !$('[data-open]', row).checked;
      const parseT = (sel) => { const v = $(sel, row).value; return v ? Utils.hhmmToMinutes(v) : null; };
      DB.update('business_hours', rec.id, {
        closed,
        open: parseT('[data-o]') ?? rec.open,
        close: parseT('[data-c]') ?? rec.close,
        breakStart: parseT('[data-bs]'),
        breakEnd: parseT('[data-be]'),
      });
    });
    toast('Horários atualizados.', 'success');
  }

  function viewNotifications() {
    const notifs = DB.getAll('notifications').slice().reverse().slice(0, 40);
    drawer(`
      <div class="drawer-header"><h3 style="font-family:var(--font-head);font-size:1.4rem">Notificações</h3><button class="modal-close" data-x>✕</button></div>
      <div class="drawer-body">
        ${notifs.length ? notifs.map((n) => `
          <div class="manage-card" style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between"><b>${n.type}</b><span class="badge ${n.status === 'enviado' ? 'concluido' : n.status === 'erro' ? 'cancelado' : 'solicitado'}">${n.status}</span></div>
            <div class="muted" style="margin-top:6px">${n.channel} → ${Utils.escapeHtml(n.to || '')}</div>
            <div style="margin-top:8px;font-size:.85rem;white-space:pre-wrap;color:var(--muted)">${Utils.escapeHtml(n.body)}</div>
          </div>`).join('') : '<div class="state">Nenhuma notificação registrada ainda.</div>'}
      </div>`);
    $('[data-x]').addEventListener('click', closeDrawer);
  }

  // =========================================================================
  // EXPORTAÇÃO CSV
  // =========================================================================
  function exportCSV() {
    const list = applyFilters(scopedAppointments()).sort((a, b) => (a.date + a.startMin).localeCompare(b.date + b.startMin));
    const rows = [['Código', 'Data', 'Início', 'Fim', 'Cliente', 'Telefone', 'Serviço', 'Barbeiro', 'Valor', 'Status']];
    list.forEach((a) => {
      const svc = DB.get('services', a.serviceId);
      const barber = DB.get('barbers', a.barberId);
      rows.push([
        a.code, Utils.brDate(a.date), Utils.minutesToHHMM(a.startMin), Utils.minutesToHHMM(a.startMin + a.durationMin),
        a.customerName, a.customerPhone, svc ? svc.name : '', barber ? barber.name : '',
        (a.priceCents / 100).toFixed(2).replace('.', ','), STATUS_LABEL[a.status],
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `agenda-${Utils.todayISO()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('CSV exportado.', 'success');
  }

  // =========================================================================
  // BOOT
  // =========================================================================
  function boot() {
    session = Auth.current();
    if (!session) return renderLogin();
    renderShell();
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
