#!/usr/bin/env bash
#
# baixar_provas_abin.sh
# Baixa as provas oficiais dos concursos da ABIN, organizadas em pastas por ano.
#
# COMO USAR (na sua máquina, com internet liberada):
#   cd provas-abin
#   bash baixar_provas_abin.sh
#
# Requisitos: curl (ou wget). Os PDFs de "link direto" são baixados automaticamente.
# Os cadernos por área que só estão em páginas de agregador (PCI/QConcursos) são
# listados ao final para download manual pelo navegador.
#
# Observação: provas de concurso público são documentos públicos das bancas
# organizadoras (CESPE / CEBRASPE).

set -uo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Ferramenta de download
if command -v curl >/dev/null 2>&1; then
  DL() { curl -fSL --retry 3 --retry-delay 2 -A "Mozilla/5.0" -o "$2" "$1"; }
elif command -v wget >/dev/null 2>&1; then
  DL() { wget -q --tries=3 -U "Mozilla/5.0" -O "$2" "$1"; }
else
  echo "ERRO: instale curl ou wget." >&2
  exit 1
fi

baixar() {
  # baixar <ano> <url> <nome_arquivo>
  local ano="$1" url="$2" nome="$3"
  mkdir -p "$ano"
  local destino="$ano/$nome"
  echo ">> [$ano] $nome"
  if DL "$url" "$destino"; then
    # valida se veio um PDF de verdade (e não uma página de erro HTML)
    if head -c 4 "$destino" | grep -q "%PDF"; then
      echo "   OK: $destino"
    else
      echo "   AVISO: conteudo nao parece PDF (verifique manualmente): $destino"
    fi
  else
    echo "   FALHOU: $url"
    rm -f "$destino"
  fi
}

echo "=== Baixando provas da ABIN (links diretos) ==="

# ---------------- 2018 (CEBRASPE / abin_17) ----------------
baixar 2018 \
  "https://cdn.cebraspe.org.br/concursos/abin_17/arquivos/378_ABIN_DISC_001_02_ADAPTADA.PDF" \
  "ABIN_2018_prova_discursiva.pdf"
baixar 2018 \
  "https://arquivos.qconcursos.com/prova/arquivo_prova/56596/cespe-2018-abin-agente-de-inteligencia-prova.pdf" \
  "ABIN_2018_agente_de_inteligencia_prova.pdf"

# ---------------- 2024 / 2023 (CEBRASPE) — padrões de resposta definitivos ----------------
baixar 2024 \
  "https://cdn.cebraspe.org.br/concursos/abin_17/arquivos/ABIN_17_PADR__O_DEFINITIVO_CARGO_1.PDF" \
  "ABIN_padrao_definitivo_cargo1_oficial_de_inteligencia.pdf"
baixar 2024 \
  "https://cdn.cebraspe.org.br/concursos/abin_17/arquivos/ABIN_17_PADR__O_DEFINITIVO_CARGO_2.PDF" \
  "ABIN_padrao_definitivo_cargo2_oficial_tecnico_de_inteligencia.pdf"

# ---------------- 2010 (CESPE/UnB) — edital ----------------
baixar 2010 \
  "http://www.cespe.unb.br/concursos/abin2010/arquivos/ED_1_2010_ABIN_ABT_FINAL___03.09.2010.PDF" \
  "ABIN_2010_edital_ABT.pdf"

# ---------------- 2008 (CESPE/UnB) — edital ----------------
baixar 2008 \
  "http://www.cespe.unb.br/concursos/ABIN2008/arquivos/ED_1_2008_ABIN_ABT.PDF" \
  "ABIN_2008_edital.pdf"

cat <<'EOF'

=== Cadernos por cargo/área — baixe pelo navegador nas paginas abaixo ===

2024/2023 (CEBRASPE):
  - Pagina oficial: https://www.cebraspe.org.br/concursos/abin_17
  - PCI Concursos:  https://www.pciconcursos.com.br/provas/abin
  - QConcursos:     https://www.qconcursos.com/questoes-de-concursos/provas?fardo%5B%5D=ABIN

2018 (CEBRASPE):
  - Oficial de Inteligencia - Area 1: https://www.pciconcursos.com.br/provas/download/oficial-de-inteligencia-area-1-abin-cespe-2018
  - Oficial Tecnico - Area 8:         https://www.pciconcursos.com.br/provas/download/oficial-tecnico-de-inteligencia-area-8-abin-cespe-2018
  - Agente de Inteligencia:           https://www.pciconcursos.com.br/provas/download/agente-de-inteligencia-abin-cespe-2018

2010 (CESPE):
  - Pagina oficial: http://www.cespe.unb.br/concursos/abin2010/
  - Agente Tecnico - Administracao:   https://www.pciconcursos.com.br/provas/download/agente-tecnico-de-inteligencia-administracao-abin-cespe-2010
  - Agente Tecnico - TI:              https://www.pciconcursos.com.br/provas/download/agente-tecnico-de-inteligencia-tecnologia-da-informacao-abin-cespe-2010
  - Oficial Tecnico - Eng. Civil:     https://www.pciconcursos.com.br/provas/download/oficial-tecnico-de-inteligencia-engenharia-civil-abin-cespe-2010

2008 (CESPE):
  - Pagina oficial: http://www.cespe.unb.br/concursos/ABIN2008/
  - Oficial de Inteligencia:          https://www.pciconcursos.com.br/provas/download/oficial-de-inteligencia-abin-cespe-2008
  - Agente de Inteligencia:           https://www.pciconcursos.com.br/provas/download/agente-de-inteligecia-abin-cespe-2008

2004 (CESPE):
  - Analista de Informacoes:          https://www.pciconcursos.com.br/provas/download/analista-de-informacoes-abin-cespe-2004
  - Todas as provas da ABIN:          https://www.pciconcursos.com.br/provas/abin

Consulte tambem o indice completo em README.md.
EOF

echo
echo "=== Concluido. Arquivos organizados nas pastas por ano dentro de provas-abin/ ==="
