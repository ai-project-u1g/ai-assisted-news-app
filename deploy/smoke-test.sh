#!/usr/bin/env bash
# Verificación posterior al despliegue (docs/deploy/plan-itil-devops/02-cd/).
# Comprueba que news-api y news-chatbot sirven la imagen de este commit y que /health responde
# "ok" (incluye la conexión a MongoDB), y que Firebase Hosting responde. Es de solo lectura: no
# cambia tráfico, IAM ni secretos, y no lee keys/. En GitHub Actions escribe el resumen del job.
#
# Uso local tras un despliegue: make deploy-smoke TAG=<sha corto desplegado>
set -euo pipefail

cd "$(dirname "$0")/.."
source deploy/gcp/config.sh
require_project

TAG="${TAG:-$(git rev-parse --short HEAD)}"
SITE_URL="https://${NEWS_FIREBASE_PROJECT_ID}.web.app"
# Cloud Run escala a cero: los reintentos cubren el arranque en frío.
CURL=(curl --fail --silent --show-error --max-time 15 --retry 4 --retry-delay 5 --retry-all-errors)

failures=0
rows=()

health_ok() {
  local body
  body="$("${CURL[@]}" "$1/health")" || return 1
  [[ "$body" =~ \"status\"[[:space:]]*:[[:space:]]*\"ok\" ]]
}

# La imagen de la plantilla es la del último intento de despliegue, aunque su revisión no haya
# arrancado. Por eso también se exige que esa revisión esté lista y reciba el 100 % del tráfico.
describe_fields() {
  python3 -c '
import json, sys
service = json.load(sys.stdin)
status = service.get("status", {})
serving = [t.get("revisionName", "") for t in status.get("traffic", []) if t.get("percent") == 100]
image = service.get("spec", {}).get("template", {}).get("spec", {}).get("containers", [{}])[0].get("image", "")
print(status.get("url", "") or "-", status.get("latestCreatedRevisionName", "") or "-",
      status.get("latestReadyRevisionName", "") or "-", (serving or ["-"])[0] or "-", image or "-")
'
}

for service in "$NEWS_API_SERVICE" "$CHATBOT_SERVICE"; do
  url="-" revision="-" ready="-" serving="-" image="-"
  if described="$(gcloud run services describe "$service" --project "$PROJECT_ID" --region "$REGION" --format=json)"; then
    read -r url revision ready serving image <<<"$(describe_fields <<<"$described")" || true
  fi

  if [[ "$url" == "-" ]]; then
    result="No se pudo consultar el servicio"
  elif [[ "$image" != *":${TAG}" ]]; then
    result="Imagen distinta a :${TAG}"
  elif [[ "$ready" != "$revision" ]]; then
    result="La revisión nueva no arrancó; sirve ${ready}"
  elif [[ "$serving" != "$revision" ]]; then
    result="El tráfico no está en la revisión nueva"
  elif ! health_ok "$url"; then
    result="/health no respondió status ok"
  else
    result="OK"
  fi
  [[ "$result" == "OK" ]] || failures=$((failures + 1))
  rows+=("| \`${service}\` | \`${revision:--}\` | \`${image##*/}\` | ${result} |")
done

if "${CURL[@]}" -o /dev/null "${SITE_URL}/"; then
  site="OK"
else
  site="El sitio no respondió"
  failures=$((failures + 1))
fi
rows+=("| Hosting (${SITE_URL}) | - | - | ${site} |")

summary="### Verificación del despliegue \`${TAG}\`

| Componente | Revisión | Imagen | Resultado |
| --- | --- | --- | --- |
$(printf '%s\n' "${rows[@]}")"

echo "$summary"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  echo "$summary" >> "$GITHUB_STEP_SUMMARY"
fi

if (( failures > 0 )); then
  echo "::error::La verificación posterior al despliegue falló en ${failures} componente(s). Ver docs/deploy/pipeline-paso-a-paso.md#volver-a-una-versión-anterior." >&2
  exit 1
fi
