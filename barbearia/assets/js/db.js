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
  const KEY = 'barbearia_navalha_db_v1';
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
      name: 'Barbearia Navalha',
      tagline: 'Corte clássico, atitude moderna',
      address: 'Rua das Tesouras, 128 — Centro, Rio de Janeiro/RJ',
      phone: '(21) 99681-6846',
      whatsapp: '5521996816846',
      timezone: 'America/Sao_Paulo',
      createdAt: new Date().toISOString(),
    }];

    // Barbeiros (o campo `photo` pode ser trocado por foto real)
    const barbers = [
      {
        id: 'barber_rafael', shopId, name: 'Rafael Andrade', userRef: 'rafael',
        photo: 'https://s3.us-west-2.amazonaws.com/images.unsplash.com/small/photo-1500648767791-00dcc994a43e',
        specialties: ['Corte masculino', 'Barba', 'Navalhado'],
        bio: 'Especialista em degradê e barba desenhada. 8 anos de cadeira.',
        active: true,
      },
      {
        id: 'barber_bruno', shopId, name: 'Bruno Teixeira', userRef: 'bruno',
        photo: 'https://s3.us-west-2.amazonaws.com/images.unsplash.com/small/photo-1506794778202-cad84cf45f1d',
        specialties: ['Corte infantil', 'Sobrancelha', 'Combo premium'],
        bio: 'Paciência com a criançada e mão leve no acabamento.',
        active: true,
      },
      {
        id: 'barber_diego', shopId, name: 'Diego Martins', userRef: 'diego',
        photo: 'https://s3.us-west-2.amazonaws.com/images.unsplash.com/small/photo-1519085360753-af0119f7cbe7',
        specialties: ['Corte + barba', 'Combo premium', 'Pigmentação'],
        bio: 'Referência em combos e tratamentos. Atendimento premium.',
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
      { id: 'user_admin', shopId, username: 'admin', role: 'admin', name: 'Administrador', email: 'admin@barbearianavalha.com.br' },
      { id: 'user_rafael', shopId, username: 'rafael', role: 'barber', name: 'Rafael Andrade', barberId: 'barber_rafael' },
      { id: 'user_bruno', shopId, username: 'bruno', role: 'barber', name: 'Bruno Teixeira', barberId: 'barber_bruno' },
      { id: 'user_diego', shopId, username: 'diego', role: 'barber', name: 'Diego Martins', barberId: 'barber_diego' },
    ];

    const customers = [
      { id: 'cust_1', shopId, name: 'Marcos Vinícius', phone: '(21) 98888-1122', email: 'marcos@email.com', notes: '' },
      { id: 'cust_2', shopId, name: 'André Souza', phone: '(21) 97777-3344', email: '', notes: 'Prefere máquina 2.' },
      { id: 'cust_3', shopId, name: 'Felipe Nogueira', phone: '(21) 96666-5566', email: 'felipe@email.com', notes: '' },
    ];

    // Agendamentos fictícios relativos a HOJE, para o painel nascer vivo.
    const iso = (offsetDays) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return Utils.toISODate(d);
    };
    const appointments = [
      {
        id: 'appt_1', shopId, code: 'AG-DEMO-1001',
        serviceId: 'svc_corte_barba', barberId: 'barber_rafael', customerId: 'cust_1',
        customerName: 'Marcos Vinícius', customerPhone: '(21) 98888-1122', customerEmail: 'marcos@email.com',
        date: iso(0), startMin: 10 * 60, durationMin: 75, priceCents: 7000,
        status: 'confirmado', notes: '', createdAt: new Date().toISOString(),
      },
      {
        id: 'appt_2', shopId, code: 'AG-DEMO-1002',
        serviceId: 'svc_corte', barberId: 'barber_bruno', customerId: 'cust_2',
        customerName: 'André Souza', customerPhone: '(21) 97777-3344', customerEmail: '',
        date: iso(0), startMin: 14 * 60, durationMin: 45, priceCents: 4500,
        status: 'solicitado', notes: 'Prefere máquina 2.', createdAt: new Date().toISOString(),
      },
      {
        id: 'appt_3', shopId, code: 'AG-DEMO-1003',
        serviceId: 'svc_premium', barberId: 'barber_diego', customerId: 'cust_3',
        customerName: 'Felipe Nogueira', customerPhone: '(21) 96666-5566', customerEmail: 'felipe@email.com',
        date: iso(1), startMin: 15 * 60, durationMin: 90, priceCents: 9500,
        status: 'confirmado', notes: '', createdAt: new Date().toISOString(),
      },
      {
        id: 'appt_4', shopId, code: 'AG-DEMO-1004',
        serviceId: 'svc_barba', barberId: 'barber_rafael', customerId: 'cust_2',
        customerName: 'André Souza', customerPhone: '(21) 97777-3344', customerEmail: '',
        date: iso(-1), startMin: 16 * 60, durationMin: 30, priceCents: 3000,
        status: 'concluido', notes: '', createdAt: new Date().toISOString(),
      },
    ];

    // Bloqueio manual de exemplo (almoço estendido de um barbeiro num dia).
    const blocked_slots = [
      {
        id: 'block_1', shopId, barberId: 'barber_diego', date: iso(2),
        startMin: 13 * 60, endMin: 14 * 60, reason: 'Compromisso pessoal',
      },
    ];

    const notifications = [];

    return {
      users, barbershops, barbers, services, customers,
      appointments, business_hours, blocked_slots, notifications,
    };
  }

  return { ENTITIES, getAll, get, query, insert, update, remove, reset, seed: () => reset() };
})();
