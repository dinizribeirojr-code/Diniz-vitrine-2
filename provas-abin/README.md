# Provas da ABIN — Concursos Públicos (por ano)

> Índice e script para baixar as **provas oficiais da ABIN com gabaritos**, organizadas por ano.
> Provas e gabaritos de concurso público são **documentos públicos** das bancas (CESPE / CEBRASPE).

## Nível médio x nível superior

Na ABIN, **nível médio só existiu no concurso de 2010**, no cargo **Agente Técnico de Inteligência**
(áreas: Administração, Contabilidade, Construção Civil/Edificações, Eletrônica, Tecnologia da
Informação). Os concursos de **2018** e **2023/2024** foram **todos de nível superior**
(Oficial de Inteligência / Oficial Técnico / Agente de Inteligência).

## ⚠️ Download automático neste ambiente de nuvem

A política de rede desta sessão na nuvem **bloqueia** o acesso aos sites das bancas e agregadores
(CEBRASPE, CESPE/UnB, PCI Concursos, QConcursos). Por isso os PDFs **não são baixados aqui** — o
script foi feito para rodar **na sua máquina ou no Termux (Android)**, onde a internet é aberta.

## Como baixar (Termux / Android)

1. Setup (uma vez):
   ```bash
   pkg update -y && pkg install curl grep coreutils -y
   termux-setup-storage
   ```
2. Rode o script (baixa **nível médio** por padrão):
   ```bash
   bash baixar_provas_abin.sh          # nivel medio (Agente Tecnico 2010)
   bash baixar_provas_abin.sh superior # nivel superior
   bash baixar_provas_abin.sh tudo     # os dois
   ```
3. Os arquivos vão para **`Download/provas-abin/<ano>/`**, visível no gerenciador de arquivos.
   Cada arquivo é nomeado por área e tipo, ex.:
   `administracao__PROVA__....pdf` e `administracao__GABARITO__....pdf`.

> **Atalho na tela inicial:** no Solid Explorer (ou Meus Arquivos/Samsung), segure a pasta
> `provas-abin` → **Adicionar à tela inicial**.

### Em um computador (Linux/macOS)

Se rodar fora do Termux, o script salva na própria pasta `provas-abin/`. Requer `curl`.

## Como o script funciona

- Ele acessa a página da ABIN no PCI Concursos, **descobre sozinho as áreas** de cada cargo e baixa,
  de cada uma, a **prova** e o **gabarito** (os dois PDFs oficiais da página).
- Se a listagem mudar de formato, ele usa uma lista de áreas já confirmadas como fallback.
- Valida cada arquivo (checa se é PDF de verdade) e descarta páginas de erro.

## Questões comentadas

Gabarito oficial = grátis e público (o script pega). Já as **questões/provas comentadas** costumam ser
**conteúdo pago** e sem PDF de download direto — por isso **não entram no download automático**.
Onde procurar:

- QConcursos: <https://www.qconcursos.com/questoes-de-concursos/provas?fardo%5B%5D=ABIN>
- TEC Concursos: <https://www.tecconcursos.com.br/orgaos/abin>
- Gran Cursos / Estratégia (PDFs de "prova comentada", geralmente pagos)

---

## Concursos da ABIN — visão geral

| Ano | Banca | Nível | Cargos |
|-----|-------|-------|--------|
| 2004 | CESPE/UnB | superior | Analista de Informações |
| 2008 | CESPE/UnB | superior | Oficial de Inteligência; Agente de Inteligência |
| 2010 | CESPE/UnB | **médio** + superior | **Agente Técnico de Inteligência (médio)**; Oficial Técnico de Inteligência (superior) |
| 2018 | CEBRASPE | superior | Oficial de Inteligência; Oficial Técnico; Agente de Inteligência |
| 2023/2024 | CEBRASPE | superior | Oficial de Inteligência; Oficial Técnico de Inteligência |

## Páginas oficiais das bancas

- **2024/2018 (CEBRASPE):** <https://www.cebraspe.org.br/concursos/abin_17>
- **2010 (CESPE):** <http://www.cespe.unb.br/concursos/abin2010/>
- **2008 (CESPE):** <http://www.cespe.unb.br/concursos/ABIN2008/>
- **Agregador (todas as provas da ABIN):** <https://www.pciconcursos.com.br/provas/abin>

---

_Links levantados por busca na web (páginas oficiais das bancas e agregadores de concursos), 2026._
