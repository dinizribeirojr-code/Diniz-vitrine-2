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

## 💰 Orçamento é ZERO — o que fazer HOJE sem gastar nada

As ferramentas open-source abaixo, na prática, custam dinheiro: self-hosted precisa de
servidor (~US$5/mês pra cima) e a nuvem de cada uma é paga. **Com orçamento zero, elas
ficam para a fase 2** (quando entrar receita, ou quando houver quem administre um
servidor de graça). Enquanto isso, dá para operar como agência **sem pagar nada**, com
o gratuito equivalente de cada função:

| Função | Versão paga (fase 2) | **O que usar agora — grátis** |
|---|---|---|
| Atendimento / "CRM" | Chatwoot | **App WhatsApp Business** — etiquetas, respostas rápidas, catálogo, mensagem de ausência. É o mini-CRM grátis. |
| Qualificar lead | Typebot | **Links `wa.me` com mensagem pré-preenchida** (já existem no site!) + **respostas rápidas** do WhatsApp Business com as 3 perguntas. |
| Analytics sem cookie | Umami / Plausible | **Cloudflare Web Analytics** (grátis, sem cookie, resolve a LGPD) ou o **GA4** que já está pronto no repo (grátis). |
| Agendar posts | Postiz | **Meta Business Suite** — agenda Instagram + Facebook nativo, de graça. |
| Aparecer na busca | (—) | **Google Meu Negócio** — grátis, coloca a Genesis (e cada cliente) no mapa e na busca local do Rio. **Maior retorno por custo zero.** |
| Agendamento | Cal.com | **Google Agenda — horários de atendimento** (appointment schedule), grátis. |
| E-mail / follow-up | Listmonk | **Gmail** (já conectado) para follow-up manual em volume baixo. |
| Automação | n8n | **Manual** — em volume baixo não precisa de automação. |
| Contrato | Documenso | **Modelo de proposta** em PDF/Docs + confirmação por WhatsApp. |
| Hospedar o site | (—) | **Netlify free** — já é o que a Genesis usa. |
| Arte / vídeo | (assinaturas) | **Canva, Unsplash, ElevenLabs, Descript** — já conectados nesta sessão, sem custo extra pra você. |

**Tráfego pago (Google Ads e Meta Ads) fica para depois.** Sem verba, o topo do funil
roda 100% nos canais gratuitos — que já eram a prioridade da Genesis: prospecção
(porta/telefone/indicação), **parcerias/indicação**, **Instagram orgânico**, **status de
WhatsApp** e **Google Meu Negócio**. Anúncio pago entra quando um cliente pagante
financiar o teste — nunca do próprio bolso no zero a zero.

**Resumo:** dá para montar a operação inteira hoje por **R$ 0**. A lista open-source
abaixo é o upgrade natural quando houver receita para bancar um servidor.

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

## Stack inicial — orçamento zero (montar esta semana, R$ 0)

Casado com o gargalo de hoje — organizar o atendimento e converter o contato que já
chega, sem gastar:

1. **App WhatsApp Business** — etiquetas (lead novo / orçamento enviado / cliente),
   respostas rápidas com as 3 perguntas de qualificação, mensagem de ausência. É o
   CRM-lite grátis e não corre risco de banir o número.
2. **Google Meu Negócio** — ficha da Genesis no ar, grátis, aparecendo na busca local do
   Rio. Maior retorno por custo zero, e vira serviço extra pra vender ao cliente.
3. **Cloudflare Web Analytics** (ou o GA4 já pronto no repo) — medir de onde vem o
   contato, sem cookie e sem dor de LGPD.

**Fase 1,5 (ainda grátis):** Meta Business Suite para agendar post · Google Agenda para
agendamento · Gmail para follow-up manual.

**Fase 2, quando entrar receita ou houver servidor:** Chatwoot · Typebot · Umami ·
Postiz · n8n · Cal.com · Documenso — e só então testar Google/Meta Ads, financiado por
cliente pagante, nunca do próprio bolso.

## Duas verdades para não frustrar

- **Zero de verba não trava a operação — trava só o tráfego pago.** Todos os canais que
  já eram a prioridade da Genesis (indicação, prospecção, Instagram, status, Google Meu
  Negócio) são de graça. O anúncio pago é acelerador, não fundação.
- **Ferramenta não substitui prova social.** O gargalo nº 1 continua sendo transformar
  os 3 projetos em preparação em case. Cases também custam R$ 0 e são o que mais vende.
