# 💈 Barbearia Navalha — Sistema de Agendamento (demonstração)

Aplicação web **responsiva, moderna e funcional** para gestão e agendamento de
serviços de uma barbearia. Clientes agendam horários online; barbeiros e
administrador gerenciam serviços, profissionais, agenda, clientes e lembretes
em um painel protegido.

> **Modelo de demonstração.** Roda 100% no navegador, sem servidor: os dados
> ficam no `localStorage` do próprio navegador (a camada de dados imita um
> backend real). Um agendamento feito pelo cliente **fica indisponível** para
> os próximos e aparece **na hora** no painel. Os pontos de integração real
> (WhatsApp, e-mail, pagamentos, banco de dados) estão isolados e prontos para
> plugar.

---

## ✨ O que já funciona

**Página pública**
- Nome, logo, foto principal, botão destacado **Agendar horário**
- Lista de serviços (nome, descrição, duração, preço em R$)
- Apresentação dos barbeiros, avaliações, endereço, telefone, WhatsApp e horários
- Links para Instagram e Google Maps

**Fluxo de agendamento (em etapas)**
1. Escolha do serviço → 2. barbeiro (ou *qualquer profissional*) →
3. data e horário (só mostra o que está livre) → 4. dados do cliente →
5. resumo → 6. confirmação → tela de sucesso com **número do agendamento** e
**adicionar ao calendário** (arquivo `.ics`) + botão de WhatsApp.

**Regras de agenda**
- Sem dois agendamentos no mesmo horário para o mesmo barbeiro
- Considera a **duração** de cada serviço e as **pausas**
- Respeita o **horário de funcionamento** e o **fuso** configurado
- Bloqueio manual de horários; impede horário passado
- Antecedência mínima e prazo de cancelamento configuráveis
- Horários ocupados/livres sempre claros

**Painel administrativo (protegido)**
- Agenda em **dia / semana / mês**, com filtros por barbeiro e status
- Cards: agendamentos do dia, concluídos, **faturamento estimado**, cancelamentos
- CRUD de **serviços** e **barbeiros**; **clientes** com histórico
- Criação manual, **confirmação**, **remarcação**, **cancelamento** e bloqueios
- Configuração de **horário de funcionamento**
- **Exportação da agenda em CSV**
- Papéis: **admin** vê tudo; **barbeiro** vê só a própria agenda

**Status dos agendamentos** (cada um com cor):
`solicitado` · `confirmado` · `concluido` · `cancelado` · `nao_compareceu`

**Notificações** (estrutura pronta, em **modo demonstração**): confirmação,
lembrete 24h, lembrete 2h, cancelamento e conclusão. Enquanto a integração real
não é ligada, as mensagens são **registradas** (visíveis em *Configurações →
Notificações*) mas **não são enviadas**. Há botões de WhatsApp com mensagem
pré-preenchida em vários pontos.

> **No modelo de demonstração, o WhatsApp fica desligado de propósito.** Nada é
> enviado automaticamente e **nada é vinculado à sua conta** WhatsApp Business.
> Os botões `wa.me` só abrem uma conversa com o número do `config.js`, que aqui é
> um **placeholder** (`(21) 99999-0000`). Ative o envio real apenas no
> repositório de um cliente de verdade, com o número e a conta **do cliente** —
> nunca com o seu número na demo.

---

## 🚀 Como executar

Não há build nem dependências. Basta servir a pasta como arquivos estáticos:

```bash
cd barbearia
python3 -m http.server 8080
# abra http://localhost:8080/index.html   (site público)
#       http://localhost:8080/admin.html   (painel)
```

Qualquer servidor estático serve (`npx serve`, Live Server do VS Code etc.).

### Acesso ao painel (demonstração)

| Perfil | Usuário | Senha |
|---|---|---|
| Administrador | `admin` | `admin123` |
| Barbeiro | `rafael` / `bruno` / `diego` | `barbeiro123` |

> Estas credenciais existem apenas para a demonstração rodar sem servidor.
> **Em produção**, troque por autenticação real no backend (ver abaixo).

### Testar o fluxo completo (roteiro)

1. No site, clique **Agendar horário**, escolha *Corte + barba*, um barbeiro,
   uma data, um horário livre, preencha os dados e confirme.
2. Reabra o agendamento: o **mesmo horário** para aquele barbeiro **não aparece**
   mais (fica indisponível).
3. Entre no painel (`admin` / `admin123`): o agendamento aparece em **Painel** e
   **Agenda**. Ali dá para **confirmar**, **remarcar** e **cancelar**.
4. Ao cancelar, o horário **volta a ficar livre** no site.

---

## 🗂️ Estrutura

```
barbearia/
├── index.html              # site público + fluxo de agendamento
├── admin.html              # painel (login + área administrativa)
├── .env.example            # variáveis para as integrações reais (backend)
├── README.md
└── assets/
    ├── css/
    │   ├── style.css        # identidade visual (paleta em :root — fácil de editar)
    │   └── admin.css        # estilos do painel
    └── js/
        ├── config.js        # nome, marca, contatos, regras e chaves de integração
        ├── utils.js         # moeda (R$), datas pt-BR, validações
        ├── db.js            # "banco" (localStorage) + entidades + dados demo
        ├── scheduling.js    # motor de disponibilidade e regras de agenda
        ├── integrations.js  # notificações + modo demonstração + WhatsApp
        ├── calendar.js      # geração de .ics (adicionar ao calendário)
        ├── auth.js          # autenticação/sessão (demo) e papéis
        ├── public.js        # lógica da página pública e do agendamento
        └── admin.js         # lógica do painel administrativo
```

## 🧱 Modelo de dados (entidades)

`users` · `barbershops` · `barbers` · `services` · `customers` ·
`appointments` · `business_hours` · `blocked_slots` · `notifications`

Os campos de cada entidade estão documentados no topo de `assets/js/db.js`.
Preços são guardados **em centavos** (inteiro) para evitar erro de arredondamento.

---

## 🎨 Personalização rápida

- **Nome, logo, cores, contatos, fuso, regras** → `assets/js/config.js`
- **Paleta e tipografia** → variáveis no `:root` de `assets/css/style.css`
  (fundo escuro + dourado/cobre; troque os valores para reidentificar a marca)
- **Serviços, barbeiros, horários e dados demo** → `assets/js/db.js`
  (ou pelo próprio painel, em tempo real)

---

## 🔌 Ligando as integrações reais (produção)

O código está pronto para evoluir sem reescrever a interface:

1. **Banco de dados real** — reescreva apenas os métodos de `assets/js/db.js`
   (`getAll/get/insert/update/remove`) para chamar sua API. O resto não muda.
2. **Autenticação real** — troque `assets/js/auth.js` por login no backend
   (sessão/JWT) e remova as credenciais de `config.js`.
3. **WhatsApp / e-mail** — em `config.js`, marque `integrations.whatsapp.enabled`
   / `email.enabled` como `true` e informe o `apiEndpoint` do **seu backend**.
   O `dispatch()` de `integrations.js` passará a chamar esse endpoint. As
   **chaves ficam no servidor** (ver `.env.example`), nunca no frontend.
4. **Validação no servidor** — `Scheduling.assertBookable()` é o equivalente à
   verificação de conflito que deve rodar no backend antes de gravar, impedindo
   agendamentos duplicados em condição de corrida.
5. **Pagamentos** — ponto reservado em `config.js` (`integrations.payments`).

### Segurança (ao ir para produção)
- Exigir autenticação no backend para todo o painel e restringir por papel
- Validar dados no **frontend e no backend**
- Nunca expor chaves de API no frontend
- Proteger dados pessoais dos clientes (LGPD) — se ligar o Analytics/cookies,
  informar no rodapé

---

## ☁️ Publicar

Por ser estático, publica em qualquer hospedagem de arquivos:

- **Netlify / Vercel / Cloudflare Pages**: aponte para a pasta `barbearia/`
  (publish directory) — sem build.
- **GitHub Pages**: sirva a pasta pelo Pages.

> Atenção ao cache: como `style.css`/`admin.css`/`*.js` não têm hash no nome,
> evite `Cache-Control: immutable` para eles — senão o navegador pode servir
> HTML novo com CSS/JS antigos. Prefira revalidação (a CDN responde 304).

---

## ♻️ Replicar para outro cliente (este é um modelo reutilizável)

Esta pasta foi feita para servir de **template**: cada nova barbearia é uma
cópia com a marca trocada. Para produzir o site de um cliente novo, siga o
roteiro — **sem tocar no código de lógica** (`scheduling.js`, `db.js` API,
`admin.js`, `public.js`):

1. **Copie a pasta** `barbearia/` para o repositório próprio do cliente
   (cada cliente tem repositório e site próprios — não misture com a Genesis).
2. **Marca e contatos** → `assets/js/config.js` (`brand`): nome, logo, endereço,
   telefone, `whatsapp`, Instagram, Maps, foto principal e `timezone`.
3. **Regras da agenda** → `assets/js/config.js` (`scheduling`): antecedência,
   prazo de cancelamento, granularidade e janela de dias.
4. **Serviços, barbeiros e horários iniciais** → `assets/js/db.js` (função
   `seed()`), ou cadastre tudo pelo painel depois de publicar.
5. **Paleta e tipografia** → variáveis no `:root` de `assets/css/style.css`
   (troque dourado/cobre pela identidade do cliente).
6. **Senhas de demonstração** → `assets/js/config.js` (`demoAuth`). Em produção,
   troque pela autenticação real no backend.
7. **Integrações** (WhatsApp/e-mail) → `config.js` + `.env` no backend do cliente,
   quando for ligar o envio real.

Checklist rápido antes de entregar: nome/telefone/WhatsApp trocados em todos os
lugares (inclusive `db.js`), serviços e preços do cliente, horário de
funcionamento real, e teste do fluxo completo (agendar → horário some → painel
confirma/cancela → horário volta).

> Como isso é um **modelo**, mantenha `barbearia/` genérico e versionado aqui.
> **Dados reais de cliente não entram neste repositório** — vão para o
> repositório próprio do cliente.

---

Feito para demonstração comercial. Ajuste marca, serviços e contatos e a
barbearia já sai agendando.
