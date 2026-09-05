# Stack de ferramentas — o que uma agência usa (curado do GitHub)

> Levantamento feito buscando no GitHub inteiro (não só neste repositório), por
> categoria, filtrando pelo jeito da Genesis vender: WhatsApp como canal, cliente
> pequeno, e **nada de dado de cliente neste repositório público**. Números de
> estrelas conferidos em **05/09/2026**. Todos são open-source; a maioria tem versão
> em nuvem paga além do self-hosted.

## Como ler esta lista

- Nenhuma destas ferramentas mora no repositório da Genesis. São a **operação do
  dono** — rodam em servidor próprio (self-hosted) ou na nuvem paga de cada uma.
  Dado de cliente continua fora do controle de versão.
- **Não instale tudo.** Comece por 2–3 (ver "Stack inicial" no fim). Cada serviço
  self-hosted é um servidor a manter.
- ⚠️ = tem armadilha que pode custar caro à Genesis. Leia o aviso.

---

## ⚠️ Aviso que vem antes de tudo: WhatsApp

O número **(21) 99681-6846** é o canal de vendas inteiro da Genesis. Perdê-lo por
banimento é perder o negócio. Por isso, sobre as APIs de WhatsApp:

- **Não-oficiais** — automatizam o WhatsApp Web fazendo engenharia reversa. São as mais
  populares no Brasil e muito poderosas, **mas violam os Termos do WhatsApp e podem
  banir o número**:
  - [`WhiskeySockets/Baileys`](https://github.com/WhiskeySockets/Baileys) (11k⭐) — a
    base de quase todas.
  - [`evolution-foundation/evolution-api`](https://github.com/evolution-foundation/evolution-api) (9,5k⭐) — a mais usada no BR, integra Typebot/Chatwoot/n8n.
  - [`wwebjs/whatsapp-web.js`](https://github.com/wwebjs/whatsapp-web.js) (22,5k⭐) e
    [`devlikeapro/waha`](https://github.com/devlikeapro/waha) (7,3k⭐).
- **Oficial** — **WhatsApp Business Platform (Cloud API)**, da Meta, direto ou por um
  BSP. Não bane porque é o caminho autorizado. É o que a Genesis deve usar no número
  principal.

**Regra da casa:** o número principal só no caminho oficial. Se um dia testar API
não-oficial, que seja **num chip separado**, nunca no (21) 99681-6846.

---

## 1. Atendimento — a caixa de entrada (o canal-mãe)

- **[`chatwoot/chatwoot`](https://github.com/chatwoot/chatwoot) — 36,5k⭐** · Ruby
  Caixa de entrada omnichannel (alternativa ao Intercom/Zendesk). Junta WhatsApp
  (via API **oficial**), Instagram Direct e e-mail num painel só. Resolve o "onde eu
  organizo as conversas" sem violar regra nenhuma — é ferramenta do dono, o dado fica
  nela, fora do repo. **É a peça central do stack.**

## 2. Qualificação e captação — o robô que faz as 3 perguntas

- **[`baptisteArno/typebot.io`](https://github.com/baptisteArno/typebot.io) — 10,3k⭐** · TypeScript
  Construtor de formulário/chatbot conversacional. Faz **automaticamente as 3 perguntas
  de qualificação** do agente `vendas` (que negócio é / o que quer que o cliente faça /
  o que já tem) e entrega o lead pronto no WhatsApp. Melhor encaixe que um formulário
  estático, porque nasce dentro do fluxo de conversa. (Substitui bem o Tally que ficou
  como "decidir" no plano.)

## 3. Analytics sem cookie — mede e ainda resolve a LGPD

O `CLAUDE.md` avisa que ligar o GA4 traz cookie e obriga aviso de LGPD. Estes evitam
isso: sem cookie, sem banner, e mais leves.

- **[`umami-software/umami`](https://github.com/umami-software/umami) — 38,6k⭐** · TypeScript
  Analytics privacy-first, sem cookie. Tráfego, campanha, conversão num lugar.
- **[`plausible/analytics`](https://github.com/plausible/analytics) — 28,9k⭐** · Elixir
  Mesma ideia, leve, alternativa direta ao Google Analytics.
- **[`Openpanel-dev/openpanel`](https://github.com/Openpanel-dev/openpanel) — 6,9k⭐** — se quiser análise de produto tipo Mixpanel.

**Recomendação:** em vez de ligar o GA4, ligar **Umami** ou **Plausible** — mede de
onde vem o contato e dispensa o banner de consentimento.

## 4. Agendamento — vira feature de venda e uso interno

O case AMV é agendamento; oferecer "agende pelo site" é argumento de venda e um upsell.

- **Cal.com** (`calcom/cal.com`, líder da categoria, self-hostable) — o "Calendly open
  source". *(Não consegui puxar a contagem de estrelas nesta busca — o nome com ponto
  quebrou o filtro — mas é o padrão do mercado.)*
- **[`rbbydotdev/someday`](https://github.com/rbbydotdev/someday) — 1k⭐** — alternativa
  gratuita que roda no Google Apps Script (bom pra quem usa Gmail, custo zero).

## 5. Agendador de redes sociais — escala o `midia-social`

- **[`gitroomhq/postiz-app`](https://github.com/gitroomhq/postiz-app) — 35,5k⭐** · TypeScript
  Agenda posts para Instagram/Facebook e outras redes. Tem enfoque "agentic" e um
  [`gitroomhq/postiz-agent`](https://github.com/gitroomhq/postiz-agent) que **conecta ao
  Claude** para programar posts. Tira o `midia-social` do trabalho manual.

## 6. E-mail marketing — nutrição de longo prazo (para o `follow-up`)

- **[`knadh/listmonk`](https://github.com/knadh/listmonk) — 23,3k⭐** · Go
  Gerenciador de newsletter/lista, binário único, rápido. Serve o follow-up de longo
  prazo com quem **autorizou** receber. *Cuidado LGPD:* só com opt-in, nunca lista
  comprada ou raspada.

## 7. Automação — a cola que junta tudo

- **[`n8n-io/n8n`](https://github.com/n8n-io/n8n) — 203k⭐** · TypeScript
  Automação visual. Costura a operação: lead responde o **Typebot** → cria conversa no
  **Chatwoot** → avisa o dono → agenda o **follow-up** → registra no analytics. É o que
  transforma ferramentas soltas em processo. Self-hostável, tem nós nativos de Claude.

## 8. Contrato e cobrança — profissionaliza o fechamento

- **[`documenso/documenso`](https://github.com/documenso/documenso) — 14,9k⭐** · TypeScript
  Assinatura eletrônica (alternativa ao DocuSign). Contrato de serviço assinado = mais
  profissional e menos calote.
- **Invoice Ninja** (`invoiceninja/invoiceninja`) — orçamento, fatura e proposta.
  (A busca retornou o app Flutter [`invoiceninja/admin-portal`](https://github.com/invoiceninja/admin-portal); o projeto principal é o backend Laravel.)

## 9. Entrega mais rápida e produto de entrada

- **[`GrapesJS/grapesjs`](https://github.com/GrapesJS/grapesjs) — 26,2k⭐** · TypeScript
  Web builder drag-and-drop. *Poderia* acelerar montar landing de cliente, mas muda o
  workflow atual (HTML na mão, que dá controle total). Fica como opção a avaliar, não
  troca obrigatória.
- **Link-in-bio como porta de entrada barata** para cliente que só tem Instagram —
  vende-se a "página de links" barata e faz-se upsell pra landing completa:
  [`fayazara/onelink`](https://github.com/fayazara/onelink) (1k⭐, dados na própria URL,
  custo zero) ou [`vanxh/openbio`](https://github.com/vanxh/openbio) (361⭐).

---

## Stack inicial recomendado (comece por estes 3)

Casado com o gargalo de hoje — organizar o atendimento e converter o contato que já
chega, antes de escalar tráfego:

1. **Chatwoot + WhatsApp Business API oficial** — uma caixa de entrada só, sem risco de
   banir o número.
2. **Typebot** — qualifica sozinho (as 3 perguntas) e entrega o lead pronto no WhatsApp.
3. **Umami** (ou Plausible) — descobre de onde vem o contato, sem dor de LGPD.

**Fase 2, quando o volume justificar:** Postiz (escala social) · n8n (a cola) ·
Cal.com (agendamento como feature/upsell) · Documenso (contrato no fechamento).

## Duas verdades para não frustrar

- **Self-hosted tem custo de manutenção.** Cada serviço é um servidor a cuidar. Se não
  houver quem administre, use a **nuvem paga** de cada um — sai mais caro por mês, mas
  não trava a operação. Decidir isso caso a caso.
- **Ferramenta não substitui prova social.** O gargalo nº 1 continua sendo transformar
  os 3 projetos em preparação em case. O stack faz a Genesis parecer (e operar como) uma
  agência de primeira; os cases fazem ela ser contratada como uma.
