/* =============================================================================
 * db.js — Camada de dados (o "banco de dados" da demonstração)
 * -----------------------------------------------------------------------------
 * Persiste em localStorage para que a demonstração funcione SEM servidor:
 * um agendamento criado pelo cliente fica indisponível para os próximos e
 * aparece imediatamente no painel do administrador.
 *
 * MODELO DE DADOS (as mesmas entidades de um backend real):
 *   users          — usuários, papéis (role) e autenticação
 *   barbershops    — dados da barbearia
 *   barbers        — barbeiros e seus horários de trabalho
 *   services       — serviços, preço (em centavos), duração e status
 *   customers      — clientes e contato
 *   appointments   — agendamentos (status, serviço, cliente, barbeiro, data, hora)
 *   business_hours — horário de funcionamento por dia da semana
 *   blocked_slots  — horários bloqueados manualmente
 *   notifications  — notificações e status de envio
 *
 * >>> PONTO DE MIGRAÇÃO <<<  Para trocar por uma API real, reescreva apenas os
 * métodos deste módulo (getAll/insert/update/remove) para chamar o backend.
 * O restante da aplicação não precisa mudar.
 * ========================================================================== */

const DB = (() => {
  const KEY = 'barbearia_demo_db_v2';
  const ENTITIES = [
    'users', 'barbershops', 'barbers', 'services',
    'customers', 'appointments', 'business_hours', 'blocked_slots', 'notifications',
  ];

  let cache = null;

  const load = () => {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        cache = JSON.parse(raw);
        // garante que toda entidade exista mesmo após upgrades
        ENTITIES.forEach((e) => { if (!cache[e]) cache[e] = []; });
        return cache;
      }
    } catch (e) {
      console.warn('Falha ao ler o banco local, recriando.', e);
    }
    cache = seed();
    persist();
    return cache;
  };

  const persist = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('Não foi possível salvar no armazenamento local.', e);
    }
  };

  // ---- API genérica de coleção ---------------------------------------------
  const getAll = (entity) => [...(load()[entity] || [])];
  const get = (entity, id) => (load()[entity] || []).find((r) => r.id === id) || null;
  const query = (entity, predicate) => (load()[entity] || []).filter(predicate);

  const insert = (entity, record) => {
    load();
    if (!record.id) record.id = Utils.uid(entity.slice(0, 3));
    record.createdAt = record.createdAt || new Date().toISOString();
    cache[entity].push(record);
    persist();
    return record;
  };

  const update = (entity, id, patch) => {
    load();
    const idx = cache[entity].findIndex((r) => r.id === id);
    if (idx === -1) return null;
    cache[entity][idx] = { ...cache[entity][idx], ...patch, updatedAt: new Date().toISOString() };
    persist();
    return cache[entity][idx];
  };

  const remove = (entity, id) => {
    load();
    const before = cache[entity].length;
    cache[entity] = cache[entity].filter((r) => r.id !== id);
    persist();
    return cache[entity].length < before;
  };

  const reset = () => {
    cache = seed();
    persist();
    return cache;
  };

  // ---- Seed / dados de demonstração ----------------------------------------
  function defaultBusinessHours() {
    // 0=Dom ... 6=Sáb. minutos desde a meia-noite.
    const workday = (open, close, breakStart, breakEnd) => ({
      open, close, breakStart, breakEnd, closed: false,
    });
    return [
      { id: 'bh_0', weekday: 0, closed: true, open: 0, close: 0, breakStart: null, breakEnd: null }, // Dom
      { id: 'bh_1', weekday: 1, ...workday(9 * 60, 19 * 60, 12 * 60, 13 * 60) },   // Seg
      { id: 'bh_2', weekday: 2, ...workday(9 * 60, 19 * 60, 12 * 60, 13 * 60) },   // Ter
      { id: 'bh_3', weekday: 3, ...workday(9 * 60, 19 * 60, 12 * 60, 13 * 60) },   // Qua
      { id: 'bh_4', weekday: 4, ...workday(9 * 60, 20 * 60, 12 * 60, 13 * 60) },   // Qui
      { id: 'bh_5', weekday: 5, ...workday(9 * 60, 20 * 60, 12 * 60, 13 * 60) },   // Sex
      { id: 'bh_6', weekday: 6, ...workday(8 * 60, 17 * 60, null, null) },         // Sáb
    ];
  }

  function seed() {
    const shopId = 'shop_navalha';

    const barbershops = [{
      id: shopId,
      name: 'Barbearia Demonstração',
      tagline: 'Modelo de vitrine — corte, barba e hora marcada',
      address: 'Rua das Tesouras, 128 — Centro, Rio de Janeiro/RJ',
      phone: '(21) 99999-0000',       // PLACEHOLDER — troque pelo número do cliente
      whatsapp: '5521999990000',      // PLACEHOLDER (só dígitos, com DDI)
      timezone: 'America/Sao_Paulo',
      createdAt: new Date().toISOString(),
    }];

    // Barbeiros — nomes inventados para o modelo (troque `photo` por foto real)
    const barbers = [
      {
        id: 'barber_caio', shopId, name: 'Caio Belmonte', userRef: 'caio',
        photo: 'https://s3.us-west-2.amazonaws.com/images.unsplash.com/small/photo-1500648767791-00dcc994a43e',
        specialties: ['Corte masculino', 'Barba', 'Navalhado'],
        bio: 'Degradê milimétrico e barba desenhada na navalha. 9 anos de cadeira.',
        active: true,
      },
      {
        id: 'barber_theo', shopId, name: 'Théo Ramires', userRef: 'theo',
        photo: 'https://s3.us-west-2.amazonaws.com/images.unsplash.com/small/photo-1519085360753-af0119f7cbe7',
        specialties: ['Corte + barba', 'Combo premium', 'Pigmentação'],
        bio: 'Referência em combos e acabamento premium. Mão firme no contorno.',
        active: true,
      },
      {
        id: 'barber_igor', shopId, name: 'Ígor Fontana', userRef: 'igor',
        photo: 'https://s3.us-west-2.amazonaws.com/images.unsplash.com/small/photo-1506794778202-cad84cf45f1d',
        specialties: ['Corte infantil', 'Sobrancelha', 'Corte masculino'],
        bio: 'Paciência com a criançada e olho de artista na sobrancelha.',
        active: true,
      },
    ];

    const services = [
      { id: 'svc_corte', shopId, name: 'Corte masculino', description: 'Corte na tesoura ou máquina, lavagem e finalização.', durationMin: 45, priceCents: 4500, active: true },
      { id: 'svc_barba', shopId, name: 'Barba', description: 'Toalha quente, navalha e hidratação.', durationMin: 30, priceCents: 3000, active: true },
      { id: 'svc_corte_barba', shopId, name: 'Corte + barba', description: 'O combo mais pedido: corte completo e barba desenhada.', durationMin: 75, priceCents: 7000, active: true, popular: true },
      { id: 'svc_sobrancelha', shopId, name: 'Sobrancelha', description: 'Alinhamento na navalha ou pinça.', durationMin: 15, priceCents: 2000, active: true },
      { id: 'svc_infantil', shopId, name: 'Corte infantil', description: 'Corte para crianças até 10 anos, com paciência de sobra.', durationMin: 40, priceCents: 4000, active: true },
      { id: 'svc_premium', shopId, name: 'Combo premium', description: 'Corte, barba, sobrancelha e tratamento. A experiência completa.', durationMin: 90, priceCents: 9500, active: true },
    ];

    // Cada barbeiro atende dentro do horário da barbearia; aqui damos a cada um
    // uma pausa própria só para ilustrar a regra de pausas individuais.
    const business_hours = defaultBusinessHours();

    // Usuários (autenticação DEMO). Senhas ficam em config.js; aqui só o papel.
    const users = [
      { id: 'user_admin', shopId, username: 'admin', role: 'admin', name: 'Administrador', email: 'admin@barbeariademo.com.br' },
      { id: 'user_caio', shopId, username: 'caio', role: 'barber', name: 'Caio Belmonte', barberId: 'barber_caio' },
      { id: 'user_theo', shopId, username: 'theo', role: 'barber', name: 'Théo Ramires', barberId: 'barber_theo' },
      { id: 'user_igor', shopId, username: 'igor', role: 'barber', name: 'Ígor Fontana', barberId: 'barber_igor' },
    ];

    const customers = [
      { id: 'cust_1', shopId, name: 'Marcelo Aragão', phone: '(21) 98123-4567', email: 'marcelo@email.com', notes: '' },
      { id: 'cust_2', shopId, name: 'Rodrigo Pires', phone: '(21) 99234-5678', email: '', notes: 'Prefere máquina 2.' },
      { id: 'cust_3', shopId, name: 'Vitor Hugo Lima', phone: '(21) 98345-6789', email: 'vitorhugo@email.com', notes: '' },
      { id: 'cust_4', shopId, name: 'Sérgio Bastos', phone: '(21) 99456-7890', email: '', notes: '' },
      { id: 'cust_5', shopId, name: 'Paulo Renato', phone: '(21) 98567-8901', email: 'paulo@email.com', notes: '' },
      { id: 'cust_6', shopId, name: 'Anderson Rocha', phone: '(21) 99678-9012', email: '', notes: 'Costuma atrasar 10min.' },
      { id: 'cust_7', shopId, name: 'Lucas Ferraz', phone: '(21) 98789-0123', email: 'lucas@email.com', notes: '' },
    ];

    // ---- Agendas fictícias -------------------------------------------------
    // Gera agendamentos realistas para CADA barbeiro, distribuídos entre alguns
    // dias passados e os próximos dias, sempre relativos a HOJE. Respeita o
    // expediente, a pausa do almoço, a duração de cada serviço e não deixa dois
    // agendamentos se sobreporem para o mesmo barbeiro — então a agenda parece
    // cheia, mas ainda sobram horários livres para demonstrar o agendamento.
    const iso = (offsetDays) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return Utils.toISODate(d);
    };
    const bhForWeekday = (wd) => business_hours.find((b) => b.weekday === wd);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const collides = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

    // Bloqueio manual de exemplo (compromisso pessoal de um barbeiro num dia).
    // Definido ANTES da geração para a agenda não marcar sobre o bloqueio.
    const blocked_slots = [
      {
        id: 'block_1', shopId, barberId: 'barber_theo', date: iso(2),
        startMin: 13 * 60, endMin: 14 * 60 + 30, reason: 'Compromisso pessoal',
      },
    ];

    const appointments = [];
    let seq = 1001;
    for (let off = -3; off <= 6; off++) {
      const date = iso(off);
      const bh = bhForWeekday(Utils.weekdayOf(date));
      if (!bh || bh.closed) continue; // dia fechado não tem agenda

      barbers.forEach((barber, bi) => {
        // já reserva os horários bloqueados deste barbeiro neste dia
        const taken = blocked_slots
          .filter((b) => b.barberId === barber.id && b.date === date)
          .map((b) => [b.startMin, b.endMin]);
        const target = 2 + ((off + bi + 9) % 3); // 2 a 4 atendimentos no dia

        // horários candidatos (de 15 em 15 min), embaralhados
        const candidates = [];
        for (let t = bh.open; t < bh.close; t += 15) candidates.push(t);
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        let placed = 0;
        for (const start of candidates) {
          if (placed >= target) break;
          const svc = pick(services);
          const end = start + svc.durationMin;
          if (end > bh.close) continue;
          if (bh.breakStart != null && collides(start, end, bh.breakStart, bh.breakEnd)) continue;
          if (taken.some(([s, e]) => collides(start, end, s, e))) continue;

          taken.push([start, end]);
          placed++;
          const cust = pick(customers);

          let status;
          if (off < 0) status = Math.random() < 0.15 ? 'nao_compareceu' : 'concluido';
          else if (off === 0) {
            status = end <= Utils.nowMinutes()
              ? 'concluido'
              : pick(['confirmado', 'confirmado', 'solicitado']);
          } else status = pick(['confirmado', 'confirmado', 'solicitado']);

          appointments.push({
            id: 'appt_' + seq, shopId, code: 'AG-DEMO-' + seq,
            serviceId: svc.id, barberId: barber.id, customerId: cust.id,
            customerName: cust.name, customerPhone: cust.phone, customerEmail: cust.email,
            date, startMin: start, durationMin: svc.durationMin, priceCents: svc.priceCents,
            status, notes: cust.notes || '', source: 'demo', createdAt: new Date().toISOString(),
          });
          seq++;
        }
      });
    }

    const notifications = [];

    return {
      users, barbershops, barbers, services, customers,
      appointments, business_hours, blocked_slots, notifications,
    };
  }

  return { ENTITIES, getAll, get, query, insert, update, remove, reset, seed: () => reset() };
})();
