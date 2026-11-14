#!/usr/bin/env bash
# DAST: OWASP ZAP (API scan) contra la API de noticias levantada con la imagen de Cloud Run.
# Crea únicamente recursos temporales propios; no monta keys/ ni volúmenes de datos.
# Falla si ZAP reporta alertas de riesgo alto. Reportes en dast-report/.
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
report_dir="$project_dir/dast-report"
zap_image="${ZAP_IMAGE:-ghcr.io/zaproxy/zaproxy:stable}"
suffix="$(python3 -c 'import uuid; print(uuid.uuid4().hex[:12])')"
network="news-dast-network-$suffix"
mongo="news-dast-mongo-$suffix"
api="news-dast-api-$suffix"
image="ai-assisted-news-app-dast-api:local"
cleanup() {
  docker rm -f "$api" "$mongo" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker build -q -f "$project_dir/backend/news/Dockerfile" -t "$image" "$project_dir" >/dev/null
docker network create --internal "$network" >/dev/null
docker run --rm -d --name "$mongo" --network "$network" \
  --tmpfs /data/db:rw,size=1024m -e GLIBC_TUNABLES=glibc.pthread.rseq=1 mongo:8.0 >/dev/null

api_env=(
  -e NEWS_DB_MODE=local
  -e NEWS_MONGODB_REQUIRED=true
  -e NEWS_MONGODB_DATABASE=ai_assisted_news
  -e "NEWS_MONGODB_LOCAL_URI=mongodb://$mongo:27017/ai_assisted_news"
)
# Datos demo reproducibles para que el escaneo recorra respuestas reales.
for attempt in $(seq 1 30); do
  if docker run --rm --network "$network" "${api_env[@]}" "$image" \
    python -m news.bootstrap >/dev/null 2>&1; then
    break
  fi
  [ "$attempt" -eq 30 ] && { echo "No se pudo inicializar MongoDB efímera." >&2; exit 1; }
  sleep 2
done

# Alias fijo: los reportes muestran news-api y no el nombre temporal del contenedor.
docker run --rm -d --name "$api" --network "$network" --network-alias news-api "${api_env[@]}" "$image" >/dev/null
for attempt in $(seq 1 30); do
  docker run --rm --network "$network" curlimages/curl:8.17.0 -fsS "http://news-api:8020/health" \
    >/dev/null 2>&1 && break
  [ "$attempt" -eq 30 ] && { echo "La API no respondió /health." >&2; exit 1; }
  sleep 2
done

rm -rf "$report_dir" && mkdir -p "$report_dir" && chmod 777 "$report_dir"
# -I: las advertencias no detienen el script; el criterio de corte se aplica abajo.
docker run --rm --network "$network" -v "$report_dir:/zap/wrk:rw" "$zap_image" \
  zap-api-scan.py -t "http://news-api:8020/openapi.json" -f openapi \
  -r zap-report.html -J zap-report.json -I

python3 - "$report_dir/zap-report.json" <<'EOF'
import json, sys
alerts = [a for site in json.load(open(sys.argv[1]))["site"] for a in site["alerts"]]
names = {"3": "Alto", "2": "Medio", "1": "Bajo", "0": "Informativo"}
for code in ("3", "2", "1", "0"):
    found = sorted({a["name"] for a in alerts if a["riskcode"] == code})
    print(f"{names[code]}: {len(found)}" + "".join(f"\n  - {n}" for n in found))
sys.exit(1 if any(a["riskcode"] == "3" for a in alerts) else 0)
EOF
