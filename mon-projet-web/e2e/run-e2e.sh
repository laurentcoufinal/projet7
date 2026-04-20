#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BASE_URL="${BASE_URL:-http://localhost:8081}"

cleanup() {
  cd "${PROJECT_DIR}"
  docker compose down >/dev/null 2>&1 || true
}

trap cleanup EXIT

wait_for_endpoint() {
  local url="$1"
  local retries=30
  local sleep_seconds=2

  for ((i = 1; i <= retries; i++)); do
    if curl -sf "${url}" >/dev/null; then
      return 0
    fi
    sleep "${sleep_seconds}"
  done

  echo "Endpoint indisponible: ${url}"
  return 1
}

echo "[E2E] Build et demarrage des services..."
cd "${PROJECT_DIR}"
docker compose up -d --build

echo "[E2E] Attente readiness gateway..."
wait_for_endpoint "${BASE_URL}/api/auth/health"

echo "[E2E] Test login auth..."
LOGIN_RESPONSE="$(curl -sS -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"client","password":"client123"}')"

TOKEN="$(LOGIN_RESPONSE="${LOGIN_RESPONSE}" python3 - <<'PY'
import json
import os
payload = json.loads(os.environ["LOGIN_RESPONSE"])
print(payload["token"])
PY
)"

if [[ -z "${TOKEN}" ]]; then
  echo "Token auth absent"
  exit 1
fi

echo "[E2E] Test profile auth..."
PROFILE_RESPONSE="$(curl -sS "${BASE_URL}/api/auth/profile" -H "Authorization: Bearer ${TOKEN}")"
PROFILE_ROLE="$(PROFILE_RESPONSE="${PROFILE_RESPONSE}" python3 - <<'PY'
import json
import os
payload = json.loads(os.environ["PROFILE_RESPONSE"])
print(payload["role"])
PY
)"
[[ "${PROFILE_ROLE}" == "client" ]] || { echo "Role profile inattendu: ${PROFILE_ROLE}"; exit 1; }

echo "[E2E] Test catalogue voitures..."
CARS_RESPONSE="$(curl -sS "${BASE_URL}/api/products/cars")"
CARS_COUNT="$(CARS_RESPONSE="${CARS_RESPONSE}" python3 - <<'PY'
import json
import os
payload = json.loads(os.environ["CARS_RESPONSE"])
print(len(payload["items"]))
PY
)"
[[ "${CARS_COUNT}" -ge 8 ]] || { echo "Nombre de voitures insuffisant: ${CARS_COUNT}"; exit 1; }

echo "[E2E] Test FAQ..."
FAQ_RESPONSE="$(curl -sS "${BASE_URL}/api/products/faq")"
FAQ_COUNT="$(FAQ_RESPONSE="${FAQ_RESPONSE}" python3 - <<'PY'
import json
import os
payload = json.loads(os.environ["FAQ_RESPONSE"])
print(len(payload["items"]))
PY
)"
[[ "${FAQ_COUNT}" -eq 10 ]] || { echo "Nombre de FAQ inattendu: ${FAQ_COUNT}"; exit 1; }

echo "[E2E] Test flux chat..."
SESSION_RESPONSE="$(curl -sS -X POST "${BASE_URL}/api/chat/sessions" \
  -H "Content-Type: application/json" \
  -d '{"clientName":"Client E2E"}')"
SESSION_ID="$(SESSION_RESPONSE="${SESSION_RESPONSE}" python3 - <<'PY'
import json
import os
payload = json.loads(os.environ["SESSION_RESPONSE"])
print(payload["item"]["id"])
PY
)"

curl -sS -X POST "${BASE_URL}/api/chat/sessions/${SESSION_ID}/messages" \
  -H "Content-Type: application/json" \
  -d '{"senderRole":"client","senderName":"Client E2E","content":"Bonjour depuis E2E"}' >/dev/null

MESSAGES_RESPONSE="$(curl -sS "${BASE_URL}/api/chat/sessions/${SESSION_ID}/messages")"
MESSAGE_COUNT="$(MESSAGES_RESPONSE="${MESSAGES_RESPONSE}" python3 - <<'PY'
import json
import os
payload = json.loads(os.environ["MESSAGES_RESPONSE"])
print(len(payload["items"]))
PY
)"
[[ "${MESSAGE_COUNT}" -ge 1 ]] || { echo "Aucun message chat persiste"; exit 1; }

echo "[E2E] Tous les tests E2E sont passes."
