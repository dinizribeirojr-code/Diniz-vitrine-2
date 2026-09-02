/* =============================================================================
 * auth.js — Autenticação e sessão (DEMONSTRAÇÃO)
 * -----------------------------------------------------------------------------
 * ATENÇÃO: esta autenticação é apenas para a demonstração rodar sem servidor.
 * Ela NÃO é segura para produção — não há verificação no servidor nem hash de
 * senha. Em produção, troque por autenticação real no backend (JWT/sessão) e
 * remova as credenciais de config.js. O papel do usuário (role) restringe o
 * que ele vê no painel: 'admin' vê tudo; 'barber' vê apenas a própria agenda.
 * ========================================================================== */

const Auth = (() => {
  const SESSION_KEY = 'barbearia_navalha_session';

  const current = () => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const login = (username, password) => {
    const cfg = window.APP_CONFIG.demoAuth;
    const u = (username || '').trim().toLowerCase();

    // Administrador
    if (u === cfg.admin.user && password === cfg.admin.pass) {
      const sess = { username: cfg.admin.user, role: 'admin', name: cfg.admin.name, barberId: null };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      return sess;
    }

    // Barbeiro (usuário = campo username do user; senha padrão da demo)
    const user = DB.getAll('users').find(
      (x) => x.role === 'barber' && x.username.toLowerCase() === u
    );
    if (user && password === cfg.barberDefaultPass) {
      const sess = { username: user.username, role: 'barber', name: user.name, barberId: user.barberId };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      return sess;
    }

    return null;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
  };

  const requireAuth = () => {
    const sess = current();
    if (!sess) {
      window.location.href = 'admin.html';
      return null;
    }
    return sess;
  };

  const can = (session, capability) => {
    if (!session) return false;
    if (session.role === 'admin') return true;
    // barbeiro: capacidades limitadas
    const barberCaps = ['view_own_agenda', 'confirm_appointment', 'block_slot', 'complete_appointment'];
    return barberCaps.includes(capability);
  };

  return { current, login, logout, requireAuth, can };
})();
