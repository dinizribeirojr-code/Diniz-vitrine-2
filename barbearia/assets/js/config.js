/* =============================================================================
 * config.js — Configuração central da aplicação (fácil de editar)
 * -----------------------------------------------------------------------------
 * Aqui ficam nome, marca, contatos, fuso horário e as CHAVES de integração.
 * Nenhuma chave real deve ser commitada: use variáveis de ambiente no build
 * real (veja .env.example). Enquanto os campos abaixo estiverem vazios, a
 * aplicação roda em MODO DEMONSTRAÇÃO — nenhuma requisição externa é feita.
 * ========================================================================== */

window.APP_CONFIG = {
  // ---- Identidade da barbearia (edite livremente) -------------------------
  brand: {
    name: 'Barbearia Navalha',
    tagline: 'Corte clássico, atitude moderna',
    // Troque o emoji/logo por um caminho de imagem se preferir: logoImg: 'assets/img/logo.png'
    logoText: 'BN',
    address: 'Rua das Tesouras, 128 — Centro, Rio de Janeiro/RJ',
    phone: '(21) 99681-6846',
    whatsapp: '5521996816846', // apenas dígitos, com DDI
    instagram: 'https://instagram.com/',
    maps: 'https://maps.google.com/?q=Rua+das+Tesouras+128+Rio+de+Janeiro',
    heroImage:
      'https://s3.us-west-2.amazonaws.com/images.unsplash.com/small/photo-1503951914875-452162b0f3f1',
  },

  // ---- Regras de agenda (a barbearia configura) ---------------------------
  scheduling: {
    timezone: 'America/Sao_Paulo', // fuso local da barbearia
    slotStepMinutes: 15, // granularidade dos horários oferecidos
    minAdvanceMinutes: 60, // antecedência mínima para agendar (1h)
    cancelDeadlineHours: 3, // prazo para o cliente cancelar antes do horário
    maxAdvanceDays: 45, // até quando abrir a agenda
  },

  // ---- Pontos de integração (VAZIO = modo demonstração) -------------------
  // Preencha no ambiente real. NUNCA exponha segredos reais no frontend em
  // produção — o front deve chamar um backend que guarda as chaves.
  integrations: {
    whatsapp: {
      enabled: false, // liga o envio real via API (backend)
      apiEndpoint: '', // ex.: '/api/notify/whatsapp' (seu backend)
    },
    email: {
      enabled: false,
      apiEndpoint: '', // ex.: '/api/notify/email'
    },
    payments: {
      enabled: false, // reservado para futura cobrança online
      provider: '',
    },
  },

  // ---- Acesso ao painel (DEMO). Em produção use backend + hash --------------
  // Estas credenciais existem só para a demonstração local funcionar sem
  // servidor. Em produção, a autenticação deve ser feita no backend.
  demoAuth: {
    admin: { user: 'admin', pass: 'admin123', role: 'admin', name: 'Administrador' },
    // barbeiros logam com o próprio usuário (ver seed em db.js), senha padrão:
    barberDefaultPass: 'barbeiro123',
  },
};
