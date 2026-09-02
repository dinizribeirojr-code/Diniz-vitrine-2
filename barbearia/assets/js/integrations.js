/* =============================================================================
 * integrations.js — Notificações (WhatsApp / e-mail) e MODO DEMONSTRAÇÃO
 * -----------------------------------------------------------------------------
 * A primeira versão NÃO envia nada de verdade: registra a notificação na
 * entidade `notifications` com status 'demo' e mostra o texto que SERIA
 * enviado. Os pontos de integração real estão isolados em `dispatch()`.
 *
 * Para ativar o envio real:
 *   1. Configure integrations.whatsapp/email em config.js (enabled + endpoint);
 *   2. Implemente o endpoint no seu BACKEND (as chaves ficam lá, nunca aqui);
 *   3. `dispatch()` passará a fazer o fetch para o seu backend.
 * ========================================================================== */

const Notify = (() => {
  const cfg = () => window.APP_CONFIG.integrations;
  const brand = () => window.APP_CONFIG.brand;

  // ---- Modelos de mensagem (fáceis de editar) ------------------------------
  const templates = {
    confirmacao: (a) =>
      `Olá, ${a.customerName}! Seu horário na ${brand().name} está *${a.status}*.\n` +
      `Serviço: ${a.serviceName}\nProfissional: ${a.barberName}\n` +
      `Data: ${Utils.brDate(a.date)} às ${Utils.minutesToHHMM(a.startMin)}\n` +
      `Código: ${a.code}\nAté breve! ✂️`,
    lembrete_24h: (a) =>
      `Lembrete: amanhã, ${Utils.brDate(a.date)} às ${Utils.minutesToHHMM(a.startMin)}, ` +
      `você tem ${a.serviceName} com ${a.barberName} na ${brand().name}. Código ${a.code}.`,
    lembrete_2h: (a) =>
      `Seu horário é daqui a pouco! Hoje às ${Utils.minutesToHHMM(a.startMin)} — ` +
      `${a.serviceName} com ${a.barberName}. Te esperamos na ${brand().name}.`,
    cancelamento: (a) =>
      `Seu agendamento ${a.code} (${Utils.brDate(a.date)} às ${Utils.minutesToHHMM(a.startMin)}) ` +
      `foi *cancelado*. Se quiser remarcar, é só chamar. — ${brand().name}`,
    conclusao: (a) =>
      `Obrigado pela visita, ${a.customerName}! Esperamos ter caprichado. ` +
      `Volte sempre à ${brand().name}. ✂️`,
  };

  // Enriquecemos o agendamento com nomes legíveis para as mensagens.
  function enrich(appointment) {
    const svc = DB.get('services', appointment.serviceId);
    const barber = DB.get('barbers', appointment.barberId);
    return {
      ...appointment,
      serviceName: svc ? svc.name : 'Serviço',
      barberName: barber ? barber.name : 'Profissional',
    };
  }

  /**
   * Registra e (em produção) envia uma notificação.
   * @param {string} type  confirmacao | lembrete_24h | lembrete_2h | cancelamento | conclusao
   * @param {object} appointment
   * @param {string} channel  'whatsapp' | 'email'
   */
  async function dispatch(type, appointment, channel = 'whatsapp') {
    const a = enrich(appointment);
    const body = (templates[type] || (() => ''))(a);

    const record = {
      appointmentId: appointment.id,
      type, channel,
      to: channel === 'email' ? a.customerEmail : a.customerPhone,
      body,
      status: 'demo', // 'demo' | 'enviado' | 'erro'
      sentAt: null,
    };

    const conf = cfg()[channel];
    const isReal = conf && conf.enabled && conf.apiEndpoint;

    if (!isReal) {
      // ---- MODO DEMONSTRAÇÃO: não sai nada da máquina ----------------------
      record.status = 'demo';
      DB.insert('notifications', record);
      return record;
    }

    // ---- INTEGRAÇÃO REAL (via seu backend; chaves ficam no servidor) -------
    try {
      await fetch(conf.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: record.to, message: body, type, appointmentId: appointment.id }),
      });
      record.status = 'enviado';
      record.sentAt = new Date().toISOString();
    } catch (e) {
      record.status = 'erro';
      record.error = String(e);
    }
    DB.insert('notifications', record);
    return record;
  }

  // ---- Link "abrir conversa no WhatsApp" com mensagem pré-preenchida --------
  function whatsappLink(phoneDigits, message) {
    const num = Utils.onlyDigits(phoneDigits);
    return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  }

  // Link para o cliente confirmar/tirar dúvida com a barbearia
  function whatsappForAppointment(appointment) {
    const a = enrich(appointment);
    const msg =
      `Olá! Sobre meu agendamento ${a.code}: ${a.serviceName} com ${a.barberName} ` +
      `em ${Utils.brDate(a.date)} às ${Utils.minutesToHHMM(a.startMin)}.`;
    return whatsappLink(brand().whatsapp, msg);
  }

  return { dispatch, templates, whatsappLink, whatsappForAppointment, enrich };
})();
