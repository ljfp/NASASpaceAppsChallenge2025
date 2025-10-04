#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
PYTHON_BIN="${PYTHON_BIN:-/usr/bin/python3}"
SERVICE_NAME="${SERVICE_NAME:-nasaspaceapps}"
UVICORN_PORT="${UVICORN_PORT:-8000}"

if [ ! -d ".venv" ]; then
  "${PYTHON_BIN}" -m venv .venv
fi

# shellcheck source=/dev/null
source .venv/bin/activate
pip install --upgrade pip wheel
pip install -r requirements.txt

deactivate || true

LOG_DIR="${APP_DIR}/logs"
mkdir -p "${LOG_DIR}"

if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl daemon-reload || true
  if sudo systemctl list-unit-files | grep -q "^${SERVICE_NAME}\.service"; then
    sudo systemctl restart "${SERVICE_NAME}.service"
    exit 0
  fi
fi

echo "systemd unit ${SERVICE_NAME}.service not found or unavailable. Relaunching Uvicorn with nohup."

pkill -f "uvicorn src.server:app" || true
nohup "${APP_DIR}/.venv/bin/uvicorn" src.server:app --host 0.0.0.0 --port "${UVICORN_PORT}" \
  >"${LOG_DIR}/uvicorn.log" 2>&1 &
