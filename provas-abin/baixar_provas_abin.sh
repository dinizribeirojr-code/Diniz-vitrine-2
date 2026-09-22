#!/usr/bin/env bash
#
# baixar_provas_abin.sh
# Baixa as provas + gabaritos dos concursos da ABIN, organizados em pastas por ano.
#
# COMO USAR (na sua maquina / Termux, com internet liberada):
#   bash baixar_provas_abin.sh          # padrao: baixa NIVEL MEDIO (Agente Tecnico 2010)
#   bash baixar_provas_abin.sh medio    # so nivel medio (Agente Tecnico de Inteligencia)
#   bash baixar_provas_abin.sh superior # so nivel superior (Oficial / Oficial Tecnico / Agente)
#   bash baixar_provas_abin.sh tudo     # medio + superior
#
# Requisitos: curl. No Termux: pkg install curl grep coreutils -y && termux-setup-storage
#
# Observacao:
#   - Provas e GABARITOS oficiais sao documentos publicos e gratuitos (baixados aqui).
#   - Questoes COMENTADAS geralmente sao conteudo pago (QConcursos, TEC, Gran, Estrategia)
#     e nao tem PDF de download direto, por isso nao entram no download automatico.
#   - Na ABIN, NIVEL MEDIO so existiu no concurso de 2010 (Agente Tecnico de Inteligencia).
#     Os concursos de 2018 e 2023/2024 foram todos de nivel superior.

set -uo pipefail

MODO="${1:-medio}"
UA="Mozilla/5.0 (Android)"

# Onde salvar: se existir a pasta de armazenamento do Termux, usa a pasta Download do celular.
if [ -d "$HOME/storage/downloads" ]; then
  BASE_DIR="$HOME/storage/downloads/provas-abin"
else
  BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi
mkdir -p "$BASE_DIR"
cd "$BASE_DIR"
echo "Salvando em: $BASE_DIR"
echo "Modo: $MODO"
echo

if ! command -v curl >/dev/null 2>&1; then
  echo "ERRO: instale curl (Termux: pkg install curl grep coreutils -y)." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# baixa todas as provas + gabaritos de um cargo, descobrindo as areas sozinho
# a partir da pagina da ABIN no PCI Concursos.
#   $1 = prefixo do slug do cargo (ex.: agente-tecnico-de-inteligencia)
#   $2 = ano (pasta de destino)
#   $3 = fallback: lista de slugs completos, um por linha (se a descoberta falhar)
# ---------------------------------------------------------------------------
baixar_cargo() {
  local prefixo="$1" ano="$2" fallback="$3"
  mkdir -p "$ano"

  echo "== Procurando areas de '$prefixo' ($ano) =="
  local links
  links=$(curl -fsSL -A "$UA" "https://www.pciconcursos.com.br/provas/abin" \
    | grep -oE "/provas/download/${prefixo}[a-z0-9-]*${ano}" | sort -u)
  if [ -z "$links" ]; then
    echo "   (usando lista de areas conhecidas)"
    links="$fallback"
  fi

  local path slug nome html pdfs pdf base tag out
  for path in $links; do
    [ -z "$path" ] && continue
    slug=$(basename "$path")
    nome="${slug#${prefixo}-}"; nome="${nome%-abin-cespe-${ano}}"
    echo ">> AREA: $nome"
    html=$(curl -fsSL -A "$UA" "https://www.pciconcursos.com.br$path")
    pdfs=$(echo "$html" | grep -oE 'https?://[^"'"'"' ]+\.pdf' | sort -u)
    if [ -z "$pdfs" ]; then echo "   nenhum PDF encontrado"; continue; fi
    for pdf in $pdfs; do
      base=$(basename "$pdf")
      case "$base" in
        *gab*|*Gab*|*abarito*) tag="GABARITO";;
        *) tag="PROVA";;
      esac
      out="$ano/${nome}__${tag}__${base}"
      echo "   $tag <- $base"
      if curl -fsSL -A "$UA" -o "$out" "$pdf"; then
        head -c4 "$out" | grep -q "%PDF" || { echo "     (nao e PDF, apagando)"; rm -f "$out"; }
      else
        echo "     (falhou download)"; rm -f "$out"
      fi
    done
  done
  echo
}

# Fallbacks (areas confirmadas) caso a pagina de listagem mude de formato:
FALLBACK_MEDIO="/provas/download/agente-tecnico-de-inteligencia-administracao-abin-cespe-2010
/provas/download/agente-tecnico-de-inteligencia-eletronica-abin-cespe-2010
/provas/download/agente-tecnico-de-inteligencia-tecnologia-da-informacao-abin-cespe-2010"

FALLBACK_SUPERIOR="/provas/download/oficial-tecnico-de-inteligencia-engenharia-civil-abin-cespe-2010
/provas/download/oficial-tecnico-de-inteligencia-psicologia-abin-cespe-2010
/provas/download/oficial-de-inteligencia-area-1-abin-cespe-2018
/provas/download/agente-de-inteligencia-abin-cespe-2018"

case "$MODO" in
  medio)
    baixar_cargo "agente-tecnico-de-inteligencia" "2010" "$FALLBACK_MEDIO"
    ;;
  superior)
    baixar_cargo "oficial-tecnico-de-inteligencia" "2010" "$FALLBACK_SUPERIOR"
    baixar_cargo "oficial-de-inteligencia"         "2018" "$FALLBACK_SUPERIOR"
    baixar_cargo "agente-de-inteligencia"          "2018" "$FALLBACK_SUPERIOR"
    ;;
  tudo)
    baixar_cargo "agente-tecnico-de-inteligencia"  "2010" "$FALLBACK_MEDIO"
    baixar_cargo "oficial-tecnico-de-inteligencia" "2010" "$FALLBACK_SUPERIOR"
    baixar_cargo "oficial-de-inteligencia"         "2018" "$FALLBACK_SUPERIOR"
    baixar_cargo "agente-de-inteligencia"          "2018" "$FALLBACK_SUPERIOR"
    ;;
  *)
    echo "Modo invalido: '$MODO'. Use: medio | superior | tudo" >&2
    exit 1
    ;;
esac

cat <<'EOF'
=== Questoes comentadas (nao entram no download automatico) ===
Costumam ser conteudo pago / sem PDF direto. Onde procurar:
  - QConcursos:  https://www.qconcursos.com/questoes-de-concursos/provas?fardo%5B%5D=ABIN
  - TEC Concursos: https://www.tecconcursos.com.br/orgaos/abin
  - Gran Cursos / Estrategia (PDFs de "prova comentada", geralmente pagos)
EOF

echo
echo "=== Concluido. Arquivos em: $BASE_DIR (pastas por ano) ==="
