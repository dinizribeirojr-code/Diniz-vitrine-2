# Migrar a hospedagem para o Cloudflare Pages

Motivo: economia. O Cloudflare Pages tem banda **ilimitada** no plano gratuito,
mantem o deploy automatico a partir do branch `main` (igual ao Netlify) e suporta
o arquivo `_headers`, que preserva a regra de cache do projeto — sem ela o CSS/JS
recebe cabecalho imutavel e a pagina volta a aparecer com estilo velho.

O site continua no ar no Netlify durante todo o processo. So se troca de endereco
no ultimo passo, quando o Cloudflare ja estiver publicando.

## O que ja esta pronto no repositorio

- **`_headers`** — replica as regras do `netlify.toml` (seguranca + cache).
  Enquanto o site estiver no Netlify, quem manda continua sendo o `netlify.toml`;
  o `_headers` so entra em acao no deploy pelo Cloudflare.

## Passos no painel do Cloudflare (feitos pelo dono — precisa de login)

1. Criar conta em https://dash.cloudflare.com (gratis).
2. **Workers & Pages -> Create -> Pages -> Connect to Git** e escolher este
   repositorio.
3. Configuracao de build:
   - Framework preset: **None**
   - Build command: **(vazio)**
   - Build output directory: **`/`** (a raiz — o site e estatico, sem build)
   - Production branch: **`main`**
4. Salvar e fazer o primeiro deploy. O site sai num endereco tipo
   `genesis-websites.pages.dev`.

## Passo final: trocar o endereco (so quando o Cloudflare ja publicar)

Quando decidir apontar o dominio de vez para o Cloudflare, atualizar os **tres**
pontos de endereco no `index.html` (o CLAUDE.md alerta sobre isso):

- `<link rel="canonical">`
- `<meta property="og:url">`
- a `url` dentro do bloco JSON-LD no `<head>`

Se usar um dominio proprio (recomendado, em vez do `.pages.dev`), aponta-lo no
Cloudflare em **Custom domains** e usar esse endereco nos tres pontos acima.

Depois que o Cloudflare estiver no ar e estavel, desligar o deploy do Netlify
(ou so parar de usar) para nao pagar/gastar credito a toa.

## Observacao sobre o susto dos creditos

O site inteiro tem ~5 MB (a maior parte e video, com cache de 1 ano). No plano
gratuito do Netlify (100 GB de banda/mes) isso aguenta muita visita antes de
chegar perto do limite, e o site nao tem build, entao nao gasta minuto de build.
Vale conferir no painel do Netlify em que plano a conta esta antes de assumir
que os creditos vao acabar.
