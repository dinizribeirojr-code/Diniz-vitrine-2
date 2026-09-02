/* =============================================================================
 * scheduling.js — Motor de disponibilidade e regras de agenda
 * -----------------------------------------------------------------------------
 * Concentra TODA a regra: horário de funcionamento, duração do serviço,
 * pausas, bloqueios, antecedência mínima, horários passados e conflito de
 * agendamentos. É o "servidor" da demonstração: a validação de conflito aqui
 * (assertBookable) é o equivalente à validação no backend que impede
 * agendamentos duplicados.
 * ========================================================================== */

const Scheduling = (() => {
  const cfg = () => window.APP_CONFIG.scheduling;

  const ACTIVE_STATUSES = ['solicitado', 'confirmado', 'concluido']; // ocupam a agenda
  // 'cancelado' e 'nao_compareceu' liberam o horário.

  const businessHoursFor = (weekday) =>
    DB.getAll('business_hours').find((b) => b.weekday === weekday) || null;

  // Intervalos [startMin, endMin) em que o barbeiro está OCUPADO no dia.
  function busyIntervals(barberId, isoDate) {
    const out = [];

    DB.query('appointments', (a) =>
      a.barberId === barberId &&
      a.date === isoDate &&
      ACTIVE_STATUSES.includes(a.status)
    ).forEach((a) => out.push([a.startMin, a.startMin + a.durationMin]));

    DB.query('blocked_slots', (b) =>
      b.barberId === barberId && b.date === isoDate
    ).forEach((b) => out.push([b.startMin, b.endMin]));

    return out;
  }

  const overlaps = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

  // Um candidato [start, start+dur) é válido dentro de uma janela de trabalho?
  function fitsWindow(start, dur, win) {
    const end = start + dur;
    if (start < win.open || end > win.close) return false;
    // não pode invadir a pausa (almoço), se houver
    if (win.breakStart != null && win.breakEnd != null) {
      if (overlaps(start, end, win.breakStart, win.breakEnd)) return false;
    }
    return true;
  }

  /**
   * Gera os horários de início disponíveis para um barbeiro, num dia, para um
   * serviço de duração `durationMin`. Retorna array de minutos (desde 00:00).
   */
  function availableStarts(barberId, isoDate, durationMin) {
    const weekday = Utils.weekdayOf(isoDate);
    const bh = businessHoursFor(weekday);
    if (!bh || bh.closed) return [];

    const win = { open: bh.open, close: bh.close, breakStart: bh.breakStart, breakEnd: bh.breakEnd };
    const step = cfg().slotStepMinutes;
    const busy = busyIntervals(barberId, isoDate);

    // piso de horário para hoje: agora + antecedência mínima
    const isToday = isoDate === Utils.todayISO();
    const floorMin = isToday ? Utils.nowMinutes() + cfg().minAdvanceMinutes : -1;

    const starts = [];
    for (let t = win.open; t + durationMin <= win.close; t += step) {
      if (t <= floorMin) continue;              // horário passado / sem antecedência
      if (!fitsWindow(t, durationMin, win)) continue; // fora da janela / na pausa
      const conflict = busy.some(([bs, be]) => overlaps(t, t + durationMin, bs, be));
      if (conflict) continue;
      starts.push(t);
    }
    return starts;
  }

  // Lista de barbeiros ativos que atendem um serviço (todos, por ora) e têm
  // ao menos um horário no dia. Usado por "qualquer profissional".
  function barbersWithAvailability(isoDate, durationMin) {
    return DB.query('barbers', (b) => b.active).filter(
      (b) => availableStarts(b.id, isoDate, durationMin).length > 0
    );
  }

  // Para "qualquer profissional": retorna todos os horários possíveis no dia
  // (união), e a que barbeiro cada horário pode ser atribuído.
  function anyBarberStarts(isoDate, durationMin) {
    const map = new Map(); // startMin -> [barberIds]
    DB.query('barbers', (b) => b.active).forEach((b) => {
      availableStarts(b.id, isoDate, durationMin).forEach((t) => {
        if (!map.has(t)) map.set(t, []);
        map.get(t).push(b.id);
      });
    });
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([startMin, barberIds]) => ({ startMin, barberIds }));
  }

  // Datas (ISO) com pelo menos um horário livre, dentro da janela configurada.
  function availableDates(barberId, durationMin) {
    const out = [];
    const max = cfg().maxAdvanceDays;
    const base = new Date();
    for (let i = 0; i <= max; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = Utils.toISODate(d);
      let has;
      if (barberId === 'any') {
        has = anyBarberStarts(iso, durationMin).length > 0;
      } else {
        has = availableStarts(barberId, iso, durationMin).length > 0;
      }
      if (has) out.push(iso);
    }
    return out;
  }

  /**
   * Validação de servidor: lança erro se o horário não puder ser reservado.
   * Reconfirma tudo no momento da confirmação, fechando a corrida entre dois
   * clientes que abriram a mesma tela.
   */
  function assertBookable({ barberId, isoDate, startMin, durationMin }) {
    const weekday = Utils.weekdayOf(isoDate);
    const bh = businessHoursFor(weekday);
    if (!bh || bh.closed) throw new Error('A barbearia não abre nesse dia.');

    const win = { open: bh.open, close: bh.close, breakStart: bh.breakStart, breakEnd: bh.breakEnd };
    if (!fitsWindow(startMin, durationMin, win)) {
      throw new Error('Horário fora do funcionamento ou sobre a pausa.');
    }

    const isToday = isoDate === Utils.todayISO();
    if (isoDate < Utils.todayISO()) throw new Error('Não é possível agendar em data passada.');
    if (isToday && startMin <= Utils.nowMinutes() + cfg().minAdvanceMinutes) {
      throw new Error('Escolha um horário com a antecedência mínima.');
    }

    const busy = busyIntervals(barberId, isoDate);
    const conflict = busy.some(([bs, be]) => overlaps(startMin, startMin + durationMin, bs, be));
    if (conflict) throw new Error('Esse horário acabou de ser ocupado. Escolha outro.');

    return true;
  }

  // O cliente ainda pode cancelar? (respeita prazo de cancelamento)
  function canCancel(appointment) {
    const startDate = Utils.parseISODate(appointment.date);
    startDate.setMinutes(appointment.startMin);
    const deadline = new Date(startDate.getTime() - cfg().cancelDeadlineHours * 3600 * 1000);
    return new Date() < deadline;
  }

  return {
    ACTIVE_STATUSES, businessHoursFor, availableStarts, barbersWithAvailability,
    anyBarberStarts, availableDates, assertBookable, canCancel, busyIntervals,
  };
})();
