# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que este repositório é

A landing page comercial da **Genesis Landing Pages**, empresa que vende criação de landing pages
para pequenos negócios. É uma única página estática (`index.html`), sem build, sem
dependências, sem framework.

**Limite mais importante deste repositório:** os sites dos clientes NÃO moram aqui.
Cada cliente tem repositório e site próprios (o AMV JR Tour, por exemplo, vive em
`amv-tour-fernando.netlify.app`). Aqui entram apenas a **imagem de capa** e o **link**
do projeto, na seção de portfólio. Nunca replique, recrie ou embuta o código de um
site de cliente dentro da Genesis — ela deve continuar sendo uma única página comercial.

## A equipe (agentes)

Cinco agentes em `.claude/agents/`, invocáveis pelo nome:

| Agente | Cuida de |
|---|---|
| `vendas` | Atendimento, qualificação, objeção, proposta |
| `midia-social` | Instagram @genesis.ia.pro, post, Reels, calendário |
| `design` | Visual das páginas, capas, identidade, responsividade |
| `google-ads` | Campanha, palavra-chave, anúncio, acompanhamento de verba |
| `entrega` | Produção do site do cliente, publicação, atualização do portfólio |

Dois limites valem para todos: nenhum deles anuncia como entregue um projeto que
não foi, e `google-ads` planeja mas nunca executa alteração de verba sem aprovação
explícita do dono.

**Dado de cliente não entra neste repositório.** Este repositório é público, e a
decisão do dono é que ele continue assim: nome, telefone, valor cobrado, proposta e
histórico de negociação ficam no WhatsApp e no e-mail dele, fora do controle de
versão. Os agentes redigem a mensagem; quem fala com o cliente e guarda os dados é
o dono.

Na prática isso significa: nunca crie arquivo de CRM, planilha de clientes, lista de
leads ou pasta `clientes/` aqui. Se uma tarefa parecer exigir isso, entregue o texto
pronto na conversa em vez de gravar em arquivo.

## Comandos

Não há build, testes nem linter. Para trabalhar:

```bash
# servir localmente
python3 -m http.server 8811     # depois abra http://localhost:8811/index.html
```

Para conferir visual e responsividade, o Chromium do Playwright já está instalado
(`/opt/pw-browsers/chromium`, pacote em `/opt/node22/lib/node_modules/playwright`).
Verifique sempre em **390px, 820px e 1280px** e cheque overflow horizontal:

```js
document.documentElement.scrollWidth > document.documentElement.clientWidth  // deve ser false
```

Ao tirar screenshot da página inteira, force a animação de entrada antes, senão as
seções abaixo da dobra saem em branco e parecem quebradas:

```js
document.querySelectorAll('[data-reveal]').forEach(e => e.classList.add('is-visible'));
```

## Deploy e a regra de cache

Netlify, ligado ao branch `main` deste repositório, com `publish = "."`. Todo merge em
`main` publica automaticamente.

**CSS e JS nunca podem receber `Cache-Control: immutable`.** Os nomes dos arquivos não
têm hash de conteúdo, então um cabeçalho imutável faz o navegador servir HTML novo com
folha de estilo antiga — a página aparece sem chips, com botões da paleta velha e
imagens em tamanho natural. `immutable` também instrui o navegador a não revalidar,
então nem recarregar forçado resolve.

O `netlify.toml` já trata disso: `css`, `js` e `img` revalidam a cada visita
(a CDN responde 304 quando nada muda) e só `video` tem cache longo. Mantenha assim.

Se um dia um cabeçalho imutável escapar para produção, a única saída confiável é
**renomear o arquivo** (`style.v2.css` → `style.v3.css`) para forçar uma URL nova.
Foi por isso que os arquivos atuais têm sufixo `.v2`.

## Identidade visual

Dark premium. Todos os valores vivem como custom properties no `:root` de
`assets/css/style.v2.css` — mude a paleta ali, não nos componentes:

- Fundo grafite (`--bg: #08080b`, `--bg-alt: #0e0e14`)
- Acento em gradiente roxo → azul (`--accent-1: #7c5cff`, `--accent-2: #4d9fff`)
- Bordas em branco translúcido (`--line`), nunca coloridas
- Verde do WhatsApp (`--whatsapp`) é cor funcional, fica fora da paleta de acento
- Tipografia: Plus Jakarta Sans (títulos) + Inter (texto), via Google Fonts

A página é deliberadamente de tema único (escuro). Não há variante clara — pinte
sempre fundo e cores explicitamente.

## Estrutura e convenções

Ordem das seções no `index.html`, cada uma com `id` usado pela navegação:
`hero → #servico → #projetos → #comparativo → #planos → #diferencial → #faq → #contato`.

**Breakpoints ficam centralizados no fim do CSS** (640 / 860 / 900 / 1024px), não
espalhados junto aos componentes. A única exceção é o botão flutuante do WhatsApp,
que tem um `@media` local logo abaixo da própria regra.

**Animação de entrada:** qualquer elemento com `[data-reveal]` é revelado por um
IntersectionObserver em `assets/js/main.v2.js`. Seção nova precisa do atributo, senão
nasce invisível — o observer também respeita `prefers-reduced-motion`.

**Cards de projeto** (`.project-card`) são o ponto que mais muda. Para atualizar um:
trocar o `src` da capa, trocar o `href` do botão e trocar a classe de status
(`is-done` / `is-soon`). Um card sem link real **não deve ter** o botão "Ver projeto".
Há um comentário no HTML acima da seção com esses passos.

Há dois tipos de capa, e a distinção importa:

- **Screenshot de site real** (ex.: `amv-tour.jpg`) — recebe um véu escuro e
  `brightness(.82)` para não estourar em branco no tema escuro; ambos abrem no hover.
- **Arte de capa** gerada para projetos ainda não entregues (`capa-*.jpg`) — leva a
  classe extra `.is-art`, que dispensa véu e escurecimento porque a imagem já nasce
  escura. Sem essa classe ela fica escurecida duas vezes e o ícone some.

Arte de capa é permitida para representar um segmento, mas **nunca** fabrique um
screenshot de site que não existe, e nunca marque como `is-done` um projeto que não
foi entregue — o status é o que separa portfólio de propaganda enganosa.

**Fotos da Unsplash (via conector):** o `images.unsplash.com` é bloqueado pelo proxy
do sandbox, então as URLs `raw`/`full`/`regular` da busca não baixam. O que funciona
é o campo `small_s3`, que aponta para outro host:

```
https://s3.us-west-2.amazonaws.com/images.unsplash.com/small/<photo-id>
```

Só o caminho `/small/` responde (os demais dão 403), e ele entrega **400px de
largura** — suficiente para o card, mas não para uso em tela cheia. A licença da
Unsplash permite uso comercial sem atribuição obrigatória.

**Capas de projeto revalidam no cache justamente porque são trocadas mantendo o mesmo
nome de arquivo.** Se trocar o vídeo em `assets/video/`, use nome novo — ele tem
cache de um ano.

## Medição de contatos

`assets/js/analytics.v1.js` conta cliques nos botões de WhatsApp, marcando de qual
seção o clique veio (`hero`, `planos`, `contato`, `botao-flutuante`, `cabecalho`,
`rodape`). Serve para descobrir o que traz contato, não só quantos vieram.

Ele nasce **desligado**: enquanto `GA4_ID`, `ADS_ID` e `ADS_LABEL` estiverem vazios
no topo do arquivo, nada é carregado, nenhum cookie é criado e nenhuma requisição
sai. Para ligar, basta preencher os identificadores — não mexa no resto.

Quando for ligado, a página passa a usar cookie do Google Analytics. Vale colocar
uma linha sobre isso no rodapé para ficar em dia com a LGPD.

## Contato e SEO

O WhatsApp `5521996816846` aparece em ~9 links, cada um com mensagem pré-preenchida
diferente conforme a seção. Ao trocar o número, troque em todos, incluindo o
JSON-LD no `<head>`.

O `<head>` carrega dois blocos JSON-LD (`Service` e `FAQPage`) mais as metatags
Open Graph. Ao editar o FAQ visível, atualize o `FAQPage` junto, senão os dados
estruturados divergem do conteúdo da página.
